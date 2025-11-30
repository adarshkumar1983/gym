/**
 * Exercise Cache Service
 * Manages caching for exercise data
 */

// Cache for exercises (refresh every hour)
let exerciseCache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Cache for free-exercise-db repository data
let freeExerciseDbCache: {
  exercises: Map<string, any>;
  timestamp: number;
} | null = null;

const FREE_EXERCISE_DB_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const exerciseCacheService = {
  getExerciseCache: () => exerciseCache,
  
  setExerciseCache: (data: any[]) => {
    exerciseCache = {
      data,
      timestamp: Date.now(),
    };
  },
  
  clearExerciseCache: () => {
    exerciseCache = null;
  },
  
  isExerciseCacheValid: (): boolean => {
    if (!exerciseCache) return false;
    const now = Date.now();
    return now - exerciseCache.timestamp < CACHE_DURATION;
  },
  
  getFreeExerciseDbCache: () => freeExerciseDbCache,
  
  setFreeExerciseDbCache: (exercises: Map<string, any>) => {
    freeExerciseDbCache = {
      exercises,
      timestamp: Date.now(),
    };
  },
  
  clearFreeExerciseDbCache: () => {
    freeExerciseDbCache = null;
  },
  
  isFreeExerciseDbCacheValid: (): boolean => {
    if (!freeExerciseDbCache) return false;
    const now = Date.now();
    return now - freeExerciseDbCache.timestamp < FREE_EXERCISE_DB_CACHE_DURATION;
  },
  
  clearAllCaches: () => {
    exerciseCache = null;
    freeExerciseDbCache = null;
  },
};

