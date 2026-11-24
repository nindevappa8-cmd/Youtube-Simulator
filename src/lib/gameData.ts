export type Rarity =
  | 'Uncommon'
  | 'Common'
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Mythic'
  | 'Prismatic'
  | 'Secret'
  | 'Super-Secret'
  | 'Super Secret';

export interface LaptopSpec {
  id: string;
  name: string;
  tier: number;
  price: number;
  rarity: Rarity;
  stockChance: number;
  storageGB: number;
  storageLabel: string;
  ramLabel: string;
  cameraLabel: string;
  cpu: string;
  os: string;
  description: string;
  chassisStyle: {
    width: number;
    depth: number;
    baseThickness: number;
    lidThickness: number;
    bezelWidth: number;
    bodyColor: string;
    accentColor: string;
    rgbMode: 'none' | 'subtle' | 'gamer' | 'pro' | 'futuristic' | 'metallic';
    ventCount: number;
  };
}

export interface GpuSpec {
  id: string;
  name: string;
  tier: number;
  price: number;
  rarity: Rarity;
  stockChance: number;
  minLaptopTier: number;
  requiredCpuLabel: string;
  vramLabel: string;
  clockLabel: string;
  description: string;
}

export interface GameSpec {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
  stockChance: number;
  storageGB: number;
  storageLabel: string;
  minLaptopTier: number;
  minGpuTier: number;
  requiresGameId?: string;
  minViews: number;
  trendMinViews: number;
  maxViews: number;
  multiplier: number;
  isUpgrade?: boolean;
  description: string;
}

export interface EditorSpec {
  id: string;
  name: string;
  tier: number;
  price: number;
  rarity: Rarity;
  lowestChance: number;
  highestChance: number;
  description: string;
}

export interface RankDef {
  name: string;
  minSubscribers: number;
  gradientKey: 'white' | 'brown' | 'silver' | 'gold' | 'diamond' | 'purple-yellow' | 'rainbow';
}

export interface TierDef {
  name: string;
  minEarnings: number;
  gradientKey: 'brown' | 'yellow' | 'green' | 'orange' | 'blue' | 'gold' | 'red-black' | 'rainbow' | 'black-white';
}

export interface BadgeDef {
  id: string;
  label: string;
  requirement: number;
  appearance: 'bronze' | 'silver' | 'gold' | 'diamond' | 'purple-yellow' | 'black-white';
}

export const STARTING_BALANCE = 5000;
export const STOCK_REFRESH_SECONDS = 180;

