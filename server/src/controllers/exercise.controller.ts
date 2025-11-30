import { Request, Response } from 'express';
import { WorkoutTemplate } from '../models/WorkoutTemplate.model';

/**
 * Exercise Controller
 * Handles all exercise-related business logic
 * Uses free ExerciseDB API (api.api-ninjas.com) for exercise data
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

/**
 * Get exercise GIF URL from free-exercise-db GitHub repository
 * Repository: https://github.com/yuhonas/free-exercise-db
 * Website: https://yuhonas.github.io/free-exercise-db/
 * Format: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/gifs/{exercise-name}.gif
 */
/**
 * Fetch exercises from free-exercise-db repository and cache them
 * Repository: https://github.com/yuhonas/free-exercise-db
 */
const fetchFreeExerciseDb = async (): Promise<Map<string, any>> => {
  const now = Date.now();
  
  // Return cached data if available and not expired
  if (freeExerciseDbCache && now - freeExerciseDbCache.timestamp < FREE_EXERCISE_DB_CACHE_DURATION) {
    console.log(`📦 Using cached free-exercise-db (${freeExerciseDbCache.exercises.size} exercises)`);
    return freeExerciseDbCache.exercises;
  }
  
  try {
    console.log('🔄 Fetching exercises from free-exercise-db repository...');
    // Fetch the combined exercises.json from the repository
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
        // Use lowercase name as key for case-insensitive matching
        const key = exercise.name.toLowerCase().trim();
        exerciseMap.set(key, exercise);
      }
    });
    
    // Cache the result
    freeExerciseDbCache = {
      exercises: exerciseMap,
      timestamp: now,
    };
    
    console.log(`✅ Loaded ${exerciseMap.size} exercises with images from free-exercise-db repository`);
    return exerciseMap;
  } catch (error) {
    console.error('❌ Error fetching free-exercise-db:', error);
    return new Map();
  }
};

/**
 * Get exercise image URL from free-exercise-db GitHub repository
 * Repository: https://github.com/yuhonas/free-exercise-db
 * Format: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{Exercise_ID}/0.jpg
 */
