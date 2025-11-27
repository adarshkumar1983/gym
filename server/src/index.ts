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

// Import routes (will be created)
// import gymRoutes from './routes/gym.routes';
// import memberRoutes from './routes/member.routes';
// import workoutRoutes from './routes/workout.routes';
// import paymentRoutes from './routes/payment.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Custom API Routes (mount FIRST - these take precedence)
app.use('/api/auth', authRoutes); // Custom auth endpoints (session, me)

// Better Auth routes (handles all other /api/auth/* routes that custom routes don't handle)
// Use toNodeHandler for proper Express integration - this will be set after auth is initialized
let betterAuthHandler: ((req: any, res: any, next?: any) => Promise<void>) | null = null;

app.use('/api/auth', async (req, res, next) => {
  // If custom routes already handled this request, skip
  if (res.headersSent) {
    return;
  }
  
  // If Better Auth handler is not initialized yet, wait or return error
  if (!betterAuthHandler) {
    return res.status(503).json({
      success: false,
      error: { message: 'Better Auth not initialized yet' }
    });
  }
  
  // Use Better Auth's Node.js handler
  return betterAuthHandler(req, res, next);
});
app.use('/api/users', userRoutes); // User profile management

// API Routes (protected routes will use requireAuth middleware)
app.use('/api/gyms', (_req, res) => res.json({ message: 'Gym routes - coming soon' }));
app.use('/api/members', (_req, res) => res.json({ message: 'Member routes - coming soon' }));
app.use('/api/workouts', (_req, res) => res.json({ message: 'Workout routes - coming soon' }));
app.use('/api/payments', (_req, res) => res.json({ message: 'Payment routes - coming soon' }));

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

