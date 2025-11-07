import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  includeQuery?: boolean;
  includeHeaders?: boolean;
  excludeFields?: string[];
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, options: CacheOptions): string {
  const parts: string[] = [
    options.keyPrefix || 'cache',
    req.method,
    req.path,
  ];

  // Include query parameters
  if (options.includeQuery && Object.keys(req.query).length > 0) {
    const queryString = JSON.stringify(req.query);
    parts.push(crypto.createHash('md5').update(queryString).digest('hex'));
  }

  // Include user ID from auth
  if (req.user?.userId) {
    parts.push(`user:${req.user.userId}`);
  }

  // Include specific headers
  if (options.includeHeaders) {
    const relevantHeaders = ['accept-language', 'user-agent'];
    const headerData = relevantHeaders
      .filter(h => req.headers[h])
      .map(h => `${h}:${req.headers[h]}`)
      .join('|');
    if (headerData) {
      parts.push(crypto.createHash('md5').update(headerData).digest('hex'));
    }
  }

  return parts.join(':');
}

/**
 * Response caching middleware
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const ttl = options.ttl || 300; // Default 5 minutes

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req, options);

    try {
      // Try to get cached response
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);

        const parsed = JSON.parse(cachedData);

        // Set cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);

        return res.status(parsed.statusCode || 200).json(parsed.data);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any) {
        const responseData = {
          statusCode: res.statusCode,
          data,
        };

        // Cache the response
        redis.setex(cacheKey, ttl, JSON.stringify(responseData))
          .catch(err => console.error('Cache set error:', err));

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without cache on error
      next();
    }
  };
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    const deleted = await redis.del(...keys);
    console.log(`🗑️  Invalidated ${deleted} cache entries matching: ${pattern}`);

    return deleted;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Invalidate cache for a specific user
 */
export async function invalidateUserCache(userId: string): Promise<number> {
  return invalidateCache(`cache:*:user:${userId}*`);
}

/**
 * Invalidate cache for specific routes
 */
export async function invalidateRouteCache(route: string): Promise<number> {
  return invalidateCache(`cache:*:${route}*`);
}

/**
 * Cache decorator for specific routes
 */
export const cacheFor = {
  // Short cache - 1 minute
  short: cacheMiddleware({ ttl: 60 }),

  // Medium cache - 5 minutes
  medium: cacheMiddleware({ ttl: 300 }),

  // Long cache - 1 hour
  long: cacheMiddleware({ ttl: 3600 }),

  // Very long cache - 24 hours
  veryLong: cacheMiddleware({ ttl: 86400 }),
};

/**
 * Cache warming - pre-populate frequently accessed data
 */
export async function warmCache() {
  console.log('🔥 Warming up cache...');

  try {
    // Example: Cache all tarot cards (they rarely change)
    const { TarotCard } = await import('../models');

    const cards = await TarotCard.find({}).lean();
    const cacheKey = 'cache:GET:/api/cards:all';

    await redis.setex(
      cacheKey,
      86400, // 24 hours
      JSON.stringify({
        statusCode: 200,
        data: {
          success: true,
          data: cards,
        },
      })
    );

    console.log('✅ Cache warmed: Tarot cards loaded');
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  keys: number;
  memory: string;
  hits: string;
  misses: string;
  hitRate: string;
}> {
  try {
    const info = await redis.info('stats');
    const memory = await redis.info('memory');

    // Parse info strings
    const stats: any = {};
    info.split('\r\n').forEach((line: string) => {
      const [key, value] = line.split(':');
      if (key && value) stats[key] = value;
    });

    memory.split('\r\n').forEach((line: string) => {
      const [key, value] = line.split(':');
      if (key && value) stats[key] = value;
    });

    const hits = parseInt(stats.keyspace_hits || '0');
    const misses = parseInt(stats.keyspace_misses || '0');
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : '0';

    const keys = await redis.dbsize();

    return {
      keys,
      memory: stats.used_memory_human || '0',
      hits: hits.toString(),
      misses: misses.toString(),
      hitRate: `${hitRate}%`,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      keys: 0,
      memory: '0',
      hits: '0',
      misses: '0',
      hitRate: '0%',
    };
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    await redis.flushdb();
    console.log('🗑️  All cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Smart cache middleware that adapts TTL based on membership
 */
export function smartCache(options: CacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Adjust TTL based on user membership
    let ttl = options.ttl || 300;

    if (req.user) {
      const membershipType = req.user.membershipType;

      // Premium users get fresher cache (shorter TTL)
      if (membershipType === 'premium') {
        ttl = Math.floor(ttl / 2);
      }
    }

    return cacheMiddleware({ ...options, ttl })(req, res, next);
  };
}
