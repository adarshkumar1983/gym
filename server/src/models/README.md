# MongoDB Models

All MongoDB models using Mongoose ODM.

## Models Overview

### Core Models

1. **User** (Better Auth handles authentication, this is for reference)
   - Note: Better Auth creates its own `user` collection
   - This model is kept for reference but may not be actively used

2. **UserProfile** - Extends Better Auth users
   - `userId` - Links to Better Auth user
   - `role` - owner, trainer, or member
   - `phone`, `profileImageUrl`, `gymId`, `trainerId`

3. **Gym** - Gym/business information
   - `ownerId` - Links to owner user
   - `name`, `address`, `timezone`, `settings`

4. **GymMember** - Many-to-many relationship
   - Links users to gyms
   - `gymId`, `userId`, `trainerId`, `status`

### Workout Models

5. **WorkoutTemplate** - Reusable workout templates
   - `gymId` - Which gym owns this template
   - `exercises` - Array of exercises with sets, reps, etc.
   - `name`, `description`, `tags`

6. **AssignedWorkout** - Workouts assigned to members
   - `userId` - Member who has this workout
   - `templateId` - Which template was used
   - `scheduledAt` - When the workout is scheduled
   - `status` - pending, in_progress, completed, skipped

7. **ExerciseLog** - Records of completed exercises
   - `assignedWorkoutId` - Which workout this belongs to
   - `exerciseId` - Which exercise was done
   - `setsCompleted`, `repsData`, `weightKg`, `notes`

8. **RecurrenceRule** - Rules for recurring workout assignments
   - `userId`, `templateId`
   - `recurrenceType` - daily, weekly, monthly
   - `interval`, `startDate`, `endDate`, `daysOfWeek`

### Membership & Payment Models

9. **Membership** - Member subscriptions
   - `gymId`, `userId`
   - `startDate`, `endDate`, `status`
   - `planType` - monthly, quarterly, yearly
   - `externalPaymentId` - Stripe subscription ID

10. **PaymentRecord** - Payment transactions
    - `membershipId` - Which membership this payment is for
    - `provider` - stripe, razorpay, manual
    - `amount`, `currency`, `status`
    - `invoiceUrl`, `receiptUrl`

### Notification Model

11. **Notification** - User notifications
    - `toUserId` - Who receives this
    - `type` - workout_reminder, payment_due, etc.
    - `title`, `body`, `payload`
    - `status` - pending, sent, read, failed
    - `scheduledAt`, `sentAt`, `readAt`

## Usage

```typescript
import { Gym, UserProfile, WorkoutTemplate } from './models';

// Create
const gym = new Gym({
  ownerId: userId,
  name: 'FitZone Gym',
  address: '123 Main St'
});
await gym.save();

// Find
const gyms = await Gym.find({ ownerId: userId });

// Update
await Gym.findByIdAndUpdate(gymId, { name: 'New Name' });

// Delete
await Gym.findByIdAndDelete(gymId);
```

## Indexes

All models have appropriate indexes for:
- Foreign keys (userId, gymId, etc.)
- Common query fields (status, scheduledAt, etc.)
- Unique constraints where needed

## Relationships

- User → UserProfile (1:1 via userId)
- Gym → GymMember (1:many)
- User → GymMember (1:many)
- WorkoutTemplate → AssignedWorkout (1:many)
- AssignedWorkout → ExerciseLog (1:many)
- Membership → PaymentRecord (1:many)

