import { useCallback, useEffect, useMemo, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';

/**
 * Performance optimization utilities for React Native
 */

/**
 * Debounce hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for high-frequency events
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Run task after interactions complete
 */
export function useAfterInteractions(callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      callback();
    });

    return () => task.cancel();
  }, deps);
}

/**
 * Memoized callback with deep comparison
 */
export function useDeepCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  const ref = useRef<any>();

  if (!areEqual(ref.current, deps)) {
    ref.current = deps;
  }

  return useCallback(callback, ref.current);
}

/**
 * Deep equality check
 */
function areEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => areEqual(val, b[idx]));
  }
  return false;
}

/**
 * Image optimization helper
 */
export const ImageOptimization = {
  /**
   * Get optimized image size based on device
   */
  getOptimalSize(width: number, height: number): { width: number; height: number } {
    const maxWidth = Platform.select({ ios: 2048, android: 2048, default: 1024 });
    const maxHeight = Platform.select({ ios: 2048, android: 2048, default: 1024 });

    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    const ratio = Math.min(maxWidth / width, maxHeight / height);
    return {
      width: Math.floor(width * ratio),
      height: Math.floor(height * ratio),
    };
  },

  /**
   * Generate thumbnail size
   */
  getThumbnailSize(width: number, height: number, maxSize: number = 200) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    return {
      width: Math.floor(width * ratio),
      height: Math.floor(height * ratio),
    };
  },
};

/**
 * List optimization helpers
 */
export const ListOptimization = {
  /**
   * Get optimal window size for FlatList
   */
  getWindowSize: () => Platform.select({ ios: 10, android: 10, default: 10 }),

  /**
   * Get max to render per batch
   */
  getMaxToRenderPerBatch: () => Platform.select({ ios: 10, android: 5, default: 5 }),

  /**
   * Get initial number to render
   */
  getInitialNumToRender: () => Platform.select({ ios: 10, android: 10, default: 10 }),

  /**
   * Default FlatList optimization props
   */
  defaultProps: {
    windowSize: Platform.select({ ios: 10, android: 10, default: 10 }),
    maxToRenderPerBatch: Platform.select({ ios: 10, android: 5, default: 5 }),
    initialNumToRender: Platform.select({ ios: 10, android: 10, default: 10 }),
    removeClippedSubviews: Platform.OS === 'android',
    updateCellsBatchingPeriod: 50,
  },
};

/**
 * Animation performance helpers
 */
export const AnimationOptimization = {
  /**
   * Get optimal animation duration based on device
   */
  getDuration: (baseDuration: number) => {
    return Platform.select({
      ios: baseDuration,
      android: Math.floor(baseDuration * 0.8), // Slightly faster on Android
      default: baseDuration,
    });
  },

  /**
   * Check if animation should be enabled
   */
  shouldAnimate: () => {
    // Can be extended to check device performance
    return true;
  },
};

/**
 * Memory management helpers
 */
export const MemoryOptimization = {
  /**
   * Clear caches periodically
   */
  setupPeriodicCleanup: (intervalMs: number = 300000) => {
    return setInterval(() => {
      console.log('🧹 Running periodic memory cleanup...');
      // Add cleanup logic here
    }, intervalMs);
  },

  /**
   * Get memory warning handler
   */
  onMemoryWarning: (callback: () => void) => {
    if (Platform.OS === 'android') {
      // Android memory warning handling
      const DeviceEventEmitter = require('react-native').DeviceEventEmitter;
      return DeviceEventEmitter.addListener('memoryWarning', callback);
    }
    return null;
  },
};

/**
 * Performance measurement
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();

  mark(name: string) {
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark: string) {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Mark "${startMark}" not found`);
      return;
    }

    const duration = Date.now() - start;
    const existing = this.measures.get(name) || [];
    existing.push(duration);
    this.measures.set(name, existing);

    console.log(`⏱️  ${name}: ${duration}ms`);
  }

  getStats(name: string) {
    const measurements = this.measures.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length };
  }

  clear() {
    this.marks.clear();
    this.measures.clear();
  }

  report() {
    console.log('\n📊 Performance Report:');
    this.measures.forEach((_, name) => {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`  ${name}:`);
        console.log(`    Avg: ${stats.avg.toFixed(2)}ms`);
        console.log(`    Min: ${stats.min}ms`);
        console.log(`    Max: ${stats.max}ms`);
        console.log(`    Count: ${stats.count}`);
      }
    });
    console.log();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Component render tracking
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current > 10) {
      console.warn(`⚠️  ${componentName} rendered ${renderCount.current} times - consider optimization`);
    }
  });

  if (__DEV__) {
    return renderCount.current;
  }

  return 0;
}

/**
 * Heavy computation with memoization
 */
export function useMemoizedComputation<T>(
  computation: () => T,
  deps: any[],
  debugName?: string
): T {
  return useMemo(() => {
    if (debugName && __DEV__) {
      const start = Date.now();
      const result = computation();
      const duration = Date.now() - start;
      if (duration > 16) {
        console.warn(`⚠️  Slow computation in ${debugName}: ${duration}ms`);
      }
      return result;
    }
    return computation();
  }, deps);
}

/**
 * Bundle size optimization - lazy load components
 */
export function lazyLoad<T>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: any
): React.LazyExoticComponent<React.ComponentType<any>> {
  return React.lazy(() => importFunc());
}

// Re-export React for the hooks
import React from 'react';
