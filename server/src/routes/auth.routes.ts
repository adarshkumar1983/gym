import { Router } from 'express';
import { getAuth } from '../lib/better-auth';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get current user session
 * GET /api/auth/session
 */
router.get('/session', requireAuth, async (req, res) => {
  console.log(`🔵 [Custom Route] GET /api/auth/session`);
  console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
  
  try {
    const session = await getAuth().api.getSession({ headers: req.headers });
    
    console.log(`   Session result:`, session ? 'Found' : 'Not found');
    
    if (!session) {
      console.warn(`   ⚠️ No active session`);
      return res.status(401).json({
        success: false,
        error: { message: 'No active session' }
      });
    }

    console.log(`   ✅ Session found for user:`, session.user?.email);
    return res.json({
      success: true,
      data: {
        session,
        user: session.user
      }
    });
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message);
    console.error(`   Stack:`, error.stack);
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