export const LAPTOPS: LaptopSpec[] = [
  {
    id: 'geforce-mini-book',
    name: 'Geforce Mini Book',
    tier: 0,
    price: 1200,
    rarity: 'Uncommon',
    stockChance: 100,
    storageGB: 250,
    storageLabel: '250GB',
    ramLabel: '2GB RAM',
    cameraLabel: '720p',
    cpu: 'Intel Core i3',
    os: 'Windows 10',
    description: 'Small, thick starter chassis with compact screen and wide borders. Required first laptop.',
    chassisStyle: {
      width: 2.5,
      depth: 1.85,
      baseThickness: 0.22,
      lidThickness: 0.11,
      bezelWidth: 0.22,
      bodyColor: '#2a2a2e',
      accentColor: '#6b7280',
      rgbMode: 'none',
      ventCount: 3,
    },
  },
  {
    id: 'geforce-mini-book-pro',
    name: 'Geforce Mini Book Pro',
    tier: 1,
    price: 3000,
    rarity: 'Common',
    stockChance: 80,
    storageGB: 500,
    storageLabel: '500GB',
    ramLabel: '4GB RAM',
    cameraLabel: '720p',
    cpu: 'Intel Core i5',
    os: 'Windows 10',
    description: 'Compact thick chassis with expanded screen panel and trimmed bezels.',
    chassisStyle: {
      width: 2.65,
      depth: 1.9,
      baseThickness: 0.2,
      lidThickness: 0.1,
      bezelWidth: 0.16,
      bodyColor: '#303238',
      accentColor: '#9ca3af',
      rgbMode: 'none',
      ventCount: 4,
    },
  },
  {
    id: 'geforce-book',
    name: 'Geforce Book',
    tier: 2,
    price: 5000,
    rarity: 'Rare',
    stockChance: 50,
    storageGB: 750,
    storageLabel: '750GB',
    ramLabel: '8GB RAM',
    cameraLabel: '1080p',
    cpu: 'Intel Core i9',
    os: 'Windows 10 Pro',
    description: 'Full-size creator laptop with reinforced thick deck, large screen, and narrow borders.',
    chassisStyle: {
      width: 3.1,
      depth: 2.15,
      baseThickness: 0.19,
      lidThickness: 0.09,
      bezelWidth: 0.11,
      bodyColor: '#23262d',
      accentColor: '#3b82f6',
      rgbMode: 'subtle',
      ventCount: 5,
    },
  },
  {
    id: 'geforce-1st-gen',
    name: 'Geforce 1st Gen',
    tier: 3,
    price: 10000,
    rarity: 'Epic',
    stockChance: 25,
    storageGB: 1000,
    storageLabel: '1TB',
    ramLabel: '12GB RAM',
    cameraLabel: '4K',
    cpu: 'AMD Ryzen 3',
    os: 'Windows 11',
    description: 'Precision thin-profile workstation with large 4K display and ultra-thin borders.',
    chassisStyle: {
      width: 3.25,
      depth: 2.2,
      baseThickness: 0.13,
      lidThickness: 0.065,
      bezelWidth: 0.07,
      bodyColor: '#1c1c22',
      accentColor: '#a855f7',
      rgbMode: 'subtle',
      ventCount: 6,
    },
  },
  {
    id: 'geforce-gaming',
    name: 'Geforce Gaming',
    tier: 4,
    price: 20000,
    rarity: 'Legendary',
    stockChance: 10,
    storageGB: 1500,
    storageLabel: '1.5TB',
    ramLabel: '16GB RAM',
    cameraLabel: '8K',
    cpu: 'AMD Ryzen 5',
    os: 'Windows 11 Pro',
    description: 'Thick thermal keyboard deck, per-key RGB illumination, sculpted side vents, and thin 8K display.',
    chassisStyle: {
      width: 3.45,
      depth: 2.4,
      baseThickness: 0.24,
      lidThickness: 0.06,
      bezelWidth: 0.055,
      bodyColor: '#16161a',
      accentColor: '#f59e0b',
      rgbMode: 'gamer',
      ventCount: 8,
    },
  },
  {
    id: 'geforce-gaming-pro',
    name: 'Geforce Gaming Pro',
    tier: 5,
    price: 25000,
    rarity: 'Mythic',
    stockChance: 5,
    storageGB: 2000,
    storageLabel: '2TB',
    ramLabel: '16GB RAM',
    cameraLabel: '8K',
    cpu: 'AMD Ryzen 5 Pro',
    os: 'Windows 11 Pro',
    description: 'Red-black anodized gaming chassis with multi-zone RGB strips and dual-chamber cooling vents.',
    chassisStyle: {
      width: 3.55,
      depth: 2.48,
      baseThickness: 0.25,
      lidThickness: 0.058,
      bezelWidth: 0.05,
      bodyColor: '#121012',
      accentColor: '#ff2020',
      rgbMode: 'pro',
      ventCount: 10,
    },
  },
  {
    id: 'geforce-ultra-gaming',
    name: 'Geforce Ultra Gaming',
    tier: 6,
    price: 50000,
    rarity: 'Prismatic',
    stockChance: 1,
    storageGB: 3000,
    storageLabel: '3TB',
    ramLabel: '64GB RAM',
    cameraLabel: '8K Pro',
    cpu: 'AMD Ryzen 5 Ultra Pro',
    os: 'Windows 12',
    description: 'Futuristic angular chassis with prismatic underglow, vapor-chamber exhaust, and 64GB memory.',
    chassisStyle: {
      width: 3.65,
      depth: 2.55,
      baseThickness: 0.21,
      lidThickness: 0.052,
      bezelWidth: 0.04,
      bodyColor: '#101218',
      accentColor: '#38bdf8',
      rgbMode: 'futuristic',
      ventCount: 12,
    },
  },
  {
    id: 'geforce-maxed-gaming',
    name: 'Geforce Maxed Gaming',
    tier: 7,
    price: 100000,
    rarity: 'Secret',
    stockChance: 0.1,
    storageGB: 5000,
    storageLabel: '5TB',
    ramLabel: '128GB RAM',
    cameraLabel: '8K Ultra Pro',
    cpu: 'AMD Ryzen 7',
    os: 'Windows 12 Pro',
    description: 'Flagship black-white metallic unibody with perimeter illumination, 5TB NVMe array, and 128GB RAM.',
    chassisStyle: {
      width: 3.8,
      depth: 2.65,
      baseThickness: 0.22,
      lidThickness: 0.05,
      bezelWidth: 0.035,
      bodyColor: '#e5e7eb',
      accentColor: '#ff2020',
      rgbMode: 'metallic',
      ventCount: 14,
    },
  },
];

