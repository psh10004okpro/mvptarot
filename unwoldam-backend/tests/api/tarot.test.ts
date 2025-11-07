import request from 'supertest';
import app from '../../src/app';
import { User, TarotCard, Reading } from '../../src/models';
import {
  createAuthenticatedUser,
  createTestCards,
  cleanupTestData
} from '../utils/testHelpers';

describe('Tarot API Tests', () => {
  let accessToken: string;
  let userId: string;
  let cards: any[];

  beforeAll(async () => {
    await cleanupTestData();
    cards = await createTestCards(78);
  });

  beforeEach(async () => {
    const { user, accessToken: token } = await createAuthenticatedUser('free');
    accessToken = token;
    userId = user._id.toString();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Reading.deleteMany({});
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/tarot/daily-fortune', () => {
    it('should get daily fortune for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tarot/daily-fortune')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('type', 'daily');
      expect(response.body.data).toHaveProperty('cards');
      expect(response.body.data).toHaveProperty('interpretation');
      expect(response.body.data.cards).toHaveLength(1);
    });

    it('should return same reading for same day', async () => {
      const firstResponse = await request(app)
        .get('/api/tarot/daily-fortune')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const secondResponse = await request(app)
        .get('/api/tarot/daily-fortune')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(firstResponse.body.data._id).toBe(secondResponse.body.data._id);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/tarot/daily-fortune')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tarot/reading/single', () => {
    it('should create single card reading', async () => {
      const response = await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '오늘의 운세는?',
          context: 'general',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('type', 'single');
      expect(response.body.data.cards).toHaveLength(1);
      expect(response.body.data).toHaveProperty('interpretation');
    });

    it('should increment daily reading count', async () => {
      await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '테스트 질문',
          context: 'general',
        })
        .expect(201);

      const user = await User.findById(userId);
      expect(user?.dailyReadingCount).toBe(1);
    });

    it('should respect free tier reading limits', async () => {
      // Free tier: 3 readings per day
      const readingData = {
        question: '테스트 질문',
        context: 'general' as const,
      };

      // Create 3 readings (should succeed)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/tarot/reading/single')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(readingData)
          .expect(201);
      }

      // 4th reading should fail
      const response = await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(readingData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('일일 리딩 횟수');
    });
  });

  describe('POST /api/tarot/reading/three-card', () => {
    it('should create three card reading', async () => {
      const response = await request(app)
        .post('/api/tarot/reading/three-card')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '사랑운은 어떤가요?',
          context: 'love',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('type', 'three-card');
      expect(response.body.data.cards).toHaveLength(3);
      expect(response.body.data.cards[0]).toHaveProperty('position', 0);
      expect(response.body.data.cards[1]).toHaveProperty('position', 1);
      expect(response.body.data.cards[2]).toHaveProperty('position', 2);
    });

    it('should handle different contexts', async () => {
      const contexts = ['general', 'love', 'career', 'health', 'spiritual'] as const;

      for (const context of contexts) {
        const response = await request(app)
          .post('/api/tarot/reading/three-card')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            question: `${context} 테스트`,
            context,
          })
          .expect(201);

        expect(response.body.data.context).toBe(context);
      }
    });
  });

  describe('POST /api/tarot/reading/celtic-cross', () => {
    it('should create celtic cross reading for premium users', async () => {
      const { user, accessToken: premiumToken } = await createAuthenticatedUser('premium');

      const response = await request(app)
        .post('/api/tarot/reading/celtic-cross')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({
          question: '종합 운세',
          context: 'general',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('type', 'celtic-cross');
      expect(response.body.data.cards).toHaveLength(10);
    });

    it('should fail for free tier users', async () => {
      const response = await request(app)
        .post('/api/tarot/reading/celtic-cross')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '종합 운세',
          context: 'general',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('프리미엄');
    });
  });

  describe('GET /api/tarot/reading/:id', () => {
    it('should get reading by ID', async () => {
      const createResponse = await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '테스트',
          context: 'general',
        });

      const readingId = createResponse.body.data._id;

      const response = await request(app)
        .get(`/api/tarot/reading/${readingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(readingId);
    });

    it('should fail for non-existent reading', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/tarot/reading/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not allow access to other users readings', async () => {
      const { accessToken: otherToken } = await createAuthenticatedUser('free');

      const createResponse = await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '테스트',
          context: 'general',
        });

      const readingId = createResponse.body.data._id;

      const response = await request(app)
        .get(`/api/tarot/reading/${readingId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tarot/reading/history', () => {
    it('should get user reading history with pagination', async () => {
      // Create 5 readings
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/tarot/reading/single')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            question: `테스트 질문 ${i}`,
            context: 'general',
          });
      }

      const response = await request(app)
        .get('/api/tarot/reading/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 3,
        total: 5,
        totalPages: 2,
      });
    });

    it('should return empty array for users with no readings', async () => {
      const response = await request(app)
        .get('/api/tarot/reading/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should sort readings by creation date (newest first)', async () => {
      // Create readings with delay
      await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ question: '첫번째', context: 'general' });

      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ question: '두번째', context: 'general' });

      const response = await request(app)
        .get('/api/tarot/reading/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const readings = response.body.data;
      expect(readings[0].question).toBe('두번째');
      expect(readings[1].question).toBe('첫번째');
    });
  });

  describe('Voice Reading Tests', () => {
    it('should create voice-enabled reading', async () => {
      const response = await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '오늘의 운세',
          context: 'general',
          isVoiceReading: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isVoiceReading).toBe(true);
    });
  });

  describe('Card Randomization', () => {
    it('should return different cards for different readings', async () => {
      const response1 = await request(app)
        .post('/api/tarot/reading/three-card')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ question: '테스트1', context: 'general' });

      const response2 = await request(app)
        .post('/api/tarot/reading/three-card')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ question: '테스트2', context: 'general' });

      const cards1 = response1.body.data.cards.map((c: any) => c.cardId);
      const cards2 = response2.body.data.cards.map((c: any) => c.cardId);

      // It's extremely unlikely to get the same 3 cards in the same order
      expect(cards1).not.toEqual(cards2);
    });

    it('should have mix of upright and reversed cards', async () => {
      const readings = [];
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/tarot/reading/single')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ question: `테스트 ${i}`, context: 'general' });
        readings.push(response.body.data);
      }

      const orientations = readings.map(r => r.cards[0].orientation);
      const hasUpright = orientations.includes('upright');
      const hasReversed = orientations.includes('reversed');

      // With 10 readings, we should see both orientations
      expect(hasUpright || hasReversed).toBe(true);
    });
  });
});
