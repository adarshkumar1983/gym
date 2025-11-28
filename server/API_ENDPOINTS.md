# API Endpoints Reference

Base URL: `http://localhost:3000` (or your server URL)

All endpoints return JSON responses with the following format:
- **Success**: `{ success: true, data: {...} }`
- **Error**: `{ success: false, error: { message: string } }`

---

## 🔐 Authentication Endpoints (`/api/auth`)

### Better Auth Endpoints (Email/Password)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/sign-up/email` | ❌ No | Register a new user with email and password |
| POST | `/api/auth/sign-in/email` | ❌ No | Sign in with email and password |
| POST | `/api/auth/sign-out` | ✅ Yes | Sign out current user |
| POST | `/api/auth/sign-up` | ❌ No | Legacy endpoint (redirects to `/sign-up/email`) |
| POST | `/api/auth/sign-in` | ❌ No | Legacy endpoint (redirects to `/sign-in/email`) |

**Sign Up Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Sign In Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### Custom Auth Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/auth/session` | ✅ Yes | Get current user session |
| GET | `/api/auth/me` | ✅ Yes | Get current user profile |

---

## 👤 User Profile Endpoints (`/api/users`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/users/profile` | ✅ Yes | Create or update user profile |
| GET | `/api/users/profile` | ✅ Yes | Get current user's profile |

**Create/Update Profile Request Body:**
```json
{
  "role": "member" | "trainer" | "owner",
  "phone": "+1234567890",
  "profileImageUrl": "https://example.com/image.jpg",
  "gymId": "gym_id_here",
  "trainerId": "trainer_id_here"
}
```

**Profile Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "userId": "user_id",
      "role": "member",
      "phone": "+1234567890",
      "profileImageUrl": "https://example.com/image.jpg",
      "gymId": "gym_id",
      "trainerId": "trainer_id"
    }
  }
}
```

---

## 🏋️ Gym Endpoints (`/api/gyms`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/gyms` | ✅ Yes | Create a new gym (requires authentication) |
| GET | `/api/gyms` | ✅ Yes | Get all gyms (filtered by ownerId if query param provided) |
| GET | `/api/gyms/:id` | ✅ Yes | Get a single gym by ID |
| PUT | `/api/gyms/:id` | ✅ Yes | Update a gym (owner only) |
| DELETE | `/api/gyms/:id` | ✅ Yes | Delete a gym (owner only) |

**Query Parameters for GET `/api/gyms`:**
- `ownerId` (optional): Filter gyms by owner ID

**Create Gym Request Body:**
```json
{
  "name": "Fitness Center",
  "address": "123 Main St, City, State",
  "timezone": "America/New_York",
  "settings": {
    "customField": "value"
  }
}
```

**Update Gym Request Body:**
```json
{
  "name": "Updated Gym Name",
  "address": "New Address",
  "timezone": "UTC",
  "settings": {
    "newSetting": "value"
  }
}
```

---

## 👥 Member Endpoints (`/api/members`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/members` | ✅ Yes | Add a member to a gym |
| GET | `/api/members` | ✅ Yes | Get all members (with optional filtering) |
| GET | `/api/members/:id` | ✅ Yes | Get a single member by ID |
| PUT | `/api/members/:id` | ✅ Yes | Update a member (status, trainer) |
| DELETE | `/api/members/:id` | ✅ Yes | Remove a member from a gym |

**Query Parameters for GET `/api/members`:**
- `gymId` (optional): Filter by gym ID
- `userId` (optional): Filter by user ID
- `trainerId` (optional): Filter by trainer ID
- `status` (optional): Filter by status (`active`, `inactive`, `suspended`)

**Add Member Request Body:**
```json
{
  "gymId": "gym_id_here",
  "userId": "user_id_here",
  "trainerId": "trainer_id_here" // optional
}
```

**Update Member Request Body:**
```json
{
  "trainerId": "new_trainer_id", // optional
  "status": "active" | "inactive" | "suspended"
}
```

---

## 💪 Workout Template Endpoints (`/api/workouts`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/workouts` | ✅ Yes | Create a new workout template |
| GET | `/api/workouts` | ✅ Yes | Get all workout templates (with optional filtering) |
| GET | `/api/workouts/:id` | ✅ Yes | Get a single workout template by ID |
| PUT | `/api/workouts/:id` | ✅ Yes | Update a workout template (creator only) |
| DELETE | `/api/workouts/:id` | ✅ Yes | Delete a workout template (creator only) |