export const GPUS: GpuSpec[] = [
  {
    id: 'intel-i3',
    name: 'Intel i3',
    tier: 0,
    price: 200,
    rarity: 'Uncommon',
    stockChance: 100,
    minLaptopTier: 0,
    requiredCpuLabel: 'Intel Core i3 or above',
    vramLabel: '2GB Integrated',
    clockLabel: '1.1 GHz',
    description: 'Entry graphics processor compatible with every Geforce laptop.',
  },
  {
    id: 'intel-i5',
    name: 'Intel i5',
    tier: 1,
    price: 1000,
    rarity: 'Common',
    stockChance: 85,
    minLaptopTier: 1,
    requiredCpuLabel: 'Intel Core i5 or above',
    vramLabel: '4GB Shared',
    clockLabel: '1.4 GHz',
    description: 'Reliable mid-entry graphics module unlocking Roblox and Minecraft workloads.',
  },
  {
    id: 'intel-i9',
    name: 'Intel i9',
    tier: 2,
    price: 2500,
    rarity: 'Rare',
    stockChance: 50,
    minLaptopTier: 2,
    requiredCpuLabel: 'Intel Core i9 or above',
    vramLabel: '6GB High-Bandwidth',
    clockLabel: '1.7 GHz',
    description: 'High-throughput integrated workstation graphics for 1080p capture.',
  },
  {
    id: 'rtx-90',
    name: 'RTX 90',
    tier: 3,
    price: 5000,
    rarity: 'Epic',
    stockChance: 30,
    minLaptopTier: 3,
    requiredCpuLabel: 'AMD Ryzen 3 or above',
    vramLabel: '8GB GDDR6',
    clockLabel: '1.9 GHz',
    description: 'Dedicated ray-traced laptop GPU required for GTA IV production.',
  },
  {
    id: 'rtx-1090',
    name: 'RTX 1090',
    tier: 4,
    price: 10000,
    rarity: 'Legendary',
    stockChance: 10,
    minLaptopTier: 4,
    requiredCpuLabel: 'AMD Ryzen 5 or above',
    vramLabel: '12GB GDDR6X',
    clockLabel: '2.2 GHz',
    description: 'High-wattage mobile GPU built for Car Simulator II at 8K capture.',
  },
  {
    id: 'rtx-2090',
    name: 'RTX 2090',
    tier: 5,
    price: 20000,
    rarity: 'Mythic',
    stockChance: 8,
    minLaptopTier: 5,
    requiredCpuLabel: 'AMD Ryzen 5 Pro or above',
    vramLabel: '16GB GDDR6X',
    clockLabel: '2.4 GHz',
    description: 'Mythic-grade mobile silicon unlocking Maxed-Minecraft Mode shaders.',
  },
  {
    id: 'rtx-3080',
    name: 'RTX 3080',
    tier: 6,
    price: 30000,
    rarity: 'Prismatic',
    stockChance: 5,
    minLaptopTier: 6,
    requiredCpuLabel: 'AMD Ryzen 5 Ultra Pro or above',
    vramLabel: '20GB GDDR7',
    clockLabel: '2.6 GHz',
    description: 'Prismatic mobile compute core engineered for Poppy Playtime 4.',
  },
  {
    id: 'rtx-4070',
    name: 'RTX 4070',
    tier: 7,
    price: 40000,
    rarity: 'Secret',
    stockChance: 2,
    minLaptopTier: 6,
    requiredCpuLabel: 'AMD Ryzen 5 Ultra Pro or above',
    vramLabel: '24GB GDDR7',
    clockLabel: '2.8 GHz',
    description: 'Secret-tier tensor accelerator delivering ultra-low frame latency.',
  },
  {
    id: 'rtx-5060',
    name: 'RTX 5060',
    tier: 8,
    price: 50000,
    rarity: 'Secret',
    stockChance: 1,
    minLaptopTier: 6,
    requiredCpuLabel: 'AMD Ryzen 5 Ultra Pro or above',
    vramLabel: '32GB GDDR7',
    clockLabel: '3.0 GHz',
    description: 'Next-gen secret silicon required for GTA V ultra-preset recording.',
  },
  {
    id: 'amd-radeon-9070',
    name: 'AMD Radeon 9070',
    tier: 9,
    price: 100000,
    rarity: 'Super-Secret',
    stockChance: 0.1,
    minLaptopTier: 7,
    requiredCpuLabel: 'AMD Ryzen 7',
    vramLabel: '48GB HBM3',
    clockLabel: '3.4 GHz',
    description: 'Apex flagship graphics engine exclusively compatible with Geforce Maxed Gaming.',
  },
];

