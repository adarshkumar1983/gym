/**
 * Exercise Fallback Service
 * Provides fallback exercises when APIs fail
 */

import { getFreeExerciseDbMap } from './exercise-image.service';

/**
 * Fallback exercises list (common exercises)
 */
export const getFallbackExercises = async (): Promise<any[]> => {
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
  const exerciseMap = await getFreeExerciseDbMap();
  
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

