import { Router } from 'express';
import { getAuth } from '../lib/better-auth';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get current user session
 * GET /api/auth/session
 */
router.get('/session', requireAuth, async (req, res) => {
  try {
    const session = await getAuth().api.getSession({ headers: req.headers });
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: { message: 'No active session' }
      });
    }

    return res.json({
      success: true,
      data: {
        session,
        user: session.user
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const session = await getAuth().api.getSession({ headers: req.headers });
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: { message: 'No active session' }
      });
    }

    return res.json({
      success: true,
      data: {
        user: session.user
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

export default router;

