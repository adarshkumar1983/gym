/**
 * Nutrition Cache Service
 * Handles caching for nutrition API responses
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const foodCache = new Map<string, CacheEntry>();

export const getCachedFood = (key: string): any | null => {
  const cached = foodCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  foodCache.delete(key);
  return null;
};

export const setCachedFood = (key: string, data: any): void => {
  foodCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const clearFoodCache = (): void => {
  foodCache.clear();
};