export const GAMES: GameSpec[] = [
  {
    id: 'car-simulator',
    name: 'Car Simulator',
    price: 1200,
    rarity: 'Uncommon',
    stockChance: 100,
    storageGB: 125,
    storageLabel: '125GB',
    minLaptopTier: 0,
    minGpuTier: 0,
    minViews: 1,
    trendMinViews: 10,
    maxViews: 100_000_000,
    multiplier: 1,
    description: 'Entry driving sandbox for new creators. Runs smoothly on starter hardware.',
  },
  {
    id: 'roblox',
    name: 'Roblox',
    price: 2500,
    rarity: 'Common',
    stockChance: 75,
    storageGB: 250,
    storageLabel: '250GB',
    minLaptopTier: 1,
    minGpuTier: 1,
    minViews: 1,
    trendMinViews: 10,
    maxViews: 100_000_000,
    multiplier: 1.2,
    description: 'Massive community game platform with steady creator monetization.',
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    price: 5000,
    rarity: 'Rare',
    stockChance: 50,
    storageGB: 500,
    storageLabel: '500GB',
    minLaptopTier: 2,
    minGpuTier: 1,
    minViews: 1,
    trendMinViews: 10,
    maxViews: 100_000_000,
    multiplier: 2,
    description: 'Iconic voxel survival sandbox with double base revenue multiplier.',
  },
  {
    id: 'maxed-minecraft-mode',
    name: 'Maxed-Minecraft Mode',
    price: 10000,
    rarity: 'Rare',
    stockChance: 50,
    storageGB: 2000,
    storageLabel: '2TB',
    minLaptopTier: 5,
    minGpuTier: 5,
    requiresGameId: 'minecraft',
    minViews: 10,
    trendMinViews: 1000,
    maxViews: 100_000_000,
    multiplier: 5,
    isUpgrade: true,
    description: 'Full path-traced Minecraft upgrade. Requires base Minecraft, Geforce Gaming Pro+, and RTX 2090+.',
  },
  {
    id: 'gta-iv',
    name: 'GTA IV',
    price: 10000,
    rarity: 'Epic',
    stockChance: 25,
    storageGB: 1000,
    storageLabel: '1TB',
    minLaptopTier: 3,
    minGpuTier: 3,
    minViews: 1,
    trendMinViews: 10,
    maxViews: 100_000_000,
    multiplier: 2.2,
    description: 'Open-city classic mapped to Geforce 1st Gen+ (Ryzen 3) and RTX 90+ hardware.',
  },
  {
    id: 'car-simulator-ii',
    name: 'Car Simulator II',
    price: 15000,
    rarity: 'Legendary',
    stockChance: 10,
    storageGB: 1500,
    storageLabel: '1.5TB',
    minLaptopTier: 4,
    minGpuTier: 4,
    minViews: 1,
    trendMinViews: 1000,
    maxViews: 100_000_000,
    multiplier: 2.5,
    description: 'High-fidelity physics sequel built for Geforce Gaming+ and RTX 1090+.',
  },
  {
    id: 'poppy-playtime-4',
    name: 'Poppy Playtime 4',
    price: 20000,
    rarity: 'Mythic',
    stockChance: 5,
    storageGB: 2000,
    storageLabel: '2TB',
    minLaptopTier: 6,
    minGpuTier: 6,
    minViews: 10,
    trendMinViews: 1000,
    maxViews: 100_000_000,
    multiplier: 3,
    description: 'Viral horror phenomenon requiring Geforce Ultra Gaming+ and RTX 3080+.',
  },
  {
    id: 'gta-v',
    name: 'GTA V',
    price: 25000,
    rarity: 'Secret',
    stockChance: 1,
    storageGB: 4000,
    storageLabel: '4TB',
    minLaptopTier: 6,
    minGpuTier: 8,
    minViews: 100,
    trendMinViews: 1000,
    maxViews: 100_000_000,
    multiplier: 4,
    description: '4TB ultra-modded blockbuster. Requires RTX 5060+ and 4TB free storage (Geforce Maxed Gaming to install).',
  },
  {
    id: 'gta-vi',
    name: 'GTA VI',
    price: 50000,
    rarity: 'Super Secret',
    stockChance: 0.1,
    storageGB: 5000,
    storageLabel: '5TB',
    minLaptopTier: 7,
    minGpuTier: 9,
    minViews: 1000,
    trendMinViews: 10000,
    maxViews: 100_000_000,
    multiplier: 5,
    description: 'The ultimate creator title. Exclusively demands Geforce Maxed Gaming and AMD Radeon 9070.',
  },
];

