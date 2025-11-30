import { Request, Response, NextFunction } from 'express';
import { validateSession, loadUserProfile } from '../services/auth';

// Extend Express Request to include session
declare global {
  namespace Express {
    interface Request {
      session?: {
        user: {
          id: string;
          email: string;
          name: string;
          role?: string;
          [key: string]: any;
        };
      };
      userProfile?: {
        userId: string;
        role: 'owner' | 'trainer' | 'member';
        phone?: string;
        profileImageUrl?: string;
        gymId?: string;
        trainerId?: string;
      };
    }
  }
}

/**
 * Middleware to verify user is authenticated
 * Supports both cookie-based and Bearer token authentication
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionResult = await validateSession(req.headers);
    
    if (!sessionResult?.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
      return;
    }

    // Attach session to request
    req.session = {
      user: {
        ...sessionResult.user,
        role: sessionResult.user.role ?? undefined,
      },
    };

    // Load and attach user profile
    const userProfile = await loadUserProfile(sessionResult.user.id);
    if (userProfile) {
      req.userProfile = userProfile;
      if (req.session) {
        req.session.user.role = userProfile.role;
      }
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired session' },
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionResult = await validateSession(req.headers);
      
      if (!sessionResult?.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required' },
        });
        return;
      }

      // Load user profile to check role
      const userProfile = await loadUserProfile(sessionResult.user.id);
      const userRole = userProfile?.role || sessionResult.user.role;
      
      if (!userRole || !roles.includes(userRole)) {
        res.status(403).json({
          success: false,
          error: { message: 'Insufficient permissions' },
        });
        return;
      }

      // Attach session and profile to request
      req.session = {
        user: {
          ...sessionResult.user,
          role: sessionResult.user.role ?? undefined,
        },
      };
      
      if (userProfile) {
        req.userProfile = userProfile;
      }

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired session' },
      });
    }
  };
};

/**
 * Optional auth - attaches session if present but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionResult = await validateSession(req.headers);
    if (sessionResult?.user) {
      req.session = {
        user: {
          ...sessionResult.user,
          role: sessionResult.user.role ?? undefined,
        },
      };
      
      const userProfile = await loadUserProfile(sessionResult.user.id);
      if (userProfile) {
        req.userProfile = userProfile;
      }
    }
    next();
  } catch {
    // Continue without auth if session is invalid
    next();
  }
};

