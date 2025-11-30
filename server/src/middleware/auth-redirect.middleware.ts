/**
 * Auth Redirect Middleware
 * Handles backward compatibility for old Better Auth endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { getBetterAuthHandler } from '../config/auth.config';

/**
 * Redirect old /api/auth/sign-up to /api/auth/sign-up/email
 */
export const redirectSignUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.warn(`⚠️ [Server] Old endpoint /api/auth/sign-up called, redirecting to /api/auth/sign-up/email`);
  
  const betterAuthHandler = getBetterAuthHandler();
  if (!betterAuthHandler) {
    res.status(503).json({
      success: false,
      error: { message: 'Better Auth not initialized yet' }
    });
    return;
  }
  
  const originalUrl = req.url;
  const originalOriginalUrl = req.originalUrl;
  req.url = '/api/auth/sign-up/email';
  req.originalUrl = '/api/auth/sign-up/email';
  
  try {
    await betterAuthHandler(req, res, next);
  } finally {
    req.url = originalUrl;
    req.originalUrl = originalOriginalUrl;
  }
};

/**
 * Redirect old /api/auth/sign-in to /api/auth/sign-in/email
 */
export const redirectSignIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.warn(`⚠️ [Server] Old endpoint /api/auth/sign-in called, redirecting to /api/auth/sign-in/email`);
  
  const betterAuthHandler = getBetterAuthHandler();
  if (!betterAuthHandler) {
    res.status(503).json({
      success: false,
      error: { message: 'Better Auth not initialized yet' }
    });
    return;
  }
  
  const originalUrl = req.url;
  const originalOriginalUrl = req.originalUrl;
  req.url = '/api/auth/sign-in/email';
  req.originalUrl = '/api/auth/sign-in/email';
  
  try {
    await betterAuthHandler(req, res, next);
  } finally {
    req.url = originalUrl;
    req.originalUrl = originalOriginalUrl;
  }
};

/**
 * Handle all Better Auth routes
 */
export const handleBetterAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const betterAuthHandler = getBetterAuthHandler();
  
  if (!betterAuthHandler) {
    res.status(503).json({
      success: false,
      error: { message: 'Better Auth not initialized yet' }
    });
    return;
  }
  
  try {
    await betterAuthHandler(req, res, next);
  } catch (error) {
    console.error('[Better Auth Handler Error]', error);
    next(error);
  }
};