export const EDITORS: EditorSpec[] = [
  {
    id: 'self-editing',
    name: 'Self-Editing',
    tier: 0,
    price: 1200,
    rarity: 'Uncommon',
    lowestChance: 95,
    highestChance: 5,
    description: 'Basic creator self-edit suite. 95% standard outcome, 5% viral breakout chance.',
  },
  {
    id: 'helper',
    name: 'Helper',
    tier: 1,
    price: 2000,
    rarity: 'Common',
    lowestChance: 85,
    highestChance: 15,
    description: 'Junior assistant editor improving pacing for a 15% viral breakout chance.',
  },
  {
    id: 'advanced-helper',
    name: 'Advanced Helper',
    tier: 2,
    price: 5000,
    rarity: 'Rare',
    lowestChance: 65,
    highestChance: 35,
    description: 'Experienced cut and thumbnail specialist raising breakout odds to 35%.',
  },
  {
    id: 'pre-professional-helper',
    name: 'Pre-Professional Helper',
    tier: 3,
    price: 15000,
    rarity: 'Epic',
    lowestChance: 50,
    highestChance: 50,
    description: 'Balanced 50/50 studio editing workflow with dynamic retention pacing.',
  },
  {
    id: 'skilled-helper',
    name: 'Skilled Helper',
    tier: 4,
    price: 25000,
    rarity: 'Legendary',
    lowestChance: 45,
    highestChance: 55,
    description: 'High-retention creator editor pushing viral outcome probability to 55%.',
  },
  {
    id: 'professional-helper',
    name: 'Professional Helper',
    tier: 5,
    price: 50000,
    rarity: 'Mythic',
    lowestChance: 35,
    highestChance: 65,
    description: 'Veteran agency post-production team achieving 65% breakout probability.',
  },
  {
    id: 'ultra-skilled-helper',
    name: 'Ultra-Skilled Helper',
    tier: 6,
    price: 100000,
    rarity: 'Secret',
    lowestChance: 10,
    highestChance: 90,
    description: 'World-class viral production unit delivering a 90% highest-tier outcome probability.',
  },
];

