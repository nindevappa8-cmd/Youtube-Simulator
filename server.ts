import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EDITORS,
  GAMES,
  GPUS,
  LAPTOPS,
  STOCK_REFRESH_SECONDS,
  calculateSubscribersGained,
  calculateVideoEarnings,
  getEditorById,
  getGameById,
  getGpuById,
  getLaptopById,
} from './src/lib/gameData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const FIREBASE_CONFIG_PATH = path.resolve(__dirname, 'firebase-applet-config.json');

interface FirebaseAppletConfig {
  projectId: string;
}

function loadFirebaseProjectId(): string {
  try {
    const raw = fs.readFileSync(FIREBASE_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as FirebaseAppletConfig;
    return parsed.projectId || '';
  } catch {
    return '';
  }
}

const FIREBASE_PROJECT_ID = loadFirebaseProjectId();

// Google public x509 cert cache for Firebase ID token verification (requires zero IAM)
let cachedCerts: Record<string, string> = {};
let certsExpiresAt = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < certsExpiresAt && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }
  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!resp.ok) {
    throw new Error('Failed to fetch Firebase public verification certificates.');
  }
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedCerts = (await resp.json()) as Record<string, string>;
  certsExpiresAt = now + maxAgeSec * 1000;
  return cachedCerts;
}

