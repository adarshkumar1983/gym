# Gym Server

Node.js/Express/TypeScript backend API server for the Gym Management Platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Queue**: BullMQ (Redis)
- **Authentication**: JWT
- **Validation**: express-validator

## Project Structure

```
server/
├── src/
│   ├── models/          # MongoDB models (User, Gym, Workout, etc.)
│   ├── routes/          # API route handlers
│   ├── controllers/     # Business logic controllers
│   ├── middleware/      # Custom middleware (auth, error handling)
│   ├── services/        # Service layer (payments, notifications)
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript (generated)
├── .env.example         # Environment variables template
├── package.json
└── tsconfig.json
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB and Redis:**
   ```bash
   docker-compose up -d
   ```

4. **Run in development mode:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm test` - Run tests

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Better Auth)
Better Auth provides these endpoints automatically at `/api/auth/*`:

- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/forget-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password

### Custom Auth Endpoints
- `GET /api/auth/me` - Get current user with profile
- `GET /api/auth/session` - Get session with user profile

### User Profile
- `GET /api/users/profile` - Get user profile (role, phone, etc.)
- `POST /api/users/profile` - Create/update user profile

### Gyms (Coming Soon)
- `GET /api/gyms` - List gyms
- `POST /api/gyms` - Create gym
- `GET /api/gyms/:id` - Get gym details

### Members (Coming Soon)
- `GET /api/members` - List members
- `POST /api/members` - Add member
- `GET /api/members/:id` - Get member details

### Workouts (Coming Soon)
- `GET /api/workouts/today` - Get today's workouts
- `POST /api/workouts/assign` - Assign workout
- `POST /api/workouts/:id/complete` - Mark workout complete

### Payments (Coming Soon)
- `POST /api/payments/stripe/checkout` - Create Stripe checkout
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `BETTER_AUTH_SECRET` - Better Auth secret key (required)
- `BETTER_AUTH_URL` - Base URL for Better Auth
- `REDIS_HOST` - Redis host
- `STRIPE_SECRET_KEY` - Stripe API key

## Development

The server uses:
- **nodemon** for hot reloading in development
- **ts-node** for running TypeScript directly
- **ESLint** for code linting
- **TypeScript** for type safety

## Authentication

This project uses [Better Auth](https://www.better-auth.com/) for authentication.

**Features:**
- ✅ Email/password authentication
- ✅ Secure session management
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Password hashing (scrypt)

See [BETTER_AUTH_SETUP.md](./BETTER_AUTH_SETUP.md) for detailed setup and usage.

## Next Steps

1. ✅ Authentication is set up with Better Auth
2. Create gym and member management endpoints
3. Build workout assignment and logging system
4. Integrate Stripe payments
5. Set up background job queue for notifications

