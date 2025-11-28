import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

/**
 * Create or update user profile
 * POST /api/users/profile
 */
router.post('/profile', requireAuth, userController.createOrUpdateProfile);

/**
 * Get user profile
 * GET /api/users/profile
 */
router.get('/profile', requireAuth, userController.getProfile);

export default router;

