import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as workoutController from '../controllers/workout.controller';

const router = Router();

/**
 * Create a new workout template
 * POST /api/workouts
 */
router.post('/', requireAuth, workoutController.createWorkout);

/**
 * Get all workout templates
 * GET /api/workouts
 */
router.get('/', requireAuth, workoutController.getWorkouts);

/**
 * Get a single workout template by ID
 * GET /api/workouts/:id
 */
router.get('/:id', requireAuth, workoutController.getWorkoutById);

/**
 * Update a workout template
 * PUT /api/workouts/:id
 */
router.put('/:id', requireAuth, workoutController.updateWorkout);

/**
 * Delete a workout template
 * DELETE /api/workouts/:id
 */
router.delete('/:id', requireAuth, workoutController.deleteWorkout);

export default router;


