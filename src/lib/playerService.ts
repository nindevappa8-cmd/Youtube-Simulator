import {
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { OperationType, auth, db, handleFirestoreError } from './firebase';
import {
  STARTING_BALANCE,
  calculateRank,
  calculateTier,
  calculateUnlockedBadges,
  getEditorById,
  getGameById,
  getGpuById,
  getLaptopById,
} from './gameData';
import type {
  LeaderboardEntry,
  PlayerInventory,
  RecentSubscriberEvent,
  StoreCategory,
  UserProfile,
  VideoRecord,
} from '../types';

const GMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidGmailAddress(email: string): boolean {
  const normalized = normalizeEmail(email);
  return GMAIL_REGEX.test(normalized) && normalized.length >= 11 && normalized.length <= 120;
}

export function generateDisplayId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `GF-${code}`;
}

export function generateNonceId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let rand = '';
  for (let i = 0; i < 16; i++) {
    rand += chars[bytes[i] % chars.length];
  }
  return `${prefix}_${Date.now()}_${rand}`;
}

export function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const message = err instanceof Error ? err.message : String(err);

  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid Gmail address.';
    case 'auth/user-not-found':
      return 'No account is registered with this Gmail address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Incorrect password or no account is registered with this Gmail address.';
    case 'auth/email-already-in-use':
      return 'An account is already registered with this Gmail address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Please try again.';
    case 'auth/requires-recent-login':
      return 'Please reauthenticate to complete this security-sensitive action.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in window was closed before completing.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled in Firebase Authentication settings. Enable Email/Password in Firebase Console or use Google Sign-In.';
    default:
      return message || 'Authentication request failed.';
  }
}

