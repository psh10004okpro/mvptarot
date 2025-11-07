// User types
export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  birthDate?: string;
  membershipType: 'free' | 'basic' | 'premium';
  dailyReadingCount: number;
  lastReadingReset: string;
  preferences: {
    favoriteSpread?: string;
    notificationEnabled: boolean;
  };
  createdAt: string;
  lastLoginAt: string;
}

// Tarot Card types
export interface TarotCard {
  id: string;
  cardNumber: number;
  name: string;
  nameKo: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  keywords: string[];
  basicMeaning: {
    upright: string;
    reversed: string;
  };
  imageUrl?: string;
  description?: string;
}

// Reading types
export type ReadingType = 'daily' | 'single' | 'three-card' | 'celtic-cross';
export type ReadingContext = 'general' | 'love' | 'career' | 'health' | 'spiritual';
export type CardOrientation = 'upright' | 'reversed';

export interface ReadingCard {
  position: number;
  cardId: string;
  card?: TarotCard;
  orientation: CardOrientation;
  positionName?: string;
}

export interface Reading {
  id: string;
  userId: string;
  type: ReadingType;
  cards: ReadingCard[];
  question?: string;
  interpretation: string;
  context: ReadingContext;
  isVoiceReading: boolean;
  voiceUrl?: string;
  createdAt: string;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'basic' | 'premium';
  startDate: string;
  endDate: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired';
  autoRenew: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  dailyLimit: number;
  features: string[];
}

// Voice types
export interface VoiceOptions {
  speaker?: string;
  emotion?: number;
  speed?: number;
  pitch?: number;
}

export interface AudioResult {
  audioUrl?: string;
  duration: number;
  size: number;
  fromCache: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// App State types
export interface AppState {
  isLoading: boolean;
  error: string | null;
}

export interface AuthState extends AppState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface TarotState extends AppState {
  cards: TarotCard[];
  currentReading: Reading | null;
  readingHistory: Reading[];
  selectedCards: ReadingCard[];
  isShuffling: boolean;
}

export interface SubscriptionState extends AppState {
  currentSubscription: Subscription | null;
  plans: SubscriptionPlan[];
}
