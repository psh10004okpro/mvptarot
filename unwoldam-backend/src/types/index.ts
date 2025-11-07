import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// User types
export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  nickname?: string;
  birthDate?: Date;
  membershipType: 'free' | 'basic' | 'premium';
  dailyReadingCount: number;
  lastReadingReset: Date;
  preferences: {
    favoriteSpread?: string;
    notificationEnabled: boolean;
  };
  createdAt: Date;
  lastLoginAt: Date;
}

// Auth types
export interface IAuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    membershipType: string;
  };
}

export interface ITokenPayload extends JwtPayload {
  userId: string;
  email: string;
  membershipType: string;
}

export interface IRegisterDTO {
  email: string;
  password: string;
  name: string;
  nickname?: string;
  birthDate?: string;
}

export interface ILoginDTO {
  email: string;
  password: string;
}

// Tarot Card types
export interface ITarotCard {
  _id: string;
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
}

// Reading types
export interface IReadingCard {
  position: number;
  cardId: string;
  orientation: 'upright' | 'reversed';
}

export interface IReading {
  _id: string;
  userId: string;
  type: 'daily' | 'single' | 'three-card' | 'celtic-cross';
  cards: IReadingCard[];
  question?: string;
  interpretation: string;
  context: 'general' | 'love' | 'career' | 'health' | 'spiritual';
  isVoiceReading: boolean;
  createdAt: Date;
}

export interface ICreateReadingDTO {
  type: 'daily' | 'single' | 'three-card' | 'celtic-cross';
  question?: string;
  context?: 'general' | 'love' | 'career' | 'health' | 'spiritual';
  isVoiceReading?: boolean;
}

// Interpretation types (10,031개 데이터)
export interface IInterpretation {
  _id: string;
  cardId: string;
  combinationIds?: string[];
  context: string;
  orientation: 'upright' | 'reversed';
  interpretation: string;
  keywords: string[];
  mzStyle: boolean;
  qualityScore: number;
}

// Subscription types
export interface ISubscription {
  _id: string;
  userId: string;
  plan: 'basic' | 'premium';
  startDate: Date;
  endDate: Date;
  paymentMethod: string;
  amount: number;
  status: 'active' | 'cancelled' | 'expired';
  createdAt: Date;
}

export interface ISubscribeDTO {
  plan: 'basic' | 'premium';
  paymentMethod: string;
}

// API Response types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
