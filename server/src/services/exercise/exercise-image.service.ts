/**
 * Exercise Image Service
 * Handles fetching and matching exercise images from free-exercise-db repository
 */

import { exerciseCacheService } from './exercise-cache.service';

/**
 * Fetch exercises from free-exercise-db repository and cache them
 */
const fetchFreeExerciseDb = async (): Promise<Map<string, any>> => {
  const cache = exerciseCacheService.getFreeExerciseDbCache();
  
  // Return cached data if available and not expired
  if (cache && exerciseCacheService.isFreeExerciseDbCacheValid()) {
    console.log(`📦 Using cached free-exercise-db (${cache.exercises.size} exercises)`);
    return cache.exercises;
  }
  
  try {
    console.log('🔄 Fetching exercises from free-exercise-db repository...');
    const response = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch free-exercise-db: ${response.status} ${response.statusText}`);
      return new Map();
    }
    
    const exercises: any = await response.json();
    if (!Array.isArray(exercises)) {
      console.error('❌ free-exercise-db response is not an array');
      return new Map();
    }
    
    console.log(`📥 Fetched ${exercises.length} exercises from repository`);
    
    // Create a map for quick lookup by exercise name (case-insensitive)
    const exerciseMap = new Map<string, any>();
    
    exercises.forEach((exercise) => {
      if (exercise.name && exercise.images && exercise.images.length > 0) {
        const key = exercise.name.toLowerCase().trim();
        exerciseMap.set(key, exercise);
      }
    });
    
    // Cache the result
    exerciseCacheService.setFreeExerciseDbCache(exerciseMap);
    
    console.log(`✅ Loaded ${exerciseMap.size} exercises with images from free-exercise-db repository`);
    return exerciseMap;
  } catch (error) {
    console.error('❌ Error fetching free-exercise-db:', error);
    return new Map();
  }
};

/**
 * Get exercise image URL from free-exercise-db GitHub repository
 */
export const getExerciseImageUrl = async (exerciseName: string): Promise<string | null> => {
  try {
    const exerciseMap = await fetchFreeExerciseDb();
    
    if (exerciseMap.size === 0) {
      console.warn('⚠️ Exercise map is empty, cannot find images');
      return null;
    }
    
    const lowerName = exerciseName.toLowerCase().trim();
    const searchWords = lowerName.split(/\s+/).filter(w => w.length > 2);
    
    // Try exact match
    let exercise = exerciseMap.get(lowerName);
    
    if (exercise && exercise.images && exercise.images.length > 0) {
      const imagePath = exercise.images[0];
      return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
    }
    
    // Try smart partial matching
    let bestMatch = null;
    let bestMatchScore = 0;
    
    for (const [key, ex] of exerciseMap.entries()) {
      if (!ex.images || ex.images.length === 0) continue;
      
      let matchCount = 0;
      for (const word of searchWords) {
        if (key.includes(word)) matchCount++;
      }
      
      if (matchCount === searchWords.length && matchCount > bestMatchScore) {
        bestMatch = ex;
        bestMatchScore = matchCount;
      }
    }
    
    if (bestMatch && bestMatch.images && bestMatch.images.length > 0) {
      const imagePath = bestMatch.images[0];
      return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
    }
    
    // Fallback: simple substring match
    for (const [key, ex] of exerciseMap.entries()) {
      if (ex.images && ex.images.length > 0 && key.includes(lowerName)) {
        const imagePath = ex.images[0];
        return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error getting exercise image URL for "${exerciseName}":`, error);
    return null;
  }
};

/**
 * Get the free-exercise-db exercise map (for use by other services)
 */
export const getFreeExerciseDbMap = async (): Promise<Map<string, any>> => {
  return await fetchFreeExerciseDb();
};

