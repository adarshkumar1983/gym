/**
 * Routes Configuration
 * Centralized route mounting
 */

import express, { Application } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import gymRoutes from './gym.routes';
import memberRoutes from './member.routes';
import workoutRoutes from './workout.routes';
import paymentRoutes from './payment.routes';
import exerciseRoutes from './exercise.routes';
import nutritionRoutes from './nutrition.routes';
import socialRoutes from './social.routes';
import { handleBetterAuth, redirectSignUp, redirectSignIn } from '../middleware/auth-redirect.middleware';

export const mountRoutes = (app: Application): void => {
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Custom API Routes (mount BEFORE Better Auth handler)
  app.use('/api/auth', authRoutes);

  // Redirect old Better Auth endpoints (backward compatibility)
  app.post('/api/auth/sign-up', redirectSignUp);
  app.post('/api/auth/sign-in', redirectSignIn);

  // Mount Better Auth handler
  app.all('/api/auth/*', handleBetterAuth);

  // Parse JSON bodies AFTER Better Auth handler
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/users', userRoutes);
  app.use('/api/gyms', gymRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/exercises', exerciseRoutes);
  app.use('/api/nutrition', nutritionRoutes);
  app.use('/api/social', socialRoutes);
};

