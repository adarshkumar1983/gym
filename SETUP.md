# Setup Guide

## Project Structure

```
gym/
├── server/          # Node.js/Express/TypeScript backend (MERN stack)
├── frontend/        # React web app (coming soon)
├── mobile/          # React Native mobile app (coming soon)
├── docs/            # Documentation
└── docker-compose.yml
```

## Tech Stack

### Backend (Server)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Queue**: BullMQ (Redis)
- **Authentication**: JWT

### Frontend (Coming Soon)
- React + TypeScript
- Vite
- Tailwind CSS

### Mobile (Coming Soon)
- React Native (Expo)
- TypeScript

## Quick Start

### 1. Prerequisites

Install:
- Node.js 18+ ([download](https://nodejs.org/))
- Docker & Docker Compose ([download](https://www.docker.com/products/docker-desktop))
- Git

### 2. Clone and Setup

```bash
# Navigate to project
cd gym

# Start services (MongoDB, Redis, MinIO)
docker-compose up -d

# Install server dependencies
cd server
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your settings (MongoDB URI is already correct for Docker)
```

### 3. Start Development Server

```bash
# From server directory
npm run dev

# Server runs on http://localhost:3000
# Health check: http://localhost:3000/health
```

### 4. Verify Setup

```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Check server health
curl http://localhost:3000/health
```

## Environment Variables

Key variables in `server/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB (Docker)
MONGODB_URI=mongodb://localhost:27017/gym_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Redis (Docker)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Docker Services

The `docker-compose.yml` includes:

1. **MongoDB** (port 27017)
   - Database: `gym_db`
   - No authentication in dev (add for production)

2. **Redis** (port 6379)
   - Used for job queue and caching

3. **MinIO** (ports 9000, 9001)
   - S3-compatible storage for local development
   - Console: http://localhost:9001
   - Credentials: `minioadmin` / `minioadmin`

## Next Steps

1. ✅ Server is set up and running
2. 🔜 Implement authentication routes
3. 🔜 Create API endpoints (gyms, members, workouts)
4. 🔜 Set up frontend web app
5. 🔜 Set up mobile app

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB container is running
docker ps

# Restart MongoDB
docker-compose restart mongodb

# Check MongoDB logs
docker logs gym_mongodb
```

### Port Already in Use
```bash
# Change PORT in server/.env
PORT=3001
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Commands

```bash
# Server
cd server
npm run dev          # Start with hot reload
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Check code quality

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
```