function buildInitialProfile(uid: string, username: string, email: string, avatarId = 'avatar-red'): UserProfile {
  let cleanName = username.trim().slice(0, 32);
  if (cleanName.length < 2) {
    cleanName = 'Creator';
  }
  return {
    uid,
    displayId: generateDisplayId(),
    username: cleanName,
    email: normalizeEmail(email),
    avatarId,
    accountStatus: 'active',
    balance: STARTING_BALANCE,
    totalEarned: 0,
    totalSpent: 0,
    lifetimeVideoEarnings: 0,
    subscribers: 0,
    totalViews: 0,
    totalVideos: 0,
    rank: 'Zero',
    tier: 'No Tier',
    badges: [],
    inventory: {
      laptops: [],
      gpus: [],
      games: [],
      editors: [],
      installedGames: [],
      activeLaptopId: null,
      laptopGpus: {},
    },
    settings: {
      soundEnabled: true,
      soundVolume: 0.6,
    },
    recentSubscribers: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

const inFlightProfileInit = new Map<string, Promise<UserProfile>>();

async function createInitialUserRecords(user: User, username: string, email: string): Promise<UserProfile> {
  const existingTask = inFlightProfileInit.get(user.uid);
  if (existingTask) {
    return existingTask;
  }

  const task = (async (): Promise<UserProfile> => {
    const userRef = doc(db, 'users', user.uid);
    const leaderboardRef = doc(db, 'globalLeaderboard', user.uid);

    const profileData = buildInitialProfile(user.uid, username, email);
    const leaderboardData: LeaderboardEntry = {
      uid: user.uid,
      displayId: profileData.displayId,
      username: profileData.username,
      avatarId: profileData.avatarId,
      subscribers: 0,
      rank: 'Zero',
      tier: 'No Tier',
      totalVideos: 0,
      updatedAt: serverTimestamp(),
    };

    try {
      await runTransaction(db, async (tx) => {
        const existingUser = await tx.get(userRef);
        const existingLeaderboard = await tx.get(leaderboardRef);
        if (existingUser.exists()) {
          return;
        }
        tx.set(userRef, profileData);
        if (!existingLeaderboard.exists()) {
          tx.set(leaderboardRef, leaderboardData);
        } else {
          tx.update(leaderboardRef, {
            username: profileData.username,
            avatarId: profileData.avatarId,
            subscribers: 0,
            rank: 'Zero',
            tier: 'No Tier',
            totalVideos: 0,
            updatedAt: serverTimestamp(),
          });
        }
      });
      const saved = await getDoc(userRef);
      if (!saved.exists()) {
        throw new Error('Profile document could not be confirmed after creation.');
      }
      return saved.data() as UserProfile;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  })().finally(() => {
    inFlightProfileInit.delete(user.uid);
  });

  inFlightProfileInit.set(user.uid, task);
  return task;
}

export async function fetchOrRecoverProfile(user: User): Promise<{ profile: UserProfile; recovered: boolean }> {
  const existingTask = inFlightProfileInit.get(user.uid);
  if (existingTask) {
    const profile = await existingTask;
    return { profile, recovered: true };
  }

  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { profile: snap.data() as UserProfile, recovered: false };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  }

  // Safe recovery if auth account exists but profile document was never written
  const fallbackName =
    user.displayName?.trim() ||
    (user.email ? user.email.split('@')[0].slice(0, 24) : 'Creator');
  const email = user.email || '';
  const profile = await createInitialUserRecords(user, fallbackName, email);
  return { profile, recovered: true };
}

export async function registerWithGmailPassword(
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<{ profile: UserProfile; profilePendingRecovery: boolean }> {
  const cleanName = username.trim();
  if (cleanName.length < 2 || cleanName.length > 32) {
    throw new Error('Username must be between 2 and 32 characters.');
  }
  if (!isValidGmailAddress(email)) {
    throw new Error('Enter a valid Gmail address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (password !== confirmPassword) {
    throw new Error('Password confirmation does not match.');
  }

  const normalized = normalizeEmail(email);
  let credential;
  try {
    credential = await createUserWithEmailAndPassword(auth, normalized, password);
  } catch (err) {
    throw new Error(mapAuthError(err));
  }

  const user = credential.user;
  const profilePromise = createInitialUserRecords(user, cleanName, normalized);
  try {
    await updateProfile(user, { displayName: cleanName });
  } catch {
    // Non-fatal display name update
  }

  try {
    const profile = await profilePromise;
    return { profile, profilePendingRecovery: false };
  } catch {
    // Auth succeeded; attempt immediate recovery once more before surfacing clear recovery error
    try {
      const { profile } = await fetchOrRecoverProfile(user);
      return { profile, profilePendingRecovery: false };
    } catch {
      throw new Error(
        'Your authentication account was created, but your player profile could not be saved yet. Click Retry Profile Recovery or sign in again to recover it.'
      );
    }
  }
}

export async function loginWithGmailPassword(
  email: string,
  password: string
): Promise<{ profile: UserProfile; recovered: boolean }> {
  if (!isValidGmailAddress(email)) {
    throw new Error('Enter a valid Gmail address.');
  }
  if (!password) {
    throw new Error('Enter your password.');
  }

  const normalized = normalizeEmail(email);
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, normalized, password);
  } catch (err) {
    throw new Error(mapAuthError(err));
  }

  return fetchOrRecoverProfile(credential.user);
}

export async function signInWithGoogleGmail(): Promise<{ profile: UserProfile; isNew: boolean }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  let credential;
  try {
    credential = await signInWithPopup(auth, provider);
  } catch (err) {
    throw new Error(mapAuthError(err));
  }

  const user = credential.user;
  const email = user.email ? normalizeEmail(user.email) : '';
  if (!isValidGmailAddress(email)) {
    await signOut(auth);
    throw new Error('Only @gmail.com Google accounts are supported in YouTube Studio.');
  }

  const { profile, recovered } = await fetchOrRecoverProfile(user);
  return { profile, isNew: recovered };
}

export async function sendGmailPasswordReset(email: string): Promise<void> {
  if (!isValidGmailAddress(email)) {
    throw new Error('Enter a valid Gmail address.');
  }
  try {
    await sendPasswordResetEmail(auth, normalizeEmail(email));
  } catch (err) {
    throw new Error(mapAuthError(err));
  }
}

export async function logoutPlayer(): Promise<void> {
  await signOut(auth);
}

function getTimestampMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'object') {
    const maybe = ts as { toMillis?: () => number; seconds?: number };
    if (typeof maybe.toMillis === 'function') return maybe.toMillis();
    if (typeof maybe.seconds === 'number') return maybe.seconds * 1000;
  }
  return 0;
}