function base64UrlDecode(str: string): Buffer {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

async function verifyFirebaseIdToken(authHeader: string | undefined): Promise<VerifiedFirebaseUser> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Authorization Bearer token.');
  }
  if (!FIREBASE_PROJECT_ID) {
    throw new Error('Firebase project configuration is missing.');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Firebase ID token.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlDecode(headerB64).toString('utf-8')) as {
    alg?: string;
    kid?: string;
  };
  const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf-8')) as {
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    email?: string;
    email_verified?: boolean;
  };

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Invalid ID token algorithm or key ID.');
  }

  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error('Unknown Firebase ID token signing key.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();

  const signature = base64UrlDecode(signatureB64);
  const validSig = verifier.verify(cert, signature);
  if (!validSig) {
    throw new Error('Invalid Firebase ID token signature.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  if (payload.aud !== FIREBASE_PROJECT_ID || payload.iss !== expectedIssuer) {
    throw new Error('Firebase ID token audience or issuer mismatch.');
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Firebase ID token subject missing.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Firebase ID token expired.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Firebase ID token issued-at timestamp invalid.');
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : '',
    emailVerified: Boolean(payload.email_verified),
  };
}

// Persistent server-side 3-minute market stock engine
interface StockSnapshot {
  cycleIndex: number;
  nextRefreshAt: number;
  laptops: Record<string, boolean>;
  gpus: Record<string, boolean>;
  games: Record<string, boolean>;
  editors: Record<string, boolean>;
}

const cycleStockCache = new Map<number, StockSnapshot>();

function rollStockChance(chancePercent: number): boolean {
  if (chancePercent >= 100) return true;
  if (chancePercent <= 0) return false;
  const roll = (crypto.randomInt(0, 100000) / 1000);
  return roll < chancePercent;
}

function getCurrentMarketStock(): StockSnapshot {
  const now = Date.now();
  const cycleMs = STOCK_REFRESH_SECONDS * 1000;
  const cycleIndex = Math.floor(now / cycleMs);
  const existing = cycleStockCache.get(cycleIndex);
  if (existing) {
    return existing;
  }

  const laptops: Record<string, boolean> = {};
  for (const l of LAPTOPS) {
    laptops[l.id] = rollStockChance(l.stockChance);
  }

  const gpus: Record<string, boolean> = {};
  for (const g of GPUS) {
    gpus[g.id] = rollStockChance(g.stockChance);
  }

  const games: Record<string, boolean> = {};
  for (const gm of GAMES) {
    games[gm.id] = rollStockChance(gm.stockChance);
  }

  const editors: Record<string, boolean> = {};
  for (const ed of EDITORS) {
    editors[ed.id] = true;
  }

  const snapshot: StockSnapshot = {
    cycleIndex,
    nextRefreshAt: (cycleIndex + 1) * cycleMs,
    laptops,
    gpus,
    games,
    editors,
  };

  cycleStockCache.set(cycleIndex, snapshot);
  // Keep only recent 5 cycles in memory
  for (const key of cycleStockCache.keys()) {
    if (key < cycleIndex - 4) {
      cycleStockCache.delete(key);
    }
  }

  return snapshot;
}

// Idempotency registries (keyed by uid + txId / uploadNonce)
const processedPurchases = new Map<string, { approvedAt: number; itemId: string; price: number }>();
const processedUploads = new Map<string, {
  views: number;
  subscribersGained: number;
  earnings: number;
  outcomeTier: 'lowest' | 'highest';
}>();

function generateWeightedViews(
  minViews: number,
  trendMinViews: number,
  maxViews: number,
  lowestChance: number,
  highestChance: number
): { views: number; outcomeTier: 'lowest' | 'highest' } {
  const totalWeight = lowestChance + highestChance;
  const roll = (crypto.randomInt(0, 10000) / 10000) * totalWeight;
  const isHighest = roll < highestChance;

  if (isHighest) {
    const lowBound = Math.max(1, trendMinViews);
    const highBound = Math.max(lowBound, maxViews);
    const u = crypto.randomInt(1, 1000001) / 1000000;
    // Log-uniform distribution across trend range up to 100M
    const logVal = Math.log10(lowBound) + u * (Math.log10(highBound) - Math.log10(lowBound));
    const views = Math.max(lowBound, Math.min(highBound, Math.round(Math.pow(10, logVal))));
    return { views, outcomeTier: 'highest' };
  }

  const lowBound = Math.max(1, minViews);
  const standardCap = Math.min(maxViews, Math.max(trendMinViews * 25, 1000));
  const u = crypto.randomInt(1, 1000001) / 1000000;
  const logVal = Math.log10(lowBound) + Math.pow(u, 1.15) * (Math.log10(standardCap) - Math.log10(lowBound));
  const views = Math.max(lowBound, Math.min(standardCap, Math.round(Math.pow(10, logVal))));
  return { views, outcomeTier: 'lowest' };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/api/market/stock', (_req, res) => {
    const stock = getCurrentMarketStock();
    res.json({
      cycleIndex: stock.cycleIndex,
      nextRefreshAt: stock.nextRefreshAt,
      serverTime: Date.now(),
      stock: {
        laptops: stock.laptops,
        gpus: stock.gpus,
        games: stock.games,
        editors: stock.editors,
      },
    });
  });

  app.post('/api/store/validate-purchase', async (req, res) => {
    try {
      const user = await verifyFirebaseIdToken(req.headers.authorization);
      const { category, itemId, txId, balance, inventory } = req.body as {
        category?: string;
        itemId?: string;
        txId?: string;
        balance?: number;
        inventory?: {
          laptops?: string[];
          gpus?: string[];
          games?: string[];
          editors?: string[];
        };
      };

      if (!category || !itemId || !txId || typeof balance !== 'number' || !inventory) {
        return res.status(400).json({ error: 'Invalid purchase request payload.' });
      }

      const idempotencyKey = `${user.uid}:${txId}`;
      if (processedPurchases.has(idempotencyKey)) {
        return res.status(409).json({ error: 'Duplicate purchase transaction rejected.' });
      }

      const stock = getCurrentMarketStock();
      const ownedLaptops = Array.isArray(inventory.laptops) ? inventory.laptops : [];
      const ownedGpus = Array.isArray(inventory.gpus) ? inventory.gpus : [];
      const ownedGames = Array.isArray(inventory.games) ? inventory.games : [];
      const ownedEditors = Array.isArray(inventory.editors) ? inventory.editors : [];

      let price = 0;

      if (category === 'laptops') {
        const laptop = getLaptopById(itemId);
        if (!laptop) return res.status(404).json({ error: 'Laptop not found.' });
        if (!stock.laptops[laptop.id]) {
          return res.status(409).json({ error: `${laptop.name} is currently out of stock.` });
        }
        if (ownedLaptops.includes(laptop.id)) {
          return res.status(409).json({ error: `You already own ${laptop.name}.` });
        }
        if (laptop.id !== 'geforce-mini-book' && !ownedLaptops.includes('geforce-mini-book')) {
          return res.status(403).json({ error: 'You must purchase Geforce Mini Book before buying any other laptop.' });
        }
        price = laptop.price;
      } else if (category === 'gpus') {
        const gpu = getGpuById(itemId);
        if (!gpu) return res.status(404).json({ error: 'GPU not found.' });
        if (!stock.gpus[gpu.id]) {
          return res.status(409).json({ error: `${gpu.name} is currently out of stock.` });
        }
        if (ownedGpus.includes(gpu.id)) {
          return res.status(409).json({ error: `You already own ${gpu.name}.` });
        }
        if (ownedLaptops.length === 0) {
          return res.status(403).json({ error: 'Purchase a Geforce laptop before buying a GPU.' });
        }
        const maxLaptopTier = ownedLaptops.reduce((max, lid) => {
          const l = getLaptopById(lid);
          return l && l.tier > max ? l.tier : max;
        }, -1);
        if (maxLaptopTier < gpu.minLaptopTier) {
          return res.status(403).json({
            error: `${gpu.name} requires ${gpu.requiredCpuLabel}. Upgrade your laptop CPU first.`,
          });
        }
        price = gpu.price;
      } else if (category === 'games') {
        const game = getGameById(itemId);
        if (!game) return res.status(404).json({ error: 'Game not found.' });
        if (!stock.games[game.id]) {
          return res.status(409).json({ error: `${game.name} is currently out of stock.` });
        }
        if (ownedGames.includes(game.id)) {
          return res.status(409).json({ error: `You already own ${game.name}.` });
        }
        if (game.requiresGameId && !ownedGames.includes(game.requiresGameId)) {
          const reqGame = getGameById(game.requiresGameId);
          return res.status(403).json({
            error: `${game.name} requires owning ${reqGame ? reqGame.name : game.requiresGameId} first.`,
          });
        }
        if (ownedLaptops.length === 0 || ownedGpus.length === 0) {
          return res.status(403).json({ error: 'Own a compatible laptop and GPU before buying games.' });
        }
        price = game.price;
      } else if (category === 'editors') {
        const editor = getEditorById(itemId);
        if (!editor) return res.status(404).json({ error: 'Editor not found.' });
        if (ownedEditors.includes(editor.id)) {
          return res.status(409).json({ error: `You already own ${editor.name}.` });
        }
        price = editor.price;
      } else {
        return res.status(400).json({ error: 'Invalid store category.' });
      }

      if (balance < price) {
        return res.status(402).json({ error: 'Insufficient balance for this purchase.' });
      }

      processedPurchases.set(idempotencyKey, { approvedAt: Date.now(), itemId, price });
      return res.json({
        approved: true,
        txId,
        category,
        itemId,
        price,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authorization failed.';
      return res.status(401).json({ error: msg });
    }
  });

  app.post('/api/studio/generate-upload', async (req, res) => {
    try {
      const user = await verifyFirebaseIdToken(req.headers.authorization);
      const { title, gameId, editorId, laptopId, gpuId, uploadNonce, inventory } = req.body as {
        title?: string;
        gameId?: string;
        editorId?: string;
        laptopId?: string;
        gpuId?: string;
        uploadNonce?: string;
        inventory?: {
          laptops?: string[];
          gpus?: string[];
          games?: string[];
          editors?: string[];
          installedGames?: string[];
          laptopGpus?: Record<string, string>;
        };
      };

      if (!title || !gameId || !editorId || !laptopId || !gpuId || !uploadNonce || !inventory) {
        return res.status(400).json({ error: 'Missing required upload parameters.' });
      }

      const trimmedTitle = title.trim();
      if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
        return res.status(400).json({ error: 'Video title must be between 1 and 100 characters.' });
      }

      const uploadKey = `${user.uid}:${uploadNonce}`;
      const existingResult = processedUploads.get(uploadKey);
      if (existingResult) {
        return res.status(409).json({ error: 'This video upload was already processed.' });
      }

      const laptop = getLaptopById(laptopId);
      const gpu = getGpuById(gpuId);
      const game = getGameById(gameId);
      const editor = getEditorById(editorId);

      if (!laptop || !gpu || !game || !editor) {
        return res.status(404).json({ error: 'Selected hardware, game, or editor not found.' });
      }

      const ownedLaptops = Array.isArray(inventory.laptops) ? inventory.laptops : [];
      const ownedGpus = Array.isArray(inventory.gpus) ? inventory.gpus : [];
      const ownedGames = Array.isArray(inventory.games) ? inventory.games : [];
      const installedGames = Array.isArray(inventory.installedGames) ? inventory.installedGames : [];
      const ownedEditors = Array.isArray(inventory.editors) ? inventory.editors : [];
      const laptopGpus = inventory.laptopGpus || {};

      if (!ownedLaptops.includes(laptop.id)) {
        return res.status(403).json({ error: 'Selected laptop is not owned.' });
      }
      if (!ownedGpus.includes(gpu.id) || laptopGpus[laptop.id] !== gpu.id) {
        return res.status(403).json({ error: 'Selected GPU is not installed on the active laptop.' });
      }
      if (laptop.tier < gpu.minLaptopTier) {
        return res.status(403).json({ error: 'Installed GPU is incompatible with the active laptop CPU.' });
      }
      if (!ownedGames.includes(game.id) || !installedGames.includes(game.id)) {
        return res.status(403).json({ error: 'Game must be owned and installed before recording.' });
      }
      if (laptop.tier < game.minLaptopTier || gpu.tier < game.minGpuTier) {
        return res.status(403).json({ error: 'Active hardware does not meet the minimum requirements for this game.' });
      }
      if (!ownedEditors.includes(editor.id)) {
        return res.status(403).json({ error: 'Selected editor is not owned.' });
      }

      const { views, outcomeTier } = generateWeightedViews(
        game.minViews,
        game.trendMinViews,
        game.maxViews,
        editor.lowestChance,
        editor.highestChance
      );
      const subscribersGained = calculateSubscribersGained(views);
      const earnings = calculateVideoEarnings(views, game.multiplier);

      const result = { views, subscribersGained, earnings, outcomeTier };
      processedUploads.set(uploadKey, result);

      return res.json({
        uploadNonce,
        title: trimmedTitle,
        gameId: game.id,
        gameName: game.name,
        editorId: editor.id,
        editorName: editor.name,
        laptopId: laptop.id,
        gpuId: gpu.id,
        views,
        subscribersGained,
        earnings,
        outcomeTier,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload verification failed.';
      return res.status(401).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`YouTube Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
