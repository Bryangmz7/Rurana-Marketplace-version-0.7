
import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
  strategy?: 'lru' | 'lfu' | 'ttl';
}

interface IntelligentCache<T> {
  get: (key: string) => T | null;
  set: (key: string, data: T, ttl?: number) => void;
  delete: (key: string) => boolean;
  clear: () => void;
  getStats: () => {
    size: number;
    hitRate: number;
    totalRequests: number;
    totalHits: number;
  };
}

export const useIntelligentCache = <T,>(
  options: CacheOptions = {}
): IntelligentCache<T> => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    maxSize = 100,
    strategy = 'lru'
  } = options;

  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalHits: 0
  });

  const updateStats = useCallback((hit: boolean) => {
    setStats(prev => ({
      totalRequests: prev.totalRequests + 1,
      totalHits: prev.totalHits + (hit ? 1 : 0)
    }));
  }, []);

  const isExpired = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp > entry.ttl;
  }, []);

  const evictExpired = useCallback(() => {
    setCache(prev => {
      const newCache = new Map(prev);
      for (const [key, entry] of newCache) {
        if (isExpired(entry)) {
          newCache.delete(key);
        }
      }
      return newCache;
    });
  }, [isExpired]);

  const evictByStrategy = useCallback(() => {
    setCache(prev => {
      if (prev.size <= maxSize) return prev;

      const entries = Array.from(prev.entries());
      let keyToEvict: string;

      switch (strategy) {
        case 'lru':
          keyToEvict = entries.reduce((oldest, [key, entry]) => {
            const [oldestKey, oldestEntry] = oldest;
            return entry.lastAccessed < oldestEntry.lastAccessed ? [key, entry] : oldest;
          })[0];
          break;

        case 'lfu':
          keyToEvict = entries.reduce((leastUsed, [key, entry]) => {
            const [leastKey, leastEntry] = leastUsed;
            return entry.accessCount < leastEntry.accessCount ? [key, entry] : leastUsed;
          })[0];
          break;

        case 'ttl':
          keyToEvict = entries.reduce((oldest, [key, entry]) => {
            const [oldestKey, oldestEntry] = oldest;
            return entry.timestamp < oldestEntry.timestamp ? [key, entry] : oldest;
          })[0];
          break;

        default:
          keyToEvict = entries[0][0];
      }

      const newCache = new Map(prev);
      newCache.delete(keyToEvict);
      return newCache;
    });
  }, [maxSize, strategy]);

  const get = useCallback((key: string): T | null => {
    const entry = cache.get(key);
    
    if (!entry) {
      updateStats(false);
      return null;
    }

    if (isExpired(entry)) {
      cache.delete(key);
      updateStats(false);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    cache.set(key, entry);

    updateStats(true);
    return entry.data;
  }, [cache, isExpired, updateStats]);

  const set = useCallback((key: string, data: T, customTtl?: number): void => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: customTtl || ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, entry);
      return newCache;
    });

    // Evict if necessary
    if (cache.size >= maxSize) {
      evictByStrategy();
    }
  }, [ttl, cache.size, maxSize, evictByStrategy]);

  const deleteKey = useCallback((key: string): boolean => {
    const existed = cache.has(key);
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
    return existed;
  }, [cache]);

  const clear = useCallback(() => {
    setCache(new Map());
    setStats({ totalRequests: 0, totalHits: 0 });
  }, []);

  const getStats = useCallback(() => ({
    size: cache.size,
    hitRate: stats.totalRequests > 0 ? stats.totalHits / stats.totalRequests : 0,
    totalRequests: stats.totalRequests,
    totalHits: stats.totalHits
  }), [cache.size, stats]);

  // Cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(evictExpired, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [evictExpired]);

  return {
    get,
    set,
    delete: deleteKey,
    clear,
    getStats
  };
};
