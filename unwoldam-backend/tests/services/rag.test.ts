import { RAGService } from '../../src/services/ai/ragService';
import { VectorStore } from '../../src/services/ai/vectorStore';
import { LLMService } from '../../src/services/ai/llmService';
import { TarotCard } from '../../src/models';
import { createTestCards, cleanupTestData } from '../utils/testHelpers';

// Mock external services
jest.mock('../../src/services/ai/vectorStore');
jest.mock('../../src/services/ai/llmService');
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('RAG Service Tests', () => {
  let ragService: RAGService;
  let mockVectorStore: jest.Mocked<VectorStore>;
  let mockLLMService: jest.Mocked<LLMService>;
  let testCards: any[];

  beforeAll(async () => {
    await cleanupTestData();
    testCards = await createTestCards(78);
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock vector store
    mockVectorStore = new VectorStore() as jest.Mocked<VectorStore>;
    mockVectorStore.findSimilarInterpretations = jest.fn().mockResolvedValue([
      {
        id: 'int1',
        text: '더 풀 카드는 새로운 시작을 의미합니다.',
        similarity: 0.95,
        metadata: {
          cardName: 'The Fool',
          context: 'general',
          orientation: 'upright',
        },
      },
      {
        id: 'int2',
        text: '어리석은 자는 무한한 가능성을 품고 있습니다.',
        similarity: 0.87,
        metadata: {
          cardName: 'The Fool',
          context: 'career',
          orientation: 'upright',
        },
      },
    ]);

    // Setup mock LLM service
    mockLLMService = new LLMService() as jest.Mocked<LLMService>;
    mockLLMService.generatePersonalizedReading = jest.fn().mockResolvedValue({
      interpretation: '새로운 시작의 에너지가 느껴집니다. 🌟 지금은 망설이지 말고 첫 걸음을 내딛을 때입니다.',
      usage: {
        inputTokens: 500,
        outputTokens: 200,
        totalTokens: 700,
        estimatedCost: 0.005,
      },
    });

    ragService = new RAGService();
    (ragService as any).vectorStore = mockVectorStore;
    (ragService as any).llmService = mockLLMService;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('generatePersonalizedReading', () => {
    it('should generate personalized reading with context', async () => {
      const cards = [
        {
          cardId: testCards[0]._id.toString(),
          name: testCards[0].name,
          nameKo: testCards[0].nameKo,
          orientation: 'upright' as const,
          keywords: testCards[0].keywords,
        },
      ];

      const userContext = {
        userId: 'user123',
        age: 25,
        previousReadings: [],
      };

      const result = await ragService.generatePersonalizedReading(
        cards,
        userContext,
        'single',
        'general'
      );

      expect(result).toHaveProperty('interpretation');
      expect(result).toHaveProperty('similarInterpretations');
      expect(result).toHaveProperty('usage');
      expect(mockVectorStore.findSimilarInterpretations).toHaveBeenCalled();
      expect(mockLLMService.generatePersonalizedReading).toHaveBeenCalled();
    });

    it('should handle three-card reading', async () => {
      const cards = testCards.slice(0, 3).map((card, index) => ({
        cardId: card._id.toString(),
        name: card.name,
        nameKo: card.nameKo,
        orientation: index % 2 === 0 ? 'upright' as const : 'reversed' as const,
        keywords: card.keywords,
      }));

      const userContext = {
        userId: 'user123',
        age: 30,
        previousReadings: [],
      };

      const result = await ragService.generatePersonalizedReading(
        cards,
        userContext,
        'three-card',
        'love'
      );

      expect(result.interpretation).toBeTruthy();
      expect(mockVectorStore.findSimilarInterpretations).toHaveBeenCalledTimes(3);
    });

    it('should use previous readings for personalization', async () => {
      const cards = [
        {
          cardId: testCards[0]._id.toString(),
          name: testCards[0].name,
          nameKo: testCards[0].nameKo,
          orientation: 'upright' as const,
          keywords: testCards[0].keywords,
        },
      ];

      const userContext = {
        userId: 'user123',
        age: 28,
        previousReadings: [
          {
            date: new Date(),
            cards: ['The Fool'],
            interpretation: '이전 리딩 내용',
          },
        ],
      };

      const result = await ragService.generatePersonalizedReading(
        cards,
        userContext,
        'single',
        'career'
      );

      const llmCallArgs = mockLLMService.generatePersonalizedReading.mock.calls[0][0];
      expect(llmCallArgs.userContext).toBeDefined();
      expect(llmCallArgs.userContext.previousReadings).toHaveLength(1);
    });

    it('should handle different contexts', async () => {
      const contexts = ['general', 'love', 'career', 'health', 'spiritual'] as const;
      const cards = [
        {
          cardId: testCards[0]._id.toString(),
          name: testCards[0].name,
          nameKo: testCards[0].nameKo,
          orientation: 'upright' as const,
          keywords: testCards[0].keywords,
        },
      ];

      const userContext = {
        userId: 'user123',
        age: 25,
        previousReadings: [],
      };

      for (const context of contexts) {
        await ragService.generatePersonalizedReading(
          cards,
          userContext,
          'single',
          context
        );

        expect(mockLLMService.generatePersonalizedReading).toHaveBeenLastCalledWith(
          expect.objectContaining({
            context,
          }),
          'single',
          context
        );
      }
    });

    it('should handle reversed cards differently', async () => {
      const cards = [
        {
          cardId: testCards[0]._id.toString(),
          name: testCards[0].name,
          nameKo: testCards[0].nameKo,
          orientation: 'reversed' as const,
          keywords: testCards[0].keywords,
        },
      ];

      const userContext = {
        userId: 'user123',
        age: 25,
        previousReadings: [],
      };

      await ragService.generatePersonalizedReading(
        cards,
        userContext,
        'single',
        'general'
      );

      expect(mockVectorStore.findSimilarInterpretations).toHaveBeenCalledWith(
        expect.any(String),
        'reversed',
        5
      );
    });
  });

  describe('buildPromptContext', () => {
    it('should build proper context for single card', async () => {
      const cards = [
        {
          cardId: testCards[0]._id.toString(),
          name: testCards[0].name,
          nameKo: testCards[0].nameKo,
          orientation: 'upright' as const,
          keywords: testCards[0].keywords,
        },
      ];

      const userContext = {
        userId: 'user123',
        age: 25,
        previousReadings: [],
      };

      const context = await (ragService as any).buildPromptContext(
        cards,
        userContext,
        'single',
        'general'
      );

      expect(context).toHaveProperty('cards');
      expect(context).toHaveProperty('userContext');
      expect(context).toHaveProperty('similarInterpretations');
      expect(context.cards).toHaveLength(1);
    });

    it('should include MZ-style language hints', async () => {
      const cards = [
        {
          cardId: testCards[0]._id.toString(),
          name: testCards[0].name,
          nameKo: testCards[0].nameKo,
          orientation: 'upright' as const,
          keywords: testCards[0].keywords,
        },
      ];

      const userContext = {
        userId: 'user123',
        age: 22, // MZ generation
        previousReadings: [],
      };

      await ragService.generatePersonalizedReading(
        cards,
        userContext,
        'single',
        'general'
      );

      const llmCallArgs = mockLLMService.generatePersonalizedReading.mock.calls[0][0];
      expect(llmCallArgs.userContext.age).toBe(22);
    });
  });

  describe('Error Handling', () => {
    it('should handle vector store errors gracefully', async () => {
      mockVectorStore.findSimilarInterpretations.mockRejectedValue(
        new Error('Vector store error')
      );

      const cards = [
        {
          cardId: testCards[0]._id.toString(),
          name: testCards[0].name,
          nameKo: testCards[0].nameKo,
          orientation: 'upright' as const,
          keywords: testCards[0].keywords,
        },
      ];

      const userContext = {
        userId: 'user123',
        age: 25,
        previousReadings: [],
      };

      // Should still generate reading even if vector search fails
      await expect(
        ragService.generatePersonalizedReading(
          cards,
          userContext,
          'single',
          'general'
        )
      ).resolves.toBeDefined();
    });

    it('should handle LLM errors', async () => {
      mockLLMService.generatePersonalizedReading.mockRejectedValue(
        new Error('LLM API error')
      );

      const cards = [
        {
          cardId: testCards[0]._id.toString(),
          name: testCards[0].name,
          nameKo: testCards[0].nameKo,
          orientation: 'upright' as const,
          keywords: testCards[0].keywords,
        },
      ];

      const userContext = {
        userId: 'user123',
        age: 25,
        previousReadings: [],
      };

      await expect(
        ragService.generatePersonalizedReading(
          cards,
          userContext,
          'single',
          'general'
        )
      ).rejects.toThrow('LLM API error');
    });
  });

  describe('Token Usage Tracking', () => {
    it('should track token usage and costs', async () => {
      const cards = [
        {
          cardId: testCards[0]._id.toString(),
          name: testCards[0].name,
          nameKo: testCards[0].nameKo,
          orientation: 'upright' as const,
          keywords: testCards[0].keywords,
        },
      ];

      const userContext = {
        userId: 'user123',
        age: 25,
        previousReadings: [],
      };

      const result = await ragService.generatePersonalizedReading(
        cards,
        userContext,
        'single',
        'general'
      );

      expect(result.usage).toMatchObject({
        inputTokens: expect.any(Number),
        outputTokens: expect.any(Number),
        totalTokens: expect.any(Number),
        estimatedCost: expect.any(Number),
      });
    });
  });
});
