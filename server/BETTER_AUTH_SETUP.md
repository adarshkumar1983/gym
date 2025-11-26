# Better Auth Setup Guide

This project uses [Better Auth](https://www.better-auth.com/) for authentication - a modern, secure, and feature-rich authentication library.

## Features

✅ Email/Password authentication  
✅ Secure session management  
✅ CSRF protection  
✅ Rate limiting  
✅ Password hashing (scrypt algorithm)  
✅ OAuth support (ready to enable)  
✅ TypeScript support  

## Better Auth Endpoints

Better Auth automatically provides these endpoints at `/api/auth/*`:

- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/forget-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/update` - Update user profile

## Custom Endpoints

We've added custom endpoints:

- `GET /api/auth/me` - Get current user with profile (role, phone, etc.)
- `GET /api/auth/session` - Get session with user profile

## User Profile Extension

Better Auth handles authentication, but we extend it with a `UserProfile` model for:

- **Role**: owner, trainer, or member
- **Phone**: Contact number
- **Profile Image**: Avatar URL
- **Gym ID**: Link member to their gym
- **Trainer ID**: Link member to their trainer

## Usage Examples

### Register a User

```typescript
// Frontend/Client
const response = await fetch('http://localhost:3000/api/auth/sign-up', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123',
    name: 'John Doe',
  }),
});

// After registration, create user profile
await fetch('http://localhost:3000/api/users/profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': response.headers.get('Set-Cookie') || '',
  },
  body: JSON.stringify({
    role: 'member',
    phone: '+1234567890',
  }),
});
```

### Login

```typescript
const response = await fetch('http://localhost:3000/api/auth/sign-in', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123',
  }),
});

// Session cookie is automatically set
const session = await response.json();
```

### Get Current User

```typescript
const response = await fetch('http://localhost:3000/api/auth/me', {
  credentials: 'include', // Important: include cookies
});

const { data } = await response.json();
console.log(data.user); // User with profile
```

### Protected Route Example

```typescript
// Server route
import { requireAuth, requireRole } from '../middleware/auth.middleware';

router.get('/gyms', requireAuth, async (req, res) => {
  // req.session.user is available
  // req.userProfile is available (role, phone, etc.)
  const userRole = req.userProfile?.role;
  // ...
});

// Owner-only route
router.post('/gyms', requireAuth, requireRole('owner'), async (req, res) => {
  // Only owners can access
});
```

## Environment Variables

Add to `.env`:

```env
BETTER_AUTH_SECRET=your-super-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

## Security Features

1. **Password Hashing**: Uses `scrypt` algorithm (resistant to brute-force)
2. **Session Management**: Secure HTTP-only cookies
3. **CSRF Protection**: Built-in origin validation
4. **Rate Limiting**: 10 requests per minute per IP
5. **Secure Cookies**: SameSite, Secure flags in production

## OAuth Setup (Optional)

To enable Google/GitHub OAuth:

1. Add credentials to `.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

2. Uncomment in `src/lib/better-auth.ts`:
```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
},
```

## Migration from Custom JWT

If you had custom JWT auth:

1. ✅ Better Auth replaces JWT tokens with secure sessions
2. ✅ User passwords are handled by Better Auth
3. ✅ Use `UserProfile` model for role and custom fields
4. ✅ Use `requireAuth` middleware instead of JWT verification

## Database Collections

Better Auth creates these MongoDB collections:

- `user` - User accounts
- `session` - Active sessions
- `verification` - Email verification tokens
- `account` - OAuth account links

Our custom collections:

- `userprofiles` - Extended user data (role, phone, etc.)

## Next Steps

1. ✅ Better Auth is configured
2. 🔜 Create user profile after registration
3. 🔜 Add role-based access control
4. 🔜 Enable OAuth providers (optional)

