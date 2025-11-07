import Redis from 'ioredis';
import crypto from 'crypto-js';
import { VOICE_CONFIG } from '../../config/voiceConfig';
import dotenv from 'dotenv';

dotenv.config();

interface CachedAudio {
  audioData: string; // Base64 encoded
  contentType: string;
  duration: number;
  size: number;
  createdAt: number;
  speaker: string;
  textHash: string;
}

class AudioCacheService {
  private redis: Redis | null = null;
  private enabled: boolean;
  private cacheExpiry: number;
  private maxCacheSize: number;

  constructor() {
    this.enabled = VOICE_CONFIG.tts.cacheEnabled;
    this.cacheExpiry = VOICE_CONFIG.tts.cacheExpiry;
    this.maxCacheSize = VOICE_CONFIG.costOptimization.maxCacheSize;

    if (this.enabled) {
      this.initializeRedis();
    }
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
      const redisPassword = process.env.REDIS_PASSWORD || '';
      const redisDb = parseInt(process.env.REDIS_DB || '0', 10);

      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        db: redisDb,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected for audio caching');
      });

      this.redis.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
        this.enabled = false; // Disable caching on error
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.enabled = false;
    }
  }

  /**
   * Generate hash for text
   */
  private generateTextHash(text: string, speaker: string): string {
    const content = `${text}:${speaker}`;
    return crypto.SHA256(content).toString();
  }

  /**
   * Get cache key
   */
  private getCacheKey(textHash: string): string {
    return `audio:cache:${textHash}`;
  }

  /**
   * Cache audio data
   */
  async cacheAudio(
    text: string,
    speaker: string,
    audioBuffer: Buffer,
    contentType: string = 'audio/mpeg',
    duration: number = 0
  ): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      const textHash = this.generateTextHash(text, speaker);
      const cacheKey = this.getCacheKey(textHash);

      const cachedData: CachedAudio = {
        audioData: audioBuffer.toString('base64'),
        contentType,
        duration,
        size: audioBuffer.length,
        createdAt: Date.now(),
        speaker,
        textHash
      };

      // Store in Redis with expiry
      await this.redis.setex(
        cacheKey,
        this.cacheExpiry,
        JSON.stringify(cachedData)
      );

      // Update cache stats
      await this.incrementStats('cached');

      console.log(`✅ Cached audio for text hash: ${textHash}`);
    } catch (error) {
      console.error('Error caching audio:', error);
    }
  }

  /**
   * Get audio from cache
   */
  async getFromCache(
    text: string,
    speaker: string
  ): Promise<{ buffer: Buffer; contentType: string; duration: number } | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const textHash = this.generateTextHash(text, speaker);
      const cacheKey = this.getCacheKey(textHash);

      const cached = await this.redis.get(cacheKey);

      if (!cached) {
        await this.incrementStats('miss');
        return null;
      }

      const cachedData: CachedAudio = JSON.parse(cached);

      // Update cache stats
      await this.incrementStats('hit');

      return {
        buffer: Buffer.from(cachedData.audioData, 'base64'),
        contentType: cachedData.contentType,
        duration: cachedData.duration
      };
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Pre-generate common phrases
   */
  async preGenerateCommonPhrases(
    generator: (text: string, speaker: string) => Promise<{
      buffer: Buffer;
      contentType: string;
      duration: number;
    }>
  ): Promise<void> {
    if (!this.enabled || !VOICE_CONFIG.costOptimization.preGenerateCommon) {
      return;
    }

    console.log('🔄 Pre-generating common phrases...');

    const phrases = VOICE_CONFIG.tts.commonPhrases;
    const speaker = VOICE_CONFIG.tts.defaultSpeaker;

    for (const phrase of phrases) {
      try {
        // Check if already cached
        const cached = await this.getFromCache(phrase, speaker);

        if (cached) {
          console.log(`⏭️ Phrase already cached: "${phrase.substring(0, 20)}..."`);
          continue;
        }

        // Generate and cache
        const result = await generator(phrase, speaker);
        await this.cacheAudio(phrase, speaker, result.buffer, result.contentType, result.duration);

        console.log(`✅ Pre-generated: "${phrase.substring(0, 20)}..."`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error pre-generating phrase: "${phrase}"`, error);
      }
    }

    console.log('✅ Common phrases pre-generation complete');
  }

  /**
   * Clear specific cache entry
   */
  async clearCacheEntry(text: string, speaker: string): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      const textHash = this.generateTextHash(text, speaker);
      const cacheKey = this.getCacheKey(textHash);

      await this.redis.del(cacheKey);
      console.log(`✅ Cleared cache for text hash: ${textHash}`);
    } catch (error) {
      console.error('Error clearing cache entry:', error);
    }
  }

  /**
   * Clear all cached audio
   */
  async clearAllCache(): Promise<void> {
    if (!this.enabled || !this.redis) {
      return;
    }

    try {
      const keys = await this.redis.keys('audio:cache:*');

      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`✅ Cleared ${keys.length} cached audio entries`);
      }
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalCached: number;
    hits: number;
    misses: number;
    hitRate: number;
    estimatedSavings: number; // in USD
  }> {
    if (!this.enabled || !this.redis) {
      return {
        totalCached: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        estimatedSavings: 0
      };
    }

    try {
      const [cachedStr, hitsStr, missesStr] = await Promise.all([
        this.redis.get('audio:stats:cached'),
        this.redis.get('audio:stats:hit'),
        this.redis.get('audio:stats:miss')
      ]);

      const cached = parseInt(cachedStr || '0', 10);
      const hits = parseInt(hitsStr || '0', 10);
      const misses = parseInt(missesStr || '0', 10);

      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      // Estimate cost savings (assuming $0.016 per 1000 characters for CLOVA TTS)
      // Average 100 characters per request
      const avgCharsPerRequest = 100;
      const costPer1000Chars = 0.016;
      const estimatedSavings = (hits * avgCharsPerRequest * costPer1000Chars) / 1000;

      return {
        totalCached: cached,
        hits,
        misses,
        hitRate: Math.round(hitRate * 100) / 100,
        estimatedSavings: Math.round(estimatedSavings * 100) / 100
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalCached: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        estimatedSavings: 0
      };
    }
  }

  /**
   * Increment cache statistics
   */
  private async incrementStats(type: 'cached' | 'hit' | 'miss'): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.incr(`audio:stats:${type}`);
    } catch (error) {
      console.error('Error incrementing stats:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      console.log('✅ Redis connection closed');
    }
  }
}

// Singleton instance
const audioCacheService = new AudioCacheService();

export default audioCacheService;
export { AudioCacheService, CachedAudio };
