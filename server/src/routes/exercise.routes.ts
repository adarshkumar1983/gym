import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as exerciseController from '../controllers/exercise.controller';

const router = Router();

/**
 * Get all unique exercises from workout templates
 * GET /api/exercises
 */
router.get('/', requireAuth, exerciseController.getAllExercises);

/**
 * Get exercise details by name
 * GET /api/exercises/:name
 */
router.get('/:name', requireAuth, exerciseController.getExerciseByName);

export default router;

