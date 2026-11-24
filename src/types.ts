export interface RecentSubscriberEvent {
  label: string;
  count: number;
  videoTitle: string;
  timestamp: number;
}

export interface PlayerInventory {
  laptops: string[];
  gpus: string[];
  games: string[];
  editors: string[];
  installedGames: string[];
  activeLaptopId: string | null;
  laptopGpus: Record<string, string>;
}

export interface PlayerSettings {
  soundEnabled: boolean;
  soundVolume: number;
}

export interface UserProfile {
  uid: string;
  displayId: string;
  username: string;
  email: string;
  avatarId: string;
  accountStatus: 'active';
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lifetimeVideoEarnings: number;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  rank: string;
  tier: string;
  badges: string[];
  inventory: PlayerInventory;
  settings: PlayerSettings;
  recentSubscribers: RecentSubscriberEvent[];
  lastTransactionId?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface VideoRecord {
  id: string;
  uid: string;
  uploadNonce: string;
  title: string;
  gameId: string;
  gameName: string;
  editorId: string;
  editorName: string;
  laptopId: string;
  gpuId: string;
  views: number;
  subscribersGained: number;
  earnings: number;
  outcomeTier: 'lowest' | 'highest';
  createdAt: unknown;
}

export interface LeaderboardEntry {
  uid: string;
  displayId: string;
  username: string;
  avatarId: string;
  subscribers: number;
  rank: string;
  tier: string;
  totalVideos: number;
  updatedAt: unknown;
}

export interface MarketStockState {
  cycleIndex: number;
  nextRefreshAt: number;
  serverTime: number;
  stock: {
    laptops: Record<string, boolean>;
    gpus: Record<string, boolean>;
    games: Record<string, boolean>;
    editors: Record<string, boolean>;
  };
}

export type AppSection = 'home' | 'studio' | 'store' | 'profile' | 'leaderboards' | 'ranks';
export type StoreCategory = 'laptops' | 'gpus' | 'games' | 'editors' | 'setup';
