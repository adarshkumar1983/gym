import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Import Better Auth factory
import { createAuth } from './lib/better-auth';

let auth: ReturnType<typeof createAuth>;

// Import custom routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import gymRoutes from './routes/gym.routes';
import memberRoutes from './routes/member.routes';
import workoutRoutes from './routes/workout.routes';
import paymentRoutes from './routes/payment.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Better Auth handler will be initialized and mounted after MongoDB connects
let betterAuthHandler: ((req: any, res: any, next?: any) => Promise<void>) | null = null;

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Custom API Routes (mount BEFORE Better Auth handler so they take precedence)
// These handle /session and /me endpoints
app.use('/api/auth', authRoutes);

// Redirect old Better Auth endpoints to new v1.4.1 endpoints (backward compatibility)
// This handles cases where mobile app or other clients still use old endpoints
app.post('/api/auth/sign-up', async (req, res, next) => {
  console.warn(`⚠️ [Server] Old endpoint /api/auth/sign-up called, redirecting to /api/auth/sign-up/email`);
  
  if (!betterAuthHandler) {
    return res.status(503).json({
      success: false,
      error: { message: 'Better Auth not initialized yet' }
    });
  }
  
  // Modify request to use new endpoint and pass directly to Better Auth handler
  // Note: req.path is read-only, so we only modify req.url
  const originalUrl = req.url;
  const originalOriginalUrl = req.originalUrl;
  req.url = '/api/auth/sign-up/email';
  req.originalUrl = '/api/auth/sign-up/email';
  
  try {
    return await betterAuthHandler(req, res, next);
  } finally {
    // Restore original values
    req.url = originalUrl;
    req.originalUrl = originalOriginalUrl;
  }
});

app.post('/api/auth/sign-in', async (req, res, next) => {
  console.warn(`⚠️ [Server] Old endpoint /api/auth/sign-in called, redirecting to /api/auth/sign-in/email`);
  
  if (!betterAuthHandler) {
    return res.status(503).json({
      success: false,
      error: { message: 'Better Auth not initialized yet' }
    });
  }
  
  // Modify request to use new endpoint and pass directly to Better Auth handler
  // Note: req.path is read-only, so we only modify req.url
  const originalUrl = req.url;
  const originalOriginalUrl = req.originalUrl;
  req.url = '/api/auth/sign-in/email';
  req.originalUrl = '/api/auth/sign-in/email';
  
  try {
    return await betterAuthHandler(req, res, next);
  } finally {
    // Restore original values
    req.url = originalUrl;
    req.originalUrl = originalOriginalUrl;
  }
});

// Mount Better Auth handler - handles routes like /sign-up/email, /sign-in/email, /sign-out
// CRITICAL: Must be mounted BEFORE express.json() per Better Auth docs
// Better Auth handles body parsing internally for its routes
app.all('/api/auth/*', async (req, res, next) => {
  if (!betterAuthHandler) {
    return res.status(503).json({
      success: false,
      error: { message: 'Better Auth not initialized yet' }
    });
  }
  
  // Call Better Auth handler - it handles routing and body parsing internally
  // When mounted at /api/auth/*, req.path becomes /sign-up/email (relative)
  // Better Auth knows its basePath is /api/auth, so it matches correctly
  try {
    return await betterAuthHandler(req, res, next);
  } catch (error) {
    console.error('[Better Auth Handler Error]', error);
    return next(error);
  }
});

// Parse JSON bodies AFTER Better Auth handler (for other routes only)
// Per Better Auth docs: "Don't use express.json() before the Better Auth handler"
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use('/api/users', userRoutes); // User profile management
app.use('/api/gyms', gymRoutes); // Gym management
app.use('/api/members', memberRoutes); // Gym member management
app.use('/api/workouts', workoutRoutes); // Workout template management
app.use('/api/payments', paymentRoutes); // Payment record management

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB and initialize Better Auth
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_db';
    
    // MongoDB connection options
    const options = {
      // Remove deprecated options and use modern ones
    };
    
    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Initialize Better Auth after MongoDB is connected
    const { setAuth } = await import('./lib/better-auth');
    auth = createAuth();
    setAuth(auth);
    
    // Create Express handler using Better Auth's Node.js integration
    // Dynamic import to avoid TypeScript issues
    const { toNodeHandler } = await import('better-auth/node');
    betterAuthHandler = toNodeHandler(auth);
    
    console.log('✅ Better Auth initialized successfully');
    console.log(`   Handler type: ${typeof betterAuthHandler}`);
    console.log(`   Auth config basePath: /api/auth`);
    console.log(`   ✅ Better Auth handler mounted at /api/auth/*`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

