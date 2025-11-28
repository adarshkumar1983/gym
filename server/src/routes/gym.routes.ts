import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as gymController from '../controllers/gym.controller';

const router = Router();

/**
 * Create a new gym
 * POST /api/gyms
 */
router.post('/', requireAuth, gymController.createGym);

/**
 * Get all gyms
 * GET /api/gyms
 */
router.get('/', requireAuth, gymController.getGyms);

/**
 * Get a single gym by ID
 * GET /api/gyms/:id
 */
router.get('/:id', requireAuth, gymController.getGymById);

/**
 * Update a gym
 * PUT /api/gyms/:id
 */
router.put('/:id', requireAuth, gymController.updateGym);

/**
 * Delete a gym
 * DELETE /api/gyms/:id
 */
router.delete('/:id', requireAuth, gymController.deleteGym);

export default router;

