import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

/**
 * Custom request logger with performance metrics
 */

interface RequestLog {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

// Store logs in memory (in production, send to external service)
const requestLogs: RequestLog[] = [];
const MAX_LOGS = 10000;

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;

    const log: RequestLog = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: duration,
      userId: req.user?.userId,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date(),
    };

    // Add to logs
    requestLogs.push(log);
    if (requestLogs.length > MAX_LOGS) {
      requestLogs.shift(); // Remove oldest
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn(`⚠️  SLOW REQUEST: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }

    // Log errors
    if (res.statusCode >= 400) {
      console.error(`❌ ERROR: ${req.method} ${req.originalUrl} - ${res.statusCode}`);
    }
  });

  next();
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): {
  totalRequests: number;
  avgResponseTime: number;
  slowRequests: number;
  errorRate: number;
  requestsByEndpoint: Record<string, number>;
  requestsByStatus: Record<number, number>;
} {
  if (requestLogs.length === 0) {
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      slowRequests: 0,
      errorRate: 0,
      requestsByEndpoint: {},
      requestsByStatus: {},
    };
  }

  const totalRequests = requestLogs.length;
  const avgResponseTime = requestLogs.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests;
  const slowRequests = requestLogs.filter(log => log.responseTime > 1000).length;
  const errorRequests = requestLogs.filter(log => log.statusCode >= 400).length;
  const errorRate = (errorRequests / totalRequests) * 100;

  // Group by endpoint
  const requestsByEndpoint: Record<string, number> = {};
  const requestsByStatus: Record<number, number> = {};

  requestLogs.forEach(log => {
    // Endpoint stats
    const endpoint = `${log.method} ${log.url.split('?')[0]}`;
    requestsByEndpoint[endpoint] = (requestsByEndpoint[endpoint] || 0) + 1;

    // Status code stats
    requestsByStatus[log.statusCode] = (requestsByStatus[log.statusCode] || 0) + 1;
  });

  return {
    totalRequests,
    avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
    slowRequests,
    errorRate: parseFloat(errorRate.toFixed(2)),
    requestsByEndpoint,
    requestsByStatus,
  };
}

/**
 * Get recent slow requests
 */
export function getSlowRequests(limit: number = 10): RequestLog[] {
  return requestLogs
    .filter(log => log.responseTime > 1000)
    .sort((a, b) => b.responseTime - a.responseTime)
    .slice(0, limit);
}

/**
 * Get recent error requests
 */
export function getErrorRequests(limit: number = 10): RequestLog[] {
  return requestLogs
    .filter(log => log.statusCode >= 400)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get user activity
 */
export function getUserActivity(userId: string): RequestLog[] {
  return requestLogs
    .filter(log => log.userId === userId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Clear logs
 */
export function clearLogs(): void {
  requestLogs.length = 0;
}

/**
 * Morgan logger with custom format
 */
export const morganLogger = morgan((tokens, req, res) => {
  const status = tokens.status(req, res) || '';
  const responseTime = tokens['response-time'](req, res);

  let statusColor = '\x1b[32m'; // green
  if (status.startsWith('4')) statusColor = '\x1b[33m'; // yellow
  if (status.startsWith('5')) statusColor = '\x1b[31m'; // red

  return [
    '\x1b[36m' + tokens.method(req, res) + '\x1b[0m', // cyan method
    tokens.url(req, res),
    statusColor + status + '\x1b[0m',
    responseTime + 'ms',
    '-',
    tokens['remote-addr'](req, res),
  ].join(' ');
});
