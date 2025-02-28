export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  mobileNumber: string;
  branch: string;
  year: string;
  gitamEmail: string;
  registrationNumber: string;
  role: 'user' | 'admin';
  gameAccess: {
    strength: boolean;
    mind: boolean;
    chance: boolean;
  };
  currentGame?: string;
  gameSelectedAt?: string;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameStats {
  totalUsers: number;
  activeUsers: number;
  gameDistribution: {
    strength: number;
    mind: number;
    chance: number;
  };
}

export type GameType = 'strength' | 'mind' | 'chance';