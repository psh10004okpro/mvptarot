import request from 'supertest';
import app from '../../src/app';
import { User, TarotCard, Reading } from '../../src/models';
import { createTestCards, cleanupTestData } from '../utils/testHelpers';

describe('Integration Tests - Complete Reading Flow', () => {
  let accessToken: string;
  let userId: string;
  let cards: any[];

  beforeAll(async () => {
    await cleanupTestData();
    cards = await createTestCards(78);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Reading.deleteMany({});
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Complete User Journey - Free Tier', () => {
    it('should complete full flow: register -> login -> daily fortune -> history', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'journey@example.com',
          password: 'Password123!',
          name: '여정테스트',
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      accessToken = registerResponse.body.data.accessToken;
      userId = registerResponse.body.data.user._id;

      // Step 2: Get profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe('journey@example.com');
      expect(profileResponse.body.data.membershipType).toBe('free');
      expect(profileResponse.body.data.dailyReadingCount).toBe(0);

      // Step 3: Get daily fortune
      const fortuneResponse = await request(app)
        .get('/api/tarot/daily-fortune')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(fortuneResponse.body.data.type).toBe('daily');
      const readingId = fortuneResponse.body.data._id;

      // Step 4: Check reading count increased
      const profileAfterReading = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileAfterReading.body.data.dailyReadingCount).toBe(1);

      // Step 5: Create single card reading
      const singleReadingResponse = await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '오늘의 운세는?',
          context: 'general',
        })
        .expect(201);

      expect(singleReadingResponse.body.data.type).toBe('single');

      // Step 6: Create three-card reading
      const threeCardResponse = await request(app)
        .post('/api/tarot/reading/three-card')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '사랑운은 어떤가요?',
          context: 'love',
        })
        .expect(201);

      expect(threeCardResponse.body.data.type).toBe('three-card');
      expect(threeCardResponse.body.data.cards).toHaveLength(3);

      // Step 7: Check reading history
      const historyResponse = await request(app)
        .get('/api/tarot/reading/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(historyResponse.body.data).toHaveLength(3);
      expect(historyResponse.body.pagination.total).toBe(3);

      // Step 8: Attempt 4th reading (should hit limit for free tier)
      const limitResponse = await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '네 번째 질문',
          context: 'general',
        })
        .expect(403);

      expect(limitResponse.body.error).toContain('일일 리딩 횟수');

      // Step 9: Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Complete User Journey - Premium Tier', () => {
    it('should allow unlimited readings for premium users', async () => {
      // Register as premium user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'premium@example.com',
          password: 'Password123!',
          name: '프리미엄',
        })
        .expect(201);

      accessToken = registerResponse.body.data.accessToken;

      // Upgrade to premium (in real app, this would go through payment)
      const user = await User.findOne({ email: 'premium@example.com' });
      if (user) {
        user.membershipType = 'premium';
        await user.save();
      }

      // Create multiple readings (more than free tier limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/tarot/reading/single')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            question: `질문 ${i + 1}`,
            context: 'general',
          })
          .expect(201);
      }

      // Create celtic cross reading (premium feature)
      const celticCrossResponse = await request(app)
        .post('/api/tarot/reading/celtic-cross')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '종합 운세',
          context: 'general',
        })
        .expect(201);

      expect(celticCrossResponse.body.data.type).toBe('celtic-cross');
      expect(celticCrossResponse.body.data.cards).toHaveLength(10);

      // Check history
      const historyResponse = await request(app)
        .get('/api/tarot/reading/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(historyResponse.body.pagination.total).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Voice Reading Flow', () => {
    it('should complete voice-enabled reading flow', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'voice@example.com',
          password: 'Password123!',
          name: '음성테스트',
        })
        .expect(201);

      accessToken = registerResponse.body.data.accessToken;

      // Create voice-enabled reading
      const voiceReadingResponse = await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '오늘의 운세',
          context: 'general',
          isVoiceReading: true,
        })
        .expect(201);

      expect(voiceReadingResponse.body.data.isVoiceReading).toBe(true);
      const readingId = voiceReadingResponse.body.data._id;

      // Request audio synthesis for the reading
      const audioResponse = await request(app)
        .post('/api/voice/synthesize/reading')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          interpretation: voiceReadingResponse.body.data.interpretation,
          cardName: voiceReadingResponse.body.data.cards[0].name,
          readingType: 'general',
        })
        .expect(200);

      expect(audioResponse.body.data).toHaveProperty('intro');
      expect(audioResponse.body.data).toHaveProperty('main');
      expect(audioResponse.body.data).toHaveProperty('totalDuration');
    });
  });

  describe('Multi-Device Session Management', () => {
    it('should handle multiple device logins', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'multidevice@example.com',
          password: 'Password123!',
          name: '멀티디바이스',
        })
        .expect(201);

      // Login from device 1
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'multidevice@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const token1 = login1.body.data.accessToken;

      // Login from device 2
      const login2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'multidevice@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const token2 = login2.body.data.accessToken;

      // Both tokens should work
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // Create reading from device 1
      await request(app)
        .post('/api/tarot/reading/single')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          question: '디바이스 1에서',
          context: 'general',
        })
        .expect(201);

      // History should be accessible from device 2
      const historyResponse = await request(app)
        .get('/api/tarot/reading/history')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(historyResponse.body.data).toHaveLength(1);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh expired access token', async () => {
      // Register and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'Password123!',
          name: '리프레시테스트',
        })
        .expect(201);

      const refreshToken = registerResponse.body.data.refreshToken;

      // Wait a moment then refresh
      await new Promise(resolve => setTimeout(resolve, 100));

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.data).toHaveProperty('accessToken');

      const newAccessToken = refreshResponse.body.data.accessToken;

      // New token should work
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);
    });
  });

  describe('Error Recovery Flow', () => {
    it('should handle and recover from validation errors', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'errors@example.com',
          password: 'Password123!',
          name: '에러테스트',
        })
        .expect(201);

      accessToken = registerResponse.body.data.accessToken;

      // Attempt invalid reading (missing question)
      const invalidResponse = await request(app)
        .post('/api/tarot/reading/three-card')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          context: 'love',
        })
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);

      // Retry with valid data
      const validResponse = await request(app)
        .post('/api/tarot/reading/three-card')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '사랑운은?',
          context: 'love',
        })
        .expect(201);

      expect(validResponse.body.success).toBe(true);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent reading requests', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'concurrent@example.com',
          password: 'Password123!',
          name: '동시요청',
        })
        .expect(201);

      accessToken = registerResponse.body.data.accessToken;

      // Make 3 concurrent requests
      const promises = [
        request(app)
          .post('/api/tarot/reading/single')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ question: '질문1', context: 'general' }),
        request(app)
          .post('/api/tarot/reading/single')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ question: '질문2', context: 'love' }),
        request(app)
          .post('/api/tarot/reading/single')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ question: '질문3', context: 'career' }),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe(201);
        expect(result.body.success).toBe(true);
      });

      // Check final reading count
      const user = await User.findOne({ email: 'concurrent@example.com' });
      expect(user?.dailyReadingCount).toBe(3);
    });
  });

  describe('Card Retrieval and Metadata', () => {
    it('should retrieve complete card information in reading', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'cards@example.com',
          password: 'Password123!',
          name: '카드테스트',
        })
        .expect(201);

      accessToken = registerResponse.body.data.accessToken;

      // Get all cards
      const cardsResponse = await request(app)
        .get('/api/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(cardsResponse.body.data).toHaveLength(78);

      // Create reading
      const readingResponse = await request(app)
        .post('/api/tarot/reading/three-card')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: '카드 정보 테스트',
          context: 'general',
        })
        .expect(201);

      const readingCards = readingResponse.body.data.cards;

      // Each card should have complete information
      readingCards.forEach((card: any) => {
        expect(card).toHaveProperty('cardId');
        expect(card).toHaveProperty('position');
        expect(card).toHaveProperty('orientation');
        expect(['upright', 'reversed']).toContain(card.orientation);
      });
    });
  });
});