export const RANKS: RankDef[] = [
  { name: 'Zero', minSubscribers: 0, gradientKey: 'white' },
  { name: 'Bronze', minSubscribers: 1, gradientKey: 'brown' },
  { name: 'Bronze II', minSubscribers: 100, gradientKey: 'brown' },
  { name: 'Bronze III', minSubscribers: 500, gradientKey: 'brown' },
  { name: 'Silver', minSubscribers: 1000, gradientKey: 'silver' },
  { name: 'Silver II', minSubscribers: 2000, gradientKey: 'silver' },
  { name: 'Silver III', minSubscribers: 3000, gradientKey: 'silver' },
  { name: 'Gold', minSubscribers: 5000, gradientKey: 'gold' },
  { name: 'Gold II', minSubscribers: 6000, gradientKey: 'gold' },
  { name: 'Gold III', minSubscribers: 7000, gradientKey: 'gold' },
  { name: 'Platinum', minSubscribers: 10000, gradientKey: 'diamond' },
  { name: 'Platinum II', minSubscribers: 15000, gradientKey: 'diamond' },
  { name: 'Platinum III', minSubscribers: 20000, gradientKey: 'diamond' },
  { name: 'Champion', minSubscribers: 30000, gradientKey: 'purple-yellow' },
  { name: 'Champion II', minSubscribers: 40000, gradientKey: 'purple-yellow' },
  { name: 'Champion III', minSubscribers: 50000, gradientKey: 'purple-yellow' },
  { name: 'Max Rank', minSubscribers: 100000, gradientKey: 'rainbow' },
];

export const TIERS: TierDef[] = [
  { name: 'No Tier', minEarnings: 0, gradientKey: 'brown' },
  { name: 'Beginner', minEarnings: 100, gradientKey: 'yellow' },
  { name: 'Starter', minEarnings: 1000, gradientKey: 'green' },
  { name: 'Advanced', minEarnings: 10000, gradientKey: 'orange' },
  { name: 'Professional', minEarnings: 100000, gradientKey: 'blue' },
  { name: 'Iconic', minEarnings: 1000000, gradientKey: 'gold' },
  { name: 'Sovereign', minEarnings: 50000000, gradientKey: 'red-black' },
  { name: 'Legend', minEarnings: 100000000, gradientKey: 'rainbow' },
  { name: 'Goat', minEarnings: 1000000000, gradientKey: 'black-white' },
];

export const BASE_BADGES: BadgeDef[] = [
  { id: '10K', label: '10K', requirement: 10000, appearance: 'bronze' },
  { id: '100K', label: '100K', requirement: 100000, appearance: 'silver' },
  { id: '1M', label: '1M', requirement: 1000000, appearance: 'gold' },
  { id: '10M', label: '10M', requirement: 10000000, appearance: 'diamond' },
  { id: '100M', label: '100M', requirement: 100000000, appearance: 'purple-yellow' },
  { id: '200M', label: '200M', requirement: 200000000, appearance: 'purple-yellow' },
  { id: '300M', label: '300M', requirement: 300000000, appearance: 'purple-yellow' },
  { id: '400M', label: '400M', requirement: 400000000, appearance: 'purple-yellow' },
  { id: '500M', label: '500M', requirement: 500000000, appearance: 'purple-yellow' },
  { id: '600M', label: '600M', requirement: 600000000, appearance: 'purple-yellow' },
  { id: '700M', label: '700M', requirement: 700000000, appearance: 'purple-yellow' },
  { id: '800M', label: '800M', requirement: 800000000, appearance: 'purple-yellow' },
  { id: '900M', label: '900M', requirement: 900000000, appearance: 'purple-yellow' },
  { id: '1B', label: '1B', requirement: 1000000000, appearance: 'black-white' },
];

