/**
 * Server Entry Point
 * Main application initialization and startup
 */

import dotenv from 'dotenv';
import { createApp } from './config/app.config';
import { mountRoutes } from './routes';
import { connectDB, disconnectDB } from './config/database.config';
import { initializeAuth } from './config/auth.config';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';

// Load environment variables
dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3000;

// Mount routes
mountRoutes(app);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB and initialize Better Auth
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await initializeAuth();
    
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
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});
