import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/better-auth';
import { UserProfile } from '../models/UserProfile.model';

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
 * Also loads user profile with role and additional fields
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      });
    }

    // Attach session to request (convert null role to undefined)
    req.session = {
      user: {
        ...session.user,
        role: session.user.role ?? undefined,
      },
    };

    // Load user profile (role, phone, etc.)
    try {
      const userProfile = await UserProfile.findOne({ userId: session.user.id });
      if (userProfile) {
        req.userProfile = {
          userId: userProfile.userId,
          role: userProfile.role,
          phone: userProfile.phone,
          profileImageUrl: userProfile.profileImageUrl,
          gymId: userProfile.gymId?.toString(),
          trainerId: userProfile.trainerId?.toString(),
        };
        // Also attach role to session user for convenience
        if (req.session) {
          req.session.user.role = userProfile.role;
        }
      }
    } catch (error) {
      // Profile not found, continue without it
      console.warn('User profile not found for user:', session.user.id);
    }

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired session'
      }
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      
      if (!session || !session.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required'
          }
        });
      }

      // Load user profile to check role
      const userProfile = await UserProfile.findOne({ userId: session.user.id });
      const userRole = userProfile?.role || (session.user as any).role;
      
      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Insufficient permissions'
          }
        });
      }

      // Attach profile to request
      if (userProfile) {
        req.userProfile = {
          userId: userProfile.userId,
          role: userProfile.role,
          phone: userProfile.phone,
          profileImageUrl: userProfile.profileImageUrl,
          gymId: userProfile.gymId?.toString(),
          trainerId: userProfile.trainerId?.toString(),
        };
      }

      // Attach session to request (convert null role to undefined)
      req.session = {
        user: {
          ...session.user,
          role: session.user.role ?? undefined,
        },
      };
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired session'
        }
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
) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session) {
      // Attach session to request (convert null role to undefined)
      req.session = {
        user: {
          ...session.user,
          role: session.user.role ?? undefined,
        },
      };
    }
    return next();
  } catch (error) {
    // Continue without auth if session is invalid
    return next();
  }
};

