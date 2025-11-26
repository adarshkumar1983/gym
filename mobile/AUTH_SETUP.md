# Authentication Setup Guide

## Overview

The mobile app includes login and register pages that connect to the Better Auth backend API.

## API Configuration

The app needs to know where your backend server is running. Configure this in one of two ways:

### Option 1: Environment Variable (Recommended)

Create or update `.env` file in the mobile directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Important URLs by platform:**
- **iOS Simulator**: `http://localhost:3000`
- **Android Emulator**: `http://10.0.2.2:3000`
- **Physical Device**: `http://YOUR_COMPUTER_IP:3000` (e.g., `http://192.168.1.100:3000`)

### Option 2: Edit Config File

Edit `lib/config.ts` to change the default API URL.

## Features

### Login Page (`/login`)
- Email and password authentication
- Form validation
- Error handling
- Link to register page

### Register Page (`/register`)
- User registration with name, email, and password
- Password confirmation
- Form validation
- Link to login page

### Authentication Flow
1. App starts and checks for existing session
2. If not authenticated, redirects to login
3. After login/register, redirects to home screen
4. Session is maintained using cookies (Better Auth)

## Usage

1. **Start the backend server** (if not already running):
   ```bash
   cd ../server
   npm run dev
   ```

2. **Start the mobile app**:
   ```bash
   npm start
   ```

3. **Navigate to login/register**:
   - The app will automatically redirect to login if not authenticated
   - Or navigate to `/login` or `/register` manually

## API Endpoints Used

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session
- `GET /api/auth/me` - Get current user with profile

## Troubleshooting

### Can't connect to backend
- Make sure backend server is running on port 3000
- Check API URL configuration matches your platform
- For physical devices, ensure phone and computer are on same network
- Check firewall settings

### Authentication not working
- Verify backend server is running
- Check that cookies are enabled (Better Auth uses cookies)
- Ensure `withCredentials: true` is set in API client (already configured)

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Check that `expo-secure-store` and `axios` are installed

