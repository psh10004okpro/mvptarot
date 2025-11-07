import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getPerformanceStats, getSlowRequests, getErrorRequests } from '../middleware/requestLogger';
import { getCacheStats } from '../middleware/cache';
import mongoose from 'mongoose';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
  });
});

/**
 * System status endpoint (requires authentication)
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    // Database connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const formatMemory = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    // CPU usage (approximate)
    const cpuUsage = process.cpuUsage();

    res.json({
      success: true,
      data: {
        status: 'operational',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(process.uptime()),
          formatted: formatUptime(process.uptime()),
        },
        database: {
          status: dbStatus,
          name: mongoose.connection.name,
        },
        memory: {
          rss: formatMemory(memoryUsage.rss),
          heapTotal: formatMemory(memoryUsage.heapTotal),
          heapUsed: formatMemory(memoryUsage.heapUsed),
          external: formatMemory(memoryUsage.external),
        },
        cpu: {
          user: `${(cpuUsage.user / 1000000).toFixed(2)}s`,
          system: `${(cpuUsage.system / 1000000).toFixed(2)}s`,
        },
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
    });
  }
});

/**
 * Performance metrics endpoint
 */
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const performanceStats = getPerformanceStats();
    const cacheStats = await getCacheStats();

    res.json({
      success: true,
      data: {
        requests: performanceStats,
        cache: cacheStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics',
    });
  }
});

/**
 * Slow requests endpoint
 */
router.get('/slow-requests', authenticateToken, (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const slowRequests = getSlowRequests(limit);

    res.json({
      success: true,
      data: slowRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get slow requests',
    });
  }
});

/**
 * Error requests endpoint
 */
router.get('/errors', authenticateToken, (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const errorRequests = getErrorRequests(limit);

    res.json({
      success: true,
      data: errorRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get error requests',
    });
  }
});

/**
 * Database metrics endpoint
 */
router.get('/database', authenticateToken, async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();

    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        const stats = await mongoose.connection.db
          .collection(collection.name)
          .stats();

        return {
          name: collection.name,
          count: stats.count,
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          avgObjSize: `${stats.avgObjSize} bytes`,
          indexes: stats.nindexes,
          indexSize: `${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`,
        };
      })
    );

    res.json({
      success: true,
      data: {
        collections: collectionStats,
        totalCollections: collections.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get database metrics',
    });
  }
});

/**
 * Cache statistics endpoint
 */
router.get('/cache', authenticateToken, async (req, res) => {
  try {
    const stats = await getCacheStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics',
    });
  }
});

/**
 * Consolidated monitoring dashboard data
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const performanceStats = getPerformanceStats();
    const cacheStats = await getCacheStats();
    const slowRequests = getSlowRequests(5);
    const errorRequests = getErrorRequests(5);

    const memoryUsage = process.memoryUsage();
    const formatMemory = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    res.json({
      success: true,
      data: {
        system: {
          status: 'operational',
          uptime: formatUptime(process.uptime()),
          memory: {
            used: formatMemory(memoryUsage.heapUsed),
            total: formatMemory(memoryUsage.heapTotal),
            percentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2) + '%',
          },
          database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        },
        performance: {
          requests: performanceStats,
          cache: cacheStats,
        },
        issues: {
          slowRequests: slowRequests.length,
          errors: errorRequests.length,
          recentSlow: slowRequests.slice(0, 3),
          recentErrors: errorRequests.slice(0, 3),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
    });
  }
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export default router;
