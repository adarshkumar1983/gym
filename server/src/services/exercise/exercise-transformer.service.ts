/**
 * Exercise Transformer Service
 * Handles data transformation and merging of exercises from different sources
 */

import { WorkoutTemplate } from '../../models/WorkoutTemplate.model';

/**
 * Get exercises from database (workout templates)
 */
export const getExercisesFromDatabase = async (gymId?: string): Promise<any[]> => {
  const dbExercises: any[] = [];
  
  try {
    const query: any = { isActive: true };
    if (gymId) {
      query.gymId = gymId;
    }

    const workouts = await WorkoutTemplate.find(query).select('exercises');
    const exerciseMap = new Map<string, any>();

    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        const exerciseName = exercise.name.toLowerCase().trim();
        
        if (!exerciseMap.has(exerciseName)) {
          exerciseMap.set(exerciseName, {
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            restSeconds: exercise.restSeconds,
            mediaUrl: exercise.mediaUrl,
            notes: exercise.notes,
            workoutCount: 1,
            source: 'database',
          });
        } else {
          const existing = exerciseMap.get(exerciseName);
          existing.workoutCount += 1;
          if (exercise.mediaUrl && !existing.mediaUrl) {
            existing.mediaUrl = exercise.mediaUrl;
          }
          if (exercise.notes && !existing.notes) {
            existing.notes = exercise.notes;
          }
        }
      });
    });

    dbExercises.push(...Array.from(exerciseMap.values()));
  } catch (dbError) {
    console.error('Error fetching exercises from database:', dbError);
  }
  
  return dbExercises;
};

/**
 * Merge and deduplicate exercises from API and database
 */
export const mergeExercises = (apiExercises: any[], dbExercises: any[]): any[] => {
  const exerciseMap = new Map<string, any>();
  
  // Add API exercises first
  apiExercises.forEach((exercise) => {
    const key = exercise.name.toLowerCase().trim();
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, exercise);
    }
  });

  // Add database exercises (will override API if same name)
  dbExercises.forEach((exercise) => {
    const key = exercise.name.toLowerCase().trim();
    exerciseMap.set(key, exercise);
  });

  // Convert to array and sort
  return Array.from(exerciseMap.values()).sort((a, b) => {
    // Prioritize exercises with images and from database
    if (a.mediaUrl && !b.mediaUrl) return -1;
    if (!a.mediaUrl && b.mediaUrl) return 1;
    if (a.source === 'database' && b.source !== 'database') return -1;
    if (a.source !== 'database' && b.source === 'database') return 1;
    return a.name.localeCompare(b.name);
  });
};

/**
 * Apply search filter to exercises
 */
export const filterExercises = (exercises: any[], search: string): any[] => {
  if (!search || search.trim() === '') {
    return exercises;
  }
  
  const searchLower = search.toLowerCase();
  return exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchLower) ||
    (exercise.notes && exercise.notes.toLowerCase().includes(searchLower)) ||
    (exercise.muscle && exercise.muscle.toLowerCase().includes(searchLower)) ||
    (exercise.type && exercise.type.toLowerCase().includes(searchLower))
  );
};

/**
 * Limit exercises for faster initial load
 */
export const limitExercises = (exercises: any[], limit: number = 200): { exercises: any[], total: number, hasMore: boolean } => {
  const total = exercises.length;
  const limited = exercises.length > limit ? exercises.slice(0, limit) : exercises;
  const hasMore = exercises.length > limit;
  
  return {
    exercises: limited,
    total,
    hasMore,
  };
};

/**
 * Get exercise by name from database
 */
export const getExerciseByNameFromDatabase = async (name: string, gymId?: string): Promise<any | null> => {
  try {
    const query: any = { isActive: true };
    if (gymId) {
      query.gymId = gymId;
    }

    const workouts = await WorkoutTemplate.find(query).select('exercises name');
    const exerciseNameLower = name.toLowerCase().trim();
    const dbExerciseData: any[] = [];

    workouts.forEach((workout) => {
      workout.exercises.forEach((ex) => {
        if (ex.name.toLowerCase().trim() === exerciseNameLower) {
          dbExerciseData.push({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            mediaUrl: ex.mediaUrl,
            notes: ex.notes,
            workoutName: workout.name,
          });
        }
      });
    });

    if (dbExerciseData.length > 0) {
      const dbExercise = dbExerciseData[0];
      return {
        name: dbExercise.name,
        sets: dbExercise.sets,
        reps: dbExercise.reps,
        restSeconds: dbExercise.restSeconds,
        mediaUrl: dbExercise.mediaUrl,
        notes: dbExercise.notes,
        workoutCount: dbExerciseData.length,
        usedInWorkouts: dbExerciseData.map((e) => e.workoutName),
        source: 'database',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching exercise from database:', error);
    return null;
  }
};

