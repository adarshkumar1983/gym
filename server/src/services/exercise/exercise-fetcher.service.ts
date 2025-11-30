/**
 * Exercise Fetcher Service
 * Handles fetching exercises from various sources (APIs, repositories)
 */

import { getExerciseImageUrl, getFreeExerciseDbMap } from './exercise-image.service';
import { getFallbackExercises } from './exercise-fallback.service';

/**
 * Fetch exercises directly from free-exercise-db repository
 */
const fetchExercisesFromFreeDb = async (): Promise<any[]> => {
  try {
    console.log('🔄 Fetching exercises from free-exercise-db repository...');
    const exerciseMap = await getFreeExerciseDbMap();
    
    if (exerciseMap.size === 0) {
      console.warn('⚠️ No exercises found in free-exercise-db repository');
      return [];
    }
    
    // Convert map to array and transform to our format
    const exercises = Array.from(exerciseMap.values()).map((exercise: any) => {
      let mediaUrl = null;
      if (exercise.images && exercise.images.length > 0) {
        const imagePath = exercise.images[0];
        mediaUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
      }
      
      return {
        name: exercise.name || '',
        type: exercise.category || exercise.type || '',
        muscle: exercise.primaryMuscles?.[0] || exercise.muscle || '',
        equipment: exercise.equipment || '',
        difficulty: exercise.level || exercise.difficulty || '',
        instructions: Array.isArray(exercise.instructions) 
          ? exercise.instructions.join(' ') 
          : exercise.instructions || '',
        mediaUrl: mediaUrl,
        sets: 3,
        reps: 12,
        restSeconds: 60,
        notes: Array.isArray(exercise.instructions) 
          ? exercise.instructions.join(' ') 
          : exercise.instructions || '',
        source: 'free-exercise-db',
      };
    });
    
    console.log(`✅ Fetched ${exercises.length} exercises from free-exercise-db (all with images)`);
    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercises from free-exercise-db:', error);
    return [];
  }
};

/**
 * Fetch exercises from free ExerciseDB API with media
 */
export const fetchExercisesFromAPI = async (): Promise<any[]> => {
  try {
    // First, try to get exercises from free-exercise-db
    const freeDbExercises = await fetchExercisesFromFreeDb();
    
    if (freeDbExercises.length > 0) {
      console.log(`✅ Using ${freeDbExercises.length} exercises from free-exercise-db with correct names`);
      return freeDbExercises;
    }
    
    // Fallback to api-ninjas if free-exercise-db fails
    console.log('⚠️ free-exercise-db failed, trying api-ninjas...');
    const response = await fetch('https://api.api-ninjas.com/v1/exercises', {
      headers: {
        'X-Api-Key': process.env.EXERCISE_API_KEY || '',
      },
    });

    if (!response.ok) {
      return await getFallbackExercises();
    }

    const data: any = await response.json();
    
    if (!Array.isArray(data)) {
      return await getFallbackExercises();
    }
    
    // Map exercises and try to find images
    const exercisesWithImages = await Promise.all(
      data.map(async (exercise: any) => {
        const exerciseName = exercise.name || '';
        const imageUrl = await getExerciseImageUrl(exerciseName);
        
        return {
          name: exerciseName,
          type: exercise.type || '',
          muscle: exercise.muscle || '',
          equipment: exercise.equipment || '',
          difficulty: exercise.difficulty || '',
          instructions: exercise.instructions || '',
          mediaUrl: imageUrl || null,
          sets: 3,
          reps: 12,
          restSeconds: 60,
          notes: exercise.instructions || '',
          source: 'api',
        };
      })
    );
    
    return exercisesWithImages;
  } catch (error) {
    console.error('Error fetching exercises from API:', error);
    return await getFallbackExercises();
  }
};

