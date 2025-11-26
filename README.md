# Gym Management Platform

A comprehensive platform for gym owners to manage members, assign workouts, track progress, and handle payments.

## Architecture Overview

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed system architecture.

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB (or use Docker)
- Redis (or use Docker)

### Local Development

```bash
# Start all services (MongoDB, Redis, MinIO)
docker-compose up -d

# Install server dependencies
cd server && npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start server (development mode with hot reload)
npm run dev

# Server will run on http://localhost:3000
# Health check: http://localhost:3000/health
```

## Project Structure

```
gym/
├── server/           # Node.js/Express/TypeScript API server
├── frontend/         # React web app (coming soon)
├── mobile/           # React Native mobile app (coming soon)
├── docs/             # Architecture & API docs
└── docker-compose.yml
```

## MVP Features

- ✅ Authentication: Better Auth with email/password, sessions, CSRF protection
- ✅ User profiles: Role-based access (owner/trainer/member)
- 🔜 Owner: Add members, create/assign workout templates
- 🔜 Member: View today's workout, mark exercises complete
- 🔜 Payments: Stripe Checkout integration
- 🔜 Notifications: Push/email reminders
- 🔜 Background jobs: Workout assignment scheduler

## Roadmap

See [ROADMAP.md](./docs/ROADMAP.md) for detailed feature roadmap (MVP → v1 → scale).

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB, Redis, BullMQ
- **Authentication**: Better Auth (secure, modern auth library)
- **Frontend Web**: React, TypeScript, Tailwind CSS, Vite (coming soon)
- **Mobile**: React Native (Expo), TypeScript (coming soon)
- **Payments**: Stripe
- **Storage**: AWS S3 / MinIO (local dev)
- **Monitoring**: Sentry, Datadog

## License

MIT