export async function fetchUserVideos(uid: string): Promise<VideoRecord[]> {
  const path = `users/${uid}/videos`;
  try {
    const q = query(collection(db, path), where('uid', '==', uid), limit(200));
    const snap = await getDocs(q);
    const records = snap.docs.map((d) => d.data() as VideoRecord);
    records.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
    return records;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const path = 'globalLeaderboard';
  try {
    const q = query(
      collection(db, path),
      where('subscribers', '>=', 0),
      orderBy('subscribers', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LeaderboardEntry);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function updatePlayerProfileSettings(
  uid: string,
  updates: {
    username?: string;
    avatarId?: string;
    settings?: { soundEnabled: boolean; soundVolume: number };
  }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const leaderboardRef = doc(db, 'globalLeaderboard', uid);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error('Player profile not found.');
      const current = snap.data() as UserProfile;

      const nextUsername = updates.username !== undefined ? updates.username.trim().slice(0, 32) : current.username;
      if (nextUsername.length < 2) {
        throw new Error('Username must be at least 2 characters.');
      }
      const nextAvatarId = updates.avatarId !== undefined ? updates.avatarId : current.avatarId;
      const nextSettings = updates.settings !== undefined ? updates.settings : current.settings;

      tx.update(userRef, {
        username: nextUsername,
        avatarId: nextAvatarId,
        settings: nextSettings,
        updatedAt: serverTimestamp(),
      });

      const lbSnap = await tx.get(leaderboardRef);
      if (lbSnap.exists()) {
        tx.update(leaderboardRef, {
          username: nextUsername,
          avatarId: nextAvatarId,
          updatedAt: serverTimestamp(),
        });
      }
    });

    if (updates.username && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: updates.username.trim().slice(0, 32) });
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Username must be')) throw err;
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function changePlayerEmail(newEmail: string, currentPassword?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in.');
  if (!isValidGmailAddress(newEmail)) {
    throw new Error('Enter a valid Gmail address.');
  }
  const normalized = normalizeEmail(newEmail);

  try {
    if (currentPassword && user.email) {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
    }
    await verifyBeforeUpdateEmail(user, normalized);
  } catch (err) {
    throw new Error(mapAuthError(err));
  }
}

export async function changePlayerPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Password updates require an email/password session.');
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  try {
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  } catch (err) {
    throw new Error(mapAuthError(err));
  }
}

export async function deletePlayerAccount(currentPassword?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user found.');

  // Step 1: Reauthenticate first so auth deletion cannot fail after DB deletion
  try {
    const isPasswordUser = user.providerData.some((p) => p.providerId === 'password');
    if (isPasswordUser) {
      if (!currentPassword || !user.email) {
        throw new Error('Enter your current password to confirm account deletion.');
      }
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
    } else {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
    }
  } catch (err) {
    throw new Error(mapAuthError(err));
  }

  const uid = user.uid;

  // Step 2: Delete subcollections + leaderboard + user profile
  try {
    const videosSnap = await getDocs(
      query(collection(db, `users/${uid}/videos`), where('uid', '==', uid))
    );
    const txSnap = await getDocs(
      query(collection(db, `users/${uid}/transactions`), where('uid', '==', uid))
    );

    const allRefs = [
      ...videosSnap.docs.map((d) => d.ref),
      ...txSnap.docs.map((d) => d.ref),
      doc(db, 'globalLeaderboard', uid),
      doc(db, 'users', uid),
    ];

    // Commit in batches of 400
    for (let i = 0; i < allRefs.length; i += 400) {
      const batch = writeBatch(db);
      for (const ref of allRefs.slice(i, i + 400)) {
        batch.delete(ref);
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
  }

  // Step 3: Delete Firebase Authentication account
  try {
    await deleteUser(user);
  } catch (err) {
    throw new Error(mapAuthError(err));
  }

  try {
    await signOut(auth);
  } catch {
    // Already deleted & signed out
  }
}

export function getUsedStorageGB(inventory: PlayerInventory): number {
  return inventory.installedGames.reduce((sum, gid) => {
    const g = getGameById(gid);
    return sum + (g ? g.storageGB : 0);
  }, 0);
}

export async function purchaseStoreItem(
  profile: UserProfile,
  category: Exclude<StoreCategory, 'setup'>,
  itemId: string
): Promise<{ price: number; autoInstalledGpu?: boolean }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required.');

  const idToken = await user.getIdToken();
  const txId = generateNonceId('tx_buy');

  const resp = await fetch('/api/store/validate-purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      category,
      itemId,
      txId,
      balance: profile.balance,
      inventory: profile.inventory,
    }),
  });

  const validation = (await resp.json()) as {
    approved?: boolean;
    price?: number;
    error?: string;
  };

  if (!resp.ok || !validation.approved || typeof validation.price !== 'number') {
    throw new Error(validation.error || 'Store purchase validation failed.');
  }

  const price = validation.price;
  const userRef = doc(db, 'users', user.uid);
  const txRef = doc(db, `users/${user.uid}/transactions`, txId);

  let autoInstalledGpu = false;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error('Player profile not found.');
      const current = snap.data() as UserProfile;

      if (current.balance < price) {
        throw new Error('Insufficient balance.');
      }

      const nextInv: PlayerInventory = {
        laptops: [...current.inventory.laptops],
        gpus: [...current.inventory.gpus],
        games: [...current.inventory.games],
        editors: [...current.inventory.editors],
        installedGames: [...current.inventory.installedGames],
        activeLaptopId: current.inventory.activeLaptopId,
        laptopGpus: { ...current.inventory.laptopGpus },
      };

      if (category === 'laptops') {
        if (nextInv.laptops.includes(itemId)) throw new Error('Laptop already owned.');
        nextInv.laptops.push(itemId);
        nextInv.activeLaptopId = itemId;
        // Carry over compatible GPU or reset if incompatible
        const prevGpuId = current.inventory.activeLaptopId
          ? current.inventory.laptopGpus[current.inventory.activeLaptopId]
          : undefined;
        const laptop = getLaptopById(itemId);
        const prevGpu = getGpuById(prevGpuId);
        if (laptop && prevGpu && laptop.tier >= prevGpu.minLaptopTier) {
          nextInv.laptopGpus[itemId] = prevGpu.id;
        }
      } else if (category === 'gpus') {
        if (nextInv.gpus.includes(itemId)) throw new Error('GPU already owned.');
        nextInv.gpus.push(itemId);
        const activeLaptop = getLaptopById(nextInv.activeLaptopId);
        const gpu = getGpuById(itemId);
        if (activeLaptop && gpu && activeLaptop.tier >= gpu.minLaptopTier) {
          nextInv.laptopGpus[activeLaptop.id] = gpu.id;
          autoInstalledGpu = true;
        }
      } else if (category === 'games') {
        if (nextInv.games.includes(itemId)) throw new Error('Game already owned.');
        nextInv.games.push(itemId);
      } else if (category === 'editors') {
        if (nextInv.editors.includes(itemId)) throw new Error('Editor already owned.');
        nextInv.editors.push(itemId);
      }

      const nextBalance = Number((current.balance - price).toFixed(2));
      const nextSpent = Number((current.totalSpent + price).toFixed(2));

      tx.update(userRef, {
        balance: nextBalance,
        totalSpent: nextSpent,
        inventory: nextInv,
        lastTransactionId: txId,
        updatedAt: serverTimestamp(),
      });

      tx.set(txRef, {
        id: txId,
        uid: user.uid,
        type: 'purchase',
        itemId,
        amount: price,
        createdAt: serverTimestamp(),
      });
    });

    return { price, autoInstalledGpu };
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Insufficient') || err.message.includes('already owned'))) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function equipLaptop(uid: string, laptopId: string): Promise<void> {
  const laptop = getLaptopById(laptopId);
  if (!laptop) throw new Error('Laptop not found.');

  const userRef = doc(db, 'users', uid);
  const txId = generateNonceId('tx_lap');
  const txRef = doc(db, `users/${uid}/transactions`, txId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error('Player profile not found.');
      const current = snap.data() as UserProfile;

      if (!current.inventory.laptops.includes(laptopId)) {
        throw new Error('You do not own this laptop.');
      }

      // Remove installed games that exceed the new laptop's storage or hardware tier
      let used = 0;
      const retainedInstalled: string[] = [];
      for (const gid of current.inventory.installedGames) {
        const g = getGameById(gid);
        if (g && laptop.tier >= g.minLaptopTier && used + g.storageGB <= laptop.storageGB) {
          retainedInstalled.push(gid);
          used += g.storageGB;
        }
      }

      const nextInv: PlayerInventory = {
        ...current.inventory,
        activeLaptopId: laptopId,
        installedGames: retainedInstalled,
      };

      tx.update(userRef, {
        inventory: nextInv,
        lastTransactionId: txId,
        updatedAt: serverTimestamp(),
      });

      tx.set(txRef, {
        id: txId,
        uid,
        type: 'equip_laptop',
        itemId: laptopId,
        amount: 0,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('own this laptop')) throw err;
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }
}

