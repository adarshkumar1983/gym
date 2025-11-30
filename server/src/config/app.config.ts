/**
 * App Configuration
 * Express app setup and middleware configuration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

export const createApp = (): express.Application => {
  const app = express();

  // Middleware (order matters!)
  app.use(helmet()); // Security headers
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.MOBILE_APP_URL || 'http://localhost:19006',
      'http://localhost:3000',
      'exp://localhost:8081',
      /^exp:\/\/.*\.exp\.direct$/,
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  }));
  app.use(compression()); // Compress responses
  app.use(morgan('dev')); // Logging

  return app;
};