const getExerciseGifUrl = async (exerciseName: string): Promise<string | null> => {
  try {
    // Fetch the exercise database
    const exerciseMap = await fetchFreeExerciseDb();
    
    if (exerciseMap.size === 0) {
      console.warn('⚠️ Exercise map is empty, cannot find images');
      return null;
    }
    
    // Normalize the search name
    const lowerName = exerciseName.toLowerCase().trim();
    const searchWords = lowerName.split(/\s+/).filter(w => w.length > 2); // Filter out short words
    
    // Try to find exercise by exact name match (case-insensitive)
    let exercise = exerciseMap.get(lowerName);
    
    if (exercise && exercise.images && exercise.images.length > 0) {
      const imagePath = exercise.images[0];
      const imageUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
      return imageUrl;
    }
    
    // If no exact match, try smart partial matching
    // Look for exercises where all significant words from our name appear in the repository name
    let bestMatch = null;
    let bestMatchScore = 0;
    
    for (const [key, ex] of exerciseMap.entries()) {
      if (!ex.images || ex.images.length === 0) continue;
      
      // Count how many search words match
      let matchCount = 0;
      for (const word of searchWords) {
        if (key.includes(word)) {
          matchCount++;
        }
      }
      
      // If all significant words match, this is a good candidate
      if (matchCount === searchWords.length && matchCount > bestMatchScore) {
        bestMatch = ex;
        bestMatchScore = matchCount;
      }
    }
    
    if (bestMatch && bestMatch.images && bestMatch.images.length > 0) {
      const imagePath = bestMatch.images[0];
      const imageUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
      return imageUrl;
    }
    
    // Fallback: simple substring match
    for (const [key, ex] of exerciseMap.entries()) {
      if (ex.images && ex.images.length > 0) {
        // Check if key contains the exercise name (e.g., "bench press" in "barbell bench press - medium grip")
        if (key.includes(lowerName)) {
          const imagePath = ex.images[0];
          return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error getting exercise image URL for "${exerciseName}":`, error);
    return null;
  }
};

/**
 * Fetch exercises directly from free-exercise-db repository
 * This ensures we get exercises with correct names that match the repository images
 */
const fetchExercisesFromFreeDb = async (): Promise<any[]> => {
  try {
    console.log('🔄 Fetching exercises from free-exercise-db repository...');
    const exerciseMap = await fetchFreeExerciseDb();
    
    if (exerciseMap.size === 0) {
      console.warn('⚠️ No exercises found in free-exercise-db repository');
      return [];
    }
    
    // Convert map to array and transform to our format
    // Use the repository's actual names so images match perfectly
    const exercises = Array.from(exerciseMap.values()).map((exercise: any) => {
      // Build image URL from the images array (guaranteed to work)
      let mediaUrl = null;
      if (exercise.images && exercise.images.length > 0) {
        const imagePath = exercise.images[0];
        mediaUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
      }
      
      return {
        name: exercise.name || '', // Use repository's exact name
        type: exercise.category || exercise.type || '',
        muscle: exercise.primaryMuscles?.[0] || exercise.muscle || '',
        equipment: exercise.equipment || '',
        difficulty: exercise.level || exercise.difficulty || '',
        instructions: Array.isArray(exercise.instructions) 
          ? exercise.instructions.join(' ') 
          : exercise.instructions || '',
        // Add media URL (guaranteed to work since it's from the repository)
        mediaUrl: mediaUrl,
        // Default values for our app
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
const fetchExercisesFromAPI = async (): Promise<any[]> => {
  try {
    // First, try to get exercises from free-exercise-db (they have images with correct names)
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
        const imageUrl = await getExerciseGifUrl(exerciseName);
        
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

/**
 * Fallback exercises list (common exercises)
 */
const getFallbackExercises = async (): Promise<any[]> => {
  const exercises = [
    { name: 'Push-ups', type: 'strength', muscle: 'chest', equipment: 'body weight', sets: 3, reps: 15, restSeconds: 60, notes: 'Keep your body straight and lower until chest nearly touches floor', source: 'fallback' },
    { name: 'Pull-ups', type: 'strength', muscle: 'back', equipment: 'pull-up bar', sets: 3, reps: 10, restSeconds: 90, notes: 'Pull your body up until chin is above the bar', source: 'fallback' },
    { name: 'Squats', type: 'strength', muscle: 'quadriceps', equipment: 'body weight', sets: 3, reps: 20, restSeconds: 60, notes: 'Lower your body by bending knees, keep back straight', source: 'fallback' },
    { name: 'Deadlifts', type: 'strength', muscle: 'hamstrings', equipment: 'barbell', sets: 3, reps: 8, restSeconds: 120, notes: 'Lift with proper form, keep back straight', source: 'fallback' },
    { name: 'Bench Press', type: 'strength', muscle: 'chest', equipment: 'barbell', sets: 3, reps: 10, restSeconds: 90, notes: 'Lower bar to chest, press up explosively', source: 'fallback' },
    { name: 'Shoulder Press', type: 'strength', muscle: 'shoulders', equipment: 'dumbbell', sets: 3, reps: 12, restSeconds: 60, notes: 'Press weights overhead, keep core engaged', source: 'fallback' },
    { name: 'Bicep Curls', type: 'strength', muscle: 'biceps', equipment: 'dumbbell', sets: 3, reps: 12, restSeconds: 45, notes: 'Curl weights up, control the descent', source: 'fallback' },
    { name: 'Tricep Dips', type: 'strength', muscle: 'triceps', equipment: 'body weight', sets: 3, reps: 12, restSeconds: 60, notes: 'Lower body by bending arms, push back up', source: 'fallback' },
    { name: 'Plank', type: 'strength', muscle: 'core', equipment: 'body weight', sets: 3, reps: 1, restSeconds: 60, notes: 'Hold position for 60 seconds, keep body straight', source: 'fallback' },
    { name: 'Lunges', type: 'strength', muscle: 'quadriceps', equipment: 'body weight', sets: 3, reps: 12, restSeconds: 60, notes: 'Step forward into lunge position, alternate legs', source: 'fallback' },
    { name: 'Crunches', type: 'strength', muscle: 'abs', equipment: 'body weight', sets: 3, reps: 20, restSeconds: 45, notes: 'Lift shoulders off ground, contract abs', source: 'fallback' },
    { name: 'Leg Press', type: 'strength', muscle: 'quadriceps', equipment: 'machine', sets: 3, reps: 15, restSeconds: 90, notes: 'Press weight with legs, full range of motion', source: 'fallback' },
    { name: 'Lat Pulldown', type: 'strength', muscle: 'back', equipment: 'cable machine', sets: 3, reps: 12, restSeconds: 60, notes: 'Pull bar to chest, control the return', source: 'fallback' },
    { name: 'Chest Fly', type: 'strength', muscle: 'chest', equipment: 'dumbbell', sets: 3, reps: 12, restSeconds: 60, notes: 'Open arms wide, bring weights together', source: 'fallback' },
    { name: 'Leg Curls', type: 'strength', muscle: 'hamstrings', equipment: 'machine', sets: 3, reps: 12, restSeconds: 60, notes: 'Curl legs up, squeeze hamstrings', source: 'fallback' },
  ];
  
  // Try to find matching exercises from free-exercise-db repository
  const exerciseMap = await fetchFreeExerciseDb();
  
  // Add image URLs to each exercise by finding matches in repository
  const exercisesWithImages = await Promise.all(
    exercises.map(async (exercise) => {
      const lowerName = exercise.name.toLowerCase().trim();
      const searchWords = lowerName.split(/\s+/).filter(w => w.length > 2);
      
      // Try to find match in repository
      let matchedExercise = exerciseMap.get(lowerName);
      
      if (!matchedExercise) {
        // Try smart matching
        for (const [key, ex] of exerciseMap.entries()) {
          let matchCount = 0;
          for (const word of searchWords) {
            if (key.includes(word)) matchCount++;
          }
          if (matchCount === searchWords.length && ex.images && ex.images.length > 0) {
            matchedExercise = ex;
            break;
          }
        }
      }
      
      // If found, use the repository's image
      let mediaUrl = null;
      if (matchedExercise && matchedExercise.images && matchedExercise.images.length > 0) {
        const imagePath = matchedExercise.images[0];
        mediaUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
        console.log(`✅ Found image for "${exercise.name}" -> "${matchedExercise.name}"`);
      } else {
        console.log(`❌ No image found for "${exercise.name}"`);
      }
      
      return {
        ...exercise,
        mediaUrl: mediaUrl,
      };
    })
  );
  
  const withImages = exercisesWithImages.filter(e => e.mediaUrl).length;
  console.log(`✅ Processed ${exercisesWithImages.length} fallback exercises (${withImages} with images)`);
  return exercisesWithImages;
};

/**
 * Get all exercises (from API + database)
 * @param req Express request object
 * @param res Express response object
 */
export const getAllExercises = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { gymId, search } = req.query;

    // Get exercises from API (with caching)
    let apiExercises: any[] = [];
    const now = Date.now();
    
    // Always fetch fresh data to ensure images are loaded
    // Clear cache to force refresh
    exerciseCache = null;
    freeExerciseDbCache = null;
    
    console.log('🔄 Fetching fresh exercises with images (cache cleared)...');
    apiExercises = await fetchExercisesFromAPI();
    exerciseCache = {
      data: apiExercises,
      timestamp: now,
    };
    
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

    // Also get exercises from database (workout templates)
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
      // Continue with API exercises only
    }

    // Combine and deduplicate exercises (prefer database entries)
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
    let exercises = Array.from(exerciseMap.values()).sort((a, b) => {
      // Prioritize exercises with images and from database
      if (a.mediaUrl && !b.mediaUrl) return -1;
      if (!a.mediaUrl && b.mediaUrl) return 1;
      if (a.source === 'database' && b.source !== 'database') return -1;
      if (a.source !== 'database' && b.source === 'database') return 1;
      return a.name.localeCompare(b.name);
    });
    
    // Limit to top 200 exercises for faster initial load (unless searching)
    const limit = 200;
    const searchStr = typeof search === 'string' ? search : '';
    const shouldLimit = !searchStr || searchStr.trim() === '';
    const totalExercises = exercises.length;
    
    if (shouldLimit && exercises.length > limit) {
      exercises = exercises.slice(0, limit);
      console.log(`⚡ Limited to ${limit} exercises for faster loading (${totalExercises} total available)`);
    }
    
    // Log sample exercises with mediaUrl for debugging
    if (exercises.length > 0) {
      console.log(`📊 Returning ${exercises.length} exercises (${totalExercises} total)`);
      console.log(`📸 Sample exercise with mediaUrl:`, {
        name: exercises[0].name,
        hasMediaUrl: !!exercises[0].mediaUrl,
        mediaUrl: exercises[0].mediaUrl
      });
    }

    // Apply search filter if provided
    if (searchStr && searchStr.trim() !== '') {
      const searchLower = searchStr.toLowerCase();
      exercises = exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchLower) ||
        (exercise.notes && exercise.notes.toLowerCase().includes(searchLower)) ||
        (exercise.muscle && exercise.muscle.toLowerCase().includes(searchLower)) ||
        (exercise.type && exercise.type.toLowerCase().includes(searchLower))
      );
    }

    return res.json({
      success: true,
      data: {
        exercises,
        total: totalExercises, // Return actual total, not limited count
        returned: exercises.length, // Return how many we're sending
        hasMore: shouldLimit && totalExercises > limit,
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
 * @param req Express request object
 * @param res Express response object
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
    const now = Date.now();
    
    if (!exerciseCache || now - exerciseCache.timestamp > CACHE_DURATION) {
      apiExercises = await fetchExercisesFromAPI();
      exerciseCache = {
        data: apiExercises,
        timestamp: now,
      };
    } else {
      apiExercises = exerciseCache.data;
    }

    // Find exercise in API data
    let exercise = apiExercises.find(
      (e) => e.name.toLowerCase().trim() === exerciseNameLower
    );

    // Also check database
    try {
      const query: any = { isActive: true };
      if (gymId) {
        query.gymId = gymId;
      }

      const workouts = await WorkoutTemplate.find(query).select('exercises name');
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

      // If found in database, merge with API data (database takes precedence)
      if (dbExerciseData.length > 0) {
        const dbExercise = dbExerciseData[0];
        exercise = {
          ...exercise,
          name: dbExercise.name,
          sets: dbExercise.sets || exercise?.sets || 3,
          reps: dbExercise.reps || exercise?.reps || 12,
          restSeconds: dbExercise.restSeconds || exercise?.restSeconds || 60,
          mediaUrl: dbExercise.mediaUrl || exercise?.mediaUrl,
          notes: dbExercise.notes || exercise?.notes || exercise?.instructions,
          workoutCount: dbExerciseData.length,
          usedInWorkouts: dbExerciseData.map((e) => e.workoutName),
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
    } catch (dbError) {
      console.error('Error fetching exercise from database:', dbError);
      // Continue with API exercise if available
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