export async function installGpuOnActiveLaptop(uid: string, gpuId: string): Promise<void> {
  const gpu = getGpuById(gpuId);
  if (!gpu) throw new Error('GPU not found.');

  const userRef = doc(db, 'users', uid);
  const txId = generateNonceId('tx_gpu');
  const txRef = doc(db, `users/${uid}/transactions`, txId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error('Player profile not found.');
      const current = snap.data() as UserProfile;

      if (!current.inventory.gpus.includes(gpuId)) {
        throw new Error('You do not own this GPU.');
      }
      const activeLaptop = getLaptopById(current.inventory.activeLaptopId);
      if (!activeLaptop) {
        throw new Error('Equip a laptop before installing a GPU.');
      }
      if (activeLaptop.tier < gpu.minLaptopTier) {
        throw new Error(
          `${gpu.name} requires ${gpu.requiredCpuLabel}. Active laptop (${activeLaptop.name}) uses ${activeLaptop.cpu}.`
        );
      }

      const nextInv: PlayerInventory = {
        ...current.inventory,
        laptopGpus: {
          ...current.inventory.laptopGpus,
          [activeLaptop.id]: gpu.id,
        },
      };

      tx.update(userRef, {
        inventory: nextInv,
        lastTransactionId: txId,
        updatedAt: serverTimestamp(),
      });

      tx.set(txRef, {
        id: txId,
        uid,
        type: 'equip_gpu',
        itemId: gpuId,
        amount: 0,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('requires') || err.message.includes('Equip'))) throw err;
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }
}