export const SETUP_COMING_SOON_CATEGORIES = [
  { id: 'monitors', name: 'Monitors', description: 'OLED reference displays and high-refresh studio panels.' },
  { id: 'keyboards', name: 'Keyboards', description: 'Custom aluminum mechanical boards with hall-effect switches.' },
  { id: 'mice', name: 'Mice', description: 'Ultra-lightweight wireless creator and esports mice.' },
  { id: 'microphones', name: 'Microphones', description: 'Broadcast dynamic and studio condenser XLR microphones.' },
  { id: 'headphones', name: 'Headphones', description: 'Open-back reference studio headphones and IEMs.' },
  { id: 'streaming-equipment', name: 'Streaming Equipment', description: '4K60 capture cards, audio interfaces, and stream decks.' },
  { id: 'lighting', name: 'Lighting', description: 'Bi-color studio key lights and rim illumination arrays.' },
  { id: 'desks', name: 'Desks', description: 'Motorized acoustic-damped creator studio workstations.' },
];

export function calculateRank(subscribers: number): RankDef {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (subscribers >= r.minSubscribers) {
      current = r;
    }
  }
  return current;
}

export function calculateTier(totalEarned: number): TierDef {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (totalEarned >= t.minEarnings) {
      current = t;
    }
  }
  return current;
}

export function calculateUnlockedBadges(subscribers: number): string[] {
  const badges: string[] = [];
  if (subscribers >= 10_000) badges.push('10K');
  if (subscribers >= 100_000) badges.push('100K');
  if (subscribers >= 1_000_000) badges.push('1M');
  if (subscribers >= 10_000_000) badges.push('10M');

  if (subscribers >= 100_000_000) {
    const capped = Math.min(subscribers, 999_999_999);
    const hundredM = Math.floor(capped / 100_000_000) * 100_000_000;
    for (let m = 100_000_000; m <= hundredM; m += 100_000_000) {
      badges.push(`${m / 1_000_000}M`);
    }
  }

  if (subscribers >= 1_000_000_000) {
    badges.push('1B');
  }
  return badges;
}

export function getActiveHundredMBadge(subscribers: number): string | null {
  if (subscribers < 100_000_000 || subscribers >= 1_000_000_000) return null;
  const milestone = Math.floor(subscribers / 100_000_000) * 100_000_000;
  return `${milestone / 1_000_000}M`;
}

export function calculateSubscribersGained(views: number): number {
  return Math.floor(views / 10);
}

export function calculateVideoEarnings(views: number, multiplier: number): number {
  const rawCents = Math.round(views * 10 * multiplier);
  return Number((rawCents / 100).toFixed(2));
}

export function getLaptopById(id: string | null | undefined): LaptopSpec | undefined {
  if (!id) return undefined;
  return LAPTOPS.find((l) => l.id === id);
}

export function getGpuById(id: string | null | undefined): GpuSpec | undefined {
  if (!id) return undefined;
  return GPUS.find((g) => g.id === id);
}

export function getGameById(id: string | null | undefined): GameSpec | undefined {
  if (!id) return undefined;
  return GAMES.find((g) => g.id === id);
}

export function getEditorById(id: string | null | undefined): EditorSpec | undefined {
  if (!id) return undefined;
  return EDITORS.find((e) => e.id === id);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return value.toLocaleString('en-US');
}
