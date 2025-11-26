import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Import Better Auth
import { auth } from './lib/better-auth';

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

// Better Auth routes (handles all auth endpoints)
app.use(auth.handler);

// Custom API Routes
app.use('/api/auth', authRoutes); // Custom auth endpoints (session, me)
app.use('/api/users', userRoutes); // User profile management

// API Routes (protected routes will use requireAuth middleware)
app.use('/api/gyms', (_req, res) => res.json({ message: 'Gym routes - coming soon' }));
app.use('/api/members', (_req, res) => res.json({ message: 'Member routes - coming soon' }));
app.use('/api/workouts', (_req, res) => res.json({ message: 'Workout routes - coming soon' }));
app.use('/api/payments', (_req, res) => res.json({ message: 'Payment routes - coming soon' }));

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB
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

