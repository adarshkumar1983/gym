/**
 * Exercise Controller
 * Handles exercise-related HTTP requests and responses
 */

import { Request, Response } from 'express';
import {
  exerciseCacheService,
  fetchExercisesFromAPI,
  getExercisesFromDatabase,
  mergeExercises,
  filterExercises,
  limitExercises,
  getExerciseByNameFromDatabase,
} from '../services/exercise';

/**
 * Get all exercises (from API + database)
 */
export const getAllExercises = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { gymId, search } = req.query;

    // Get exercises from API cache or fetch fresh
    let apiExercises: any[] = [];
    const cache = exerciseCacheService.getExerciseCache();
    
    if (cache && exerciseCacheService.isExerciseCacheValid()) {
      // Use cached data for fast response
      apiExercises = cache.data;
      console.log(`📦 Using cached exercises (${apiExercises.length} exercises)`);
    } else {
      // Fetch fresh data only if cache is expired or doesn't exist
      console.log('🔄 Fetching fresh exercises with images...');
      apiExercises = await fetchExercisesFromAPI();
      exerciseCacheService.setExerciseCache(apiExercises);
      
      // Verify images were loaded
      const exercisesWithImages = apiExercises.filter(e => e.mediaUrl).length;
      console.log(`✅ Cached ${apiExercises.length} exercises (${exercisesWithImages} with images)`);
      
      if (apiExercises.length > 0) {
        console.log(`📸 Sample exercise:`, {
          name: apiExercises[0]?.name,
          hasMediaUrl: !!apiExercises[0]?.mediaUrl,
          mediaUrl: apiExercises[0]?.mediaUrl
        });
      }
    }

    // Get exercises from database
    const dbExercises = await getExercisesFromDatabase(gymId as string | undefined);

    // Merge and deduplicate exercises
    let exercises = mergeExercises(apiExercises, dbExercises);
    
    // Limit to top 200 exercises for faster initial load (unless searching)
    const searchStr = typeof search === 'string' ? search : '';
    const shouldLimit = !searchStr || searchStr.trim() === '';
    
    let result;
    if (shouldLimit) {
      result = limitExercises(exercises, 200);
      exercises = result.exercises;
      if (result.hasMore) {
        console.log(`⚡ Limited to 200 exercises for faster loading (${result.total} total available)`);
      }
    } else {
      result = { exercises, total: exercises.length, hasMore: false };
    }
    
    // Log sample exercises
    if (exercises.length > 0) {
      console.log(`📊 Returning ${exercises.length} exercises (${result.total} total)`);
      console.log(`📸 Sample exercise with mediaUrl:`, {
        name: exercises[0].name,
        hasMediaUrl: !!exercises[0].mediaUrl,
        mediaUrl: exercises[0].mediaUrl
      });
    }

    // Apply search filter if provided
    if (searchStr && searchStr.trim() !== '') {
      exercises = filterExercises(exercises, searchStr);
    }

    return res.json({
      success: true,
      data: {
        exercises,
        total: result.total,
        returned: exercises.length,
        hasMore: result.hasMore,
        sources: {
          api: apiExercises.length,
          database: dbExercises.length,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * Get exercise details by name
 */
export const getExerciseByName = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name } = req.params;
    const { gymId } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Exercise name is required' },
      });
    }

    const exerciseNameLower = name.toLowerCase().trim();

    // Get exercises from API cache or fetch fresh
    let apiExercises: any[] = [];
    const cache = exerciseCacheService.getExerciseCache();
    
    if (!cache || !exerciseCacheService.isExerciseCacheValid()) {
      apiExercises = await fetchExercisesFromAPI();
      exerciseCacheService.setExerciseCache(apiExercises);
    } else {
      apiExercises = cache.data;
    }

    // Find exercise in API data
    let exercise = apiExercises.find(
      (e) => e.name.toLowerCase().trim() === exerciseNameLower
    );

    // Also check database
    const dbExercise = await getExerciseByNameFromDatabase(name, gymId as string | undefined);

    if (dbExercise) {
      // Merge database exercise with API exercise
      exercise = {
        ...exercise,
        name: dbExercise.name,
        sets: dbExercise.sets || exercise?.sets || 3,
        reps: dbExercise.reps || exercise?.reps || 12,
        restSeconds: dbExercise.restSeconds || exercise?.restSeconds || 60,
        mediaUrl: dbExercise.mediaUrl || exercise?.mediaUrl,
        notes: dbExercise.notes || exercise?.notes || exercise?.instructions,
        workoutCount: dbExercise.workoutCount,
        usedInWorkouts: dbExercise.usedInWorkouts,
        source: 'database',
      };
    } else if (exercise) {
      // Use API exercise with defaults
      exercise = {
        ...exercise,
        sets: exercise.sets || 3,
        reps: exercise.reps || 12,
        restSeconds: exercise.restSeconds || 60,
        workoutCount: 0,
        source: exercise.source || 'api',
      };
    }

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: { message: 'Exercise not found' },
      });
    }

    return res.json({
      success: true,
      data: {
        exercise,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
};
