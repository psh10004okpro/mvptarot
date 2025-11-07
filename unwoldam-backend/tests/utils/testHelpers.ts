import { User, TarotCard, Reading } from '../../src/models';
import { generateAccessToken, generateRefreshToken } from '../../src/utils/jwt';

/**
 * Create a test user
 */
export async function createTestUser(data?: Partial<{
  email: string;
  password: string;
  name: string;
  membershipType: 'free' | 'basic' | 'premium';
}>) {
  const defaultData = {
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    name: '테스트 사용자',
    membershipType: 'free' as const,
  };

  const user = await User.create({
    ...defaultData,
    ...data,
  });

  return user;
}

/**
 * Create test user and get auth tokens
 */
export async function createAuthenticatedUser(membershipType: 'free' | 'basic' | 'premium' = 'free') {
  const user = await createTestUser({ membershipType });

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    membershipType: user.membershipType,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    email: user.email,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
}

/**
 * Create test tarot cards
 */
export async function createTestCards(count: number = 78) {
  const cards = [];

  // Create Major Arcana (22 cards)
  for (let i = 0; i < Math.min(count, 22); i++) {
    cards.push({
      cardNumber: i,
      name: `Major ${i}`,
      nameKo: `메이저 ${i}`,
      arcana: 'major' as const,
      keywords: ['test', 'keyword'],
      basicMeaning: {
        upright: `Upright meaning for card ${i}`,
        reversed: `Reversed meaning for card ${i}`,
      },
    });
  }

  // Create Minor Arcana if needed
  if (count > 22) {
    const suits = ['wands', 'cups', 'swords', 'pentacles'] as const;
    let cardNumber = 22;

    for (let i = 0; i < count - 22; i++) {
      const suit = suits[Math.floor(i / 14) % 4];
      cards.push({
        cardNumber: cardNumber++,
        name: `${suit} ${i % 14}`,
        nameKo: `${suit} ${i % 14}`,
        arcana: 'minor' as const,
        suit,
        keywords: ['test', 'keyword'],
        basicMeaning: {
          upright: `Upright meaning`,
          reversed: `Reversed meaning`,
        },
      });
    }
  }

  const createdCards = await TarotCard.insertMany(cards);
  return createdCards;
}

/**
 * Create a test reading
 */
export async function createTestReading(userId: string, cardIds: string[]) {
  const reading = await Reading.create({
    userId,
    type: 'single',
    cards: cardIds.map((cardId, index) => ({
      position: index,
      cardId,
      orientation: Math.random() > 0.5 ? 'upright' : 'reversed',
    })),
    interpretation: 'Test interpretation',
    context: 'general',
    isVoiceReading: false,
  });

  return reading;
}

/**
 * Wait for a promise to resolve with timeout
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock external API calls
 */
export function mockExternalAPIs() {
  // Mock OpenAI embeddings
  jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }],
        }),
      },
    })),
  }));

  // Mock Anthropic Claude
  jest.mock('@anthropic-ai/sdk', () => ({
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Mocked AI response' }],
          usage: { input_tokens: 100, output_tokens: 200 },
        }),
      },
    })),
  }));
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  await Promise.all([
    User.deleteMany({}),
    TarotCard.deleteMany({}),
    Reading.deleteMany({}),
  ]);
}

/**
 * Generate random test data
 */
export const testData = {
  email: () => `test${Date.now()}${Math.random()}@example.com`,
  name: () => `테스트유저${Math.floor(Math.random() * 1000)}`,
  password: () => 'TestPassword123!',
  question: () => '오늘의 운세는 어떤가요?',
  interpretation: () => `테스트 해석 내용: ${Date.now()}`,
};
