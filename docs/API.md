# API Specification

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.yourgymapp.com/api`

## Authentication
All endpoints (except auth endpoints) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## OpenAPI Specification

See [openapi.yaml](../backend/openapi.yaml) for complete OpenAPI 3.0 specification.

## Core Endpoints

### Authentication

#### POST /auth/register
Register a new user (owner or member)

**Request:**
```json
{
  "email": "owner@gym.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "owner"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "owner@gym.com",
    "name": "John Doe",
    "role": "owner"
  }
}
```

#### POST /auth/login
Login with email and password

#### POST /auth/refresh
Refresh access token using refresh token

---

### Gyms

#### POST /gyms
Create a new gym (owner only)

**Request:**
```json
{
  "name": "FitZone Gym",
  "address": "123 Main St",
  "timezone": "America/New_York"
}
```

#### GET /gyms
List gyms (owner sees their gyms, member sees their gym)

#### GET /gyms/:id
Get gym details

---

### Members

#### POST /gyms/:gymId/members
Add a member to a gym (owner/trainer only)

**Request:**
```json
{
  "email": "member@example.com",
  "name": "Jane Member",
  "phone": "+1234567890"
}
```

#### GET /gyms/:gymId/members
List all members in a gym

#### GET /members/:id
Get member details

---

### Workout Templates

#### POST /gyms/:gymId/workout-templates
Create a workout template (owner/trainer only)

**Request:**
```json
{
  "name": "2-Day Starter Plan",
  "description": "Beginner-friendly 2-day workout",
  "exercises": [
    {
      "name": "Push-ups",
      "sets": 3,
      "reps": 10,
      "restSeconds": 60,
      "notes": "Full range of motion"
    }
  ]
}
```

#### GET /gyms/:gymId/workout-templates
List all templates for a gym

#### GET /workout-templates/:id
Get template details

---

### Assigned Workouts

#### POST /members/:memberId/workouts/assign
Assign a workout template to a member (owner/trainer only)

**Request:**
```json
{
  "templateId": "uuid",
  "scheduledAt": "2024-01-15T08:00:00Z",
  "recurrence": {
    "type": "daily",
    "interval": 1,
    "endDate": "2024-02-15"
  }
}
```

#### GET /workouts/today
Get today's workouts for authenticated member

**Response:**
```json
{
  "workouts": [
    {
      "id": "uuid",
      "templateName": "2-Day Starter Plan",
      "scheduledAt": "2024-01-15T08:00:00Z",
      "status": "pending",
      "exercises": [
        {
          "id": "uuid",
          "name": "Push-ups",
          "sets": 3,
          "reps": 10,
          "restSeconds": 60,
          "mediaUrl": "https://s3.../pushup.mp4",
          "completed": false
        }
      ]
    }
  ]
}
```

#### GET /workouts/:id
Get workout details

#### POST /workouts/:id/exercises/:exerciseId/complete
Mark an exercise as complete

**Request:**
```json
{
  "setsCompleted": 3,
  "repsData": [10, 10, 10],
  "notes": "Felt good"
}
```

---

### Exercise Logs

#### GET /workouts/:workoutId/logs
Get exercise logs for a workout

#### GET /members/:memberId/logs
Get all exercise logs for a member (with pagination)

---

### Memberships & Payments

#### POST /memberships
Create a membership (owner only)

**Request:**
```json
{
  "memberId": "uuid",
  "gymId": "uuid",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "planType": "monthly"
}
```

#### GET /memberships
List memberships (filtered by role)

#### POST /payments/stripe/checkout
Create Stripe checkout session

**Request:**
```json
{
  "membershipId": "uuid",
  "successUrl": "https://app.yourgym.com/success",
  "cancelUrl": "https://app.yourgym.com/cancel"
}
```

#### POST /webhooks/stripe
Stripe webhook endpoint (verifies signature)

---

### Notifications

#### GET /notifications
Get user's notifications

#### POST /notifications/:id/read
Mark notification as read

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": {
    "field": "email",
    "reason": "Invalid email format"
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

