import apiClient from './api';
import { Reading, TarotCard, ReadingType, ReadingContext, PaginatedResponse } from '@types/models';

interface CreateReadingData {
  type: ReadingType;
  question?: string;
  context?: ReadingContext;
  isVoiceReading?: boolean;
}

class TarotService {
  /**
   * Get daily fortune
   */
  async getDailyFortune(): Promise<Reading> {
    const response = await apiClient.get<Reading>('/tarot/daily-fortune');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '오늘의 운세를 불러오는데 실패했습니다.');
  }

  /**
   * Create a new tarot reading
   */
  async createReading(data: CreateReadingData): Promise<Reading> {
    const endpoint = this.getReadingEndpoint(data.type);
    const response = await apiClient.post<Reading>(endpoint, data);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '타로 리딩 생성에 실패했습니다.');
  }

  /**
   * Get reading by ID
   */
  async getReadingById(id: string): Promise<Reading> {
    const response = await apiClient.get<Reading>(`/tarot/reading/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '리딩 정보를 불러오는데 실패했습니다.');
  }

  /**
   * Get reading history
   */
  async getReadingHistory(page: number = 1, limit: number = 10): Promise<{
    readings: Reading[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await apiClient.get<PaginatedResponse<Reading>>('/tarot/reading/history', {
      params: { page, limit },
    });

    if (response.data.success) {
      return {
        readings: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }

    throw new Error(response.data.error || '히스토리를 불러오는데 실패했습니다.');
  }

  /**
   * Get all tarot cards
   */
  async getAllCards(): Promise<TarotCard[]> {
    const response = await apiClient.get<TarotCard[]>('/cards');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '카드 정보를 불러오는데 실패했습니다.');
  }

  /**
   * Get card by ID
   */
  async getCardById(id: string): Promise<TarotCard> {
    const response = await apiClient.get<TarotCard>(`/cards/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '카드 정보를 불러오는데 실패했습니다.');
  }

  /**
   * Get helper method to determine endpoint based on reading type
   */
  private getReadingEndpoint(type: ReadingType): string {
    const endpoints: Record<ReadingType, string> = {
      daily: '/tarot/daily-fortune',
      single: '/tarot/reading/single',
      'three-card': '/tarot/reading/three-card',
      'celtic-cross': '/tarot/reading/celtic-cross',
    };

    return endpoints[type] || '/tarot/reading/single';
  }

  /**
   * Get recommended spread type based on context
   */
  getRecommendedSpread(context: ReadingContext): ReadingType {
    const recommendations: Record<ReadingContext, ReadingType> = {
      general: 'three-card',
      love: 'three-card',
      career: 'three-card',
      health: 'single',
      spiritual: 'celtic-cross',
    };

    return recommendations[context] || 'three-card';
  }

  /**
   * Get required card count for spread type
   */
  getRequiredCardCount(type: ReadingType): number {
    const counts: Record<ReadingType, number> = {
      daily: 1,
      single: 1,
      'three-card': 3,
      'celtic-cross': 10,
    };

    return counts[type] || 1;
  }
}

// Singleton instance
const tarotService = new TarotService();

export default tarotService;
