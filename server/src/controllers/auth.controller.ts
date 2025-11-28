import { Request, Response } from 'express';
import { getAuth } from '../lib/better-auth';

/**
 * Auth Controller
 * Handles all authentication-related business logic
 */

/**
 * Get current user session
 * @param req Express request object
 * @param res Express response object
 */
export const getSession = async (req: Request, res: Response): Promise<Response> => {
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
};

/**
 * Get current user profile
 * @param req Express request object
 * @param res Express response object
 */
export const getMe = async (req: Request, res: Response): Promise<Response> => {
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
};