export async function installOwnedGame(uid: string, gameId: string): Promise<void> {
  const game = getGameById(gameId);
  if (!game) throw new Error('Game not found.');

  const userRef = doc(db, 'users', uid);
  const txId = generateNonceId('tx_inst');
  const txRef = doc(db, `users/${uid}/transactions`, txId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error('Player profile not found.');
      const current = snap.data() as UserProfile;

      if (!current.inventory.games.includes(gameId)) {
        throw new Error('Purchase this game before downloading.');
      }
      if (current.inventory.installedGames.includes(gameId)) {
        throw new Error(`${game.name} is already installed.`);
      }

      const activeLaptop = getLaptopById(current.inventory.activeLaptopId);
      if (!activeLaptop) {
        throw new Error('You must own and equip a laptop before downloading games.');
      }

      const equippedGpuId = current.inventory.laptopGpus[activeLaptop.id];
      const equippedGpu = getGpuById(equippedGpuId);
      if (!equippedGpu) {
        throw new Error(`Install a compatible GPU on ${activeLaptop.name} before downloading games.`);
      }

      if (activeLaptop.tier < game.minLaptopTier) {
        throw new Error(`${game.name} requires a higher-tier laptop.`);
      }
      if (equippedGpu.tier < game.minGpuTier) {
        throw new Error(`${game.name} requires a higher-tier GPU installed.`);
      }
      if (game.requiresGameId && !current.inventory.games.includes(game.requiresGameId)) {
        const req = getGameById(game.requiresGameId);
        throw new Error(`${game.name} requires owning ${req ? req.name : game.requiresGameId}.`);
      }

      const usedStorage = getUsedStorageGB(current.inventory);
      const freeStorage = activeLaptop.storageGB - usedStorage;
      if (game.storageGB > freeStorage) {
        throw new Error(
          `Not enough storage on ${activeLaptop.name}. Needs ${game.storageLabel}, only ${freeStorage}GB free.`
        );
      }

      const nextInv: PlayerInventory = {
        ...current.inventory,
        installedGames: [...current.inventory.installedGames, gameId],
      };

      tx.update(userRef, {
        inventory: nextInv,
        lastTransactionId: txId,
        updatedAt: serverTimestamp(),
      });

      tx.set(txRef, {
        id: txId,
        uid,
        type: 'install',
        itemId: gameId,
        amount: 0,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes('storage') ||
        err.message.includes('requires') ||
        err.message.includes('Install') ||
        err.message.includes('Purchase') ||
        err.message.includes('installed'))
    ) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }
}

