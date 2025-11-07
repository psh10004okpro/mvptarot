import tarotService from '../../src/services/tarotService';
import apiClient from '../../src/services/api';

jest.mock('../../src/services/api');

describe('TarotService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyFortune', () => {
    it('should get daily fortune', async () => {
      const mockReading = {
        _id: 'reading123',
        type: 'daily',
        cards: [
          {
            cardId: 'card1',
            position: 0,
            orientation: 'upright',
          },
        ],
        interpretation: '오늘의 운세입니다.',
      };

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReading,
        },
      } as any);

      const result = await tarotService.getDailyFortune();

      expect(result.type).toBe('daily');
      expect(result.cards).toHaveLength(1);
      expect(mockApiClient.get).toHaveBeenCalledWith('/tarot/daily-fortune');
    });
  });

  describe('createReading', () => {
    it('should create single card reading', async () => {
      const mockReading = {
        _id: 'reading456',
        type: 'single',
        cards: [{ cardId: 'card1', position: 0, orientation: 'upright' }],
        interpretation: '단일 카드 해석',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockReading,
        },
      } as any);

      const result = await tarotService.createReading({
        type: 'single',
        question: '오늘의 운세는?',
        context: 'general',
      });

      expect(result.type).toBe('single');
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/tarot/reading/single',
        expect.objectContaining({
          type: 'single',
          question: '오늘의 운세는?',
        })
      );
    });

    it('should create three-card reading', async () => {
      const mockReading = {
        _id: 'reading789',
        type: 'three-card',
        cards: [
          { cardId: 'card1', position: 0, orientation: 'upright' },
          { cardId: 'card2', position: 1, orientation: 'reversed' },
          { cardId: 'card3', position: 2, orientation: 'upright' },
        ],
        interpretation: '3장 카드 해석',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockReading,
        },
      } as any);

      const result = await tarotService.createReading({
        type: 'three-card',
        question: '사랑운은?',
        context: 'love',
      });

      expect(result.type).toBe('three-card');
      expect(result.cards).toHaveLength(3);
    });
  });

  describe('getReadingHistory', () => {
    it('should get reading history with pagination', async () => {
      const mockReadings = [
        { _id: 'r1', type: 'single', interpretation: 'Reading 1' },
        { _id: 'r2', type: 'three-card', interpretation: 'Reading 2' },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReadings,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
      } as any);

      const result = await tarotService.getReadingHistory(1, 10);

      expect(result.readings).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/tarot/reading/history',
        { params: { page: 1, limit: 10 } }
      );
    });
  });

  describe('getAllCards', () => {
    it('should get all tarot cards', async () => {
      const mockCards = Array.from({ length: 78 }, (_, i) => ({
        _id: `card${i}`,
        cardNumber: i,
        name: `Card ${i}`,
        nameKo: `카드 ${i}`,
      }));

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockCards,
        },
      } as any);

      const result = await tarotService.getAllCards();

      expect(result).toHaveLength(78);
      expect(mockApiClient.get).toHaveBeenCalledWith('/cards');
    });
  });

  describe('Helper Methods', () => {
    it('should recommend correct spread type based on context', () => {
      expect(tarotService.getRecommendedSpread('general')).toBe('three-card');
      expect(tarotService.getRecommendedSpread('love')).toBe('three-card');
      expect(tarotService.getRecommendedSpread('career')).toBe('three-card');
      expect(tarotService.getRecommendedSpread('health')).toBe('single');
      expect(tarotService.getRecommendedSpread('spiritual')).toBe('celtic-cross');
    });

    it('should return correct required card count', () => {
      expect(tarotService.getRequiredCardCount('daily')).toBe(1);
      expect(tarotService.getRequiredCardCount('single')).toBe(1);
      expect(tarotService.getRequiredCardCount('three-card')).toBe(3);
      expect(tarotService.getRequiredCardCount('celtic-cross')).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when API fails', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: false,
          error: '서버 오류가 발생했습니다.',
        },
      } as any);

      await expect(tarotService.getDailyFortune()).rejects.toThrow(
        '서버 오류가 발생했습니다.'
      );
    });
  });
});
