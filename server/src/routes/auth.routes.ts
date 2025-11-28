import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * Get current user session
 * GET /api/auth/session
 */
router.get('/session', requireAuth, authController.getSession);

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', requireAuth, authController.getMe);

export default router;