export async function uninstallOwnedGame(uid: string, gameId: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const txId = generateNonceId('tx_uninst');
  const txRef = doc(db, `users/${uid}/transactions`, txId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error('Player profile not found.');
      const current = snap.data() as UserProfile;

      const nextInv: PlayerInventory = {
        ...current.inventory,
        installedGames: current.inventory.installedGames.filter((id) => id !== gameId),
      };

      tx.update(userRef, {
        inventory: nextInv,
        lastTransactionId: txId,
        updatedAt: serverTimestamp(),
      });

      tx.set(txRef, {
        id: txId,
        uid,
        type: 'uninstall',
        itemId: gameId,
        amount: 0,
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }
}

export interface UploadOutcome {
  video: VideoRecord;
  previousRank: string;
  newRank: string;
  previousTier: string;
  newTier: string;
  newlyUnlockedBadges: string[];
}

export async function executeStudioUpload(
  profile: UserProfile,
  title: string,
  gameId: string,
  editorId: string,
  uploadNonce: string
): Promise<UploadOutcome> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required.');

  const activeLaptopId = profile.inventory.activeLaptopId;
  const activeGpuId = activeLaptopId ? profile.inventory.laptopGpus[activeLaptopId] : undefined;

  if (!activeLaptopId || !activeGpuId) {
    throw new Error('An active laptop and compatible installed GPU are required.');
  }

  const idToken = await user.getIdToken();
  const resp = await fetch('/api/studio/generate-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      title,
      gameId,
      editorId,
      laptopId: activeLaptopId,
      gpuId: activeGpuId,
      uploadNonce,
      inventory: profile.inventory,
    }),
  });

  const generated = (await resp.json()) as {
    uploadNonce?: string;
    title?: string;
    gameId?: string;
    gameName?: string;
    editorId?: string;
    editorName?: string;
    laptopId?: string;
    gpuId?: string;
    views?: number;
    subscribersGained?: number;
    earnings?: number;
    outcomeTier?: 'lowest' | 'highest';
    error?: string;
  };

  if (!resp.ok || typeof generated.views !== 'number' || typeof generated.earnings !== 'number') {
    throw new Error(generated.error || 'Failed to generate video upload results.');
  }

  const videoId = generateNonceId('vid');
  const txId = generateNonceId('tx_vid');
  const userRef = doc(db, 'users', user.uid);
  const videoRef = doc(db, `users/${user.uid}/videos`, videoId);
  const txRef = doc(db, `users/${user.uid}/transactions`, txId);
  const leaderboardRef = doc(db, 'globalLeaderboard', user.uid);

  const views = generated.views;
  const subsGained = generated.subscribersGained || 0;
  const earnings = generated.earnings;
  const outcomeTier = generated.outcomeTier || 'lowest';

  let outcomeMeta: UploadOutcome | null = null;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error('Player profile not found.');
      const current = snap.data() as UserProfile;

      const nextBalance = Number((current.balance + earnings).toFixed(2));
      const nextTotalEarned = Number((current.totalEarned + earnings).toFixed(2));
      const nextVideoEarnings = Number((current.lifetimeVideoEarnings + earnings).toFixed(2));
      const nextSubscribers = current.subscribers + subsGained;
      const nextTotalViews = current.totalViews + views;
      const nextTotalVideos = current.totalVideos + 1;

      const nextRank = calculateRank(nextSubscribers).name;
      const nextTier = calculateTier(nextTotalEarned).name;
      const nextBadges = calculateUnlockedBadges(nextSubscribers);
      const newlyUnlockedBadges = nextBadges.filter((b) => !current.badges.includes(b));

      const recentEvent: RecentSubscriberEvent = {
        label: `+${subsGained.toLocaleString('en-US')} subscribers`,
        count: subsGained,
        videoTitle: generated.title || title.trim(),
        timestamp: Date.now(),
      };
      const nextRecentSubscribers = [recentEvent, ...(current.recentSubscribers || [])].slice(0, 10);

      const videoRecord: VideoRecord = {
        id: videoId,
        uid: user.uid,
        uploadNonce,
        title: generated.title || title.trim(),
        gameId: generated.gameId || gameId,
        gameName: generated.gameName || getGameById(gameId)?.name || gameId,
        editorId: generated.editorId || editorId,
        editorName: generated.editorName || getEditorById(editorId)?.name || editorId,
        laptopId: activeLaptopId,
        gpuId: activeGpuId,
        views,
        subscribersGained: subsGained,
        earnings,
        outcomeTier,
        createdAt: serverTimestamp(),
      };

      tx.update(userRef, {
        balance: nextBalance,
        totalEarned: nextTotalEarned,
        lifetimeVideoEarnings: nextVideoEarnings,
        subscribers: nextSubscribers,
        totalViews: nextTotalViews,
        totalVideos: nextTotalVideos,
        rank: nextRank,
        tier: nextTier,
        badges: nextBadges,
        recentSubscribers: nextRecentSubscribers,
        lastTransactionId: uploadNonce,
        updatedAt: serverTimestamp(),
      });

      tx.set(videoRef, videoRecord);

      tx.set(txRef, {
        id: txId,
        uid: user.uid,
        type: 'upload_reward',
        itemId: videoId,
        amount: earnings,
        createdAt: serverTimestamp(),
      });

      tx.set(leaderboardRef, {
        uid: user.uid,
        displayId: current.displayId,
        username: current.username,
        avatarId: current.avatarId,
        subscribers: nextSubscribers,
        rank: nextRank,
        tier: nextTier,
        totalVideos: nextTotalVideos,
        updatedAt: serverTimestamp(),
      });

      outcomeMeta = {
        video: videoRecord,
        previousRank: current.rank,
        newRank: nextRank,
        previousTier: current.tier,
        newTier: nextTier,
        newlyUnlockedBadges,
      };
    });

    if (!outcomeMeta) {
      throw new Error('Upload transaction did not produce a result.');
    }
    return outcomeMeta;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/videos/${videoId}`);
  }
}