**Query Parameters for GET `/api/workouts`:**
- `gymId` (optional): Filter by gym ID
- `createdBy` (optional): Filter by creator ID
- `isActive` (optional): Filter by active status (`true`/`false`)

**Create Workout Request Body:**
```json
{
  "gymId": "gym_id_here",
  "name": "Full Body Workout",
  "description": "A comprehensive full body workout",
  "exercises": [
    {
      "name": "Push-ups",
      "sets": 3,
      "reps": 15,
      "restSeconds": 60,
      "mediaUrl": "https://example.com/video.mp4",
      "notes": "Keep back straight",
      "orderIndex": 0
    }
  ],
  "tags": ["strength", "beginner"],
  "isActive": true
}
```

**Update Workout Request Body:**
```json
{
  "name": "Updated Workout Name",
  "description": "Updated description",
  "exercises": [...],
  "tags": ["updated", "tags"],
  "isActive": false
}
```

---

## 💳 Payment Endpoints (`/api/payments`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/payments` | ✅ Yes | Create a new payment record |
| GET | `/api/payments` | ✅ Yes | Get all payment records (with optional filtering) |
| GET | `/api/payments/:id` | ✅ Yes | Get a single payment record by ID |
| PUT | `/api/payments/:id` | ✅ Yes | Update a payment record (status, URLs, etc.) |
| DELETE | `/api/payments/:id` | ✅ Yes | Delete a payment record |

**Query Parameters for GET `/api/payments`:**
- `membershipId` (optional): Filter by membership ID
- `provider` (optional): Filter by provider (`stripe`, `razorpay`, `manual`)
- `status` (optional): Filter by status (`pending`, `completed`, `failed`, `refunded`)

**Create Payment Request Body:**
```json
{
  "membershipId": "membership_id_here",
  "provider": "stripe" | "razorpay" | "manual",
  "providerId": "payment_intent_id",
  "amount": 99.99,
  "currency": "USD",
  "status": "pending" | "completed" | "failed" | "refunded",
  "invoiceUrl": "https://example.com/invoice.pdf",
  "receiptUrl": "https://example.com/receipt.pdf",
  "metadata": {
    "customField": "value"
  }
}
```

**Update Payment Request Body:**
```json
{
  "status": "completed",
  "invoiceUrl": "https://example.com/invoice.pdf",
  "receiptUrl": "https://example.com/receipt.pdf",
  "providerId": "updated_provider_id",
  "metadata": {
    "updatedField": "value"
  }
}
```

---

## 🏥 Health Check

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/health` | ❌ No | Server health check |

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67
}
```

---

## 🔒 Authentication

Most endpoints require authentication. Include the session cookie in your requests, or use the `Authorization` header if configured.

**Authentication Flow:**
1. Sign up or sign in via `/api/auth/sign-up/email` or `/api/auth/sign-in/email`
2. Better Auth sets a session cookie automatically
3. Include cookies in subsequent requests (handled automatically by browsers)
4. For API clients, extract and send the session cookie manually

**Protected Endpoints:**
All endpoints except:
- `/health`
- `/api/auth/sign-up/email`
- `/api/auth/sign-in/email`
- `/api/auth/sign-up` (legacy)
- `/api/auth/sign-in` (legacy)

---

## 📝 Notes

1. **Owner/Creator Checks**: 
   - Gym update/delete requires user to be the owner
   - Workout update/delete requires user to be the creator

2. **Status Values**:
   - Member status: `active`, `inactive`, `suspended`
   - Payment status: `pending`, `completed`, `failed`, `refunded`

3. **Error Responses**:
   - `400`: Bad Request (invalid input)
   - `401`: Unauthorized (not authenticated)
   - `403`: Forbidden (insufficient permissions)
   - `404`: Not Found (resource doesn't exist)
   - `500`: Internal Server Error

4. **Rate Limiting**: 
   - Better Auth endpoints have rate limiting (10 requests per minute)

5. **CORS**: 
   - Configured for frontend and mobile app origins
   - Credentials enabled for cookie-based authentication

---

## 📊 Summary

**Total Endpoints: 35+**

- **Authentication**: 7 endpoints (Better Auth + custom)
- **User Profile**: 2 endpoints
- **Gyms**: 5 endpoints
- **Members**: 5 endpoints
- **Workouts**: 5 endpoints
- **Payments**: 5 endpoints
- **Health**: 1 endpoint

All endpoints follow RESTful conventions and use consistent response formats.

