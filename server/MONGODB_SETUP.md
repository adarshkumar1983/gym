# MongoDB Setup Guide

This project uses **MongoDB** as the primary database with **Mongoose ODM**.

## Database Configuration

### Connection
- **URI**: `mongodb://localhost:27017/gym_db` (development)
- **Database Name**: `gym_db`
- **Port**: `27017`

### Docker Setup
MongoDB runs in Docker via `docker-compose.yml`:

```yaml
mongodb:
  image: mongo:7.0
  container_name: gym_mongodb
  ports:
    - "27017:27017"
  volumes:
    - mongodb_data:/data/db
```

## Collections

### Better Auth Collections (Auto-created)
Better Auth automatically creates these collections:
- `user` - User accounts (email, password hash, name)
- `session` - Active user sessions
- `verification` - Email verification tokens
- `account` - OAuth account links (if OAuth enabled)

### Application Collections

1. **userprofiles** - Extended user data
   - Role (owner/trainer/member)
   - Phone, profile image
   - Gym and trainer associations

2. **gyms** - Gym/business information
   - Owner, name, address, timezone, settings

3. **gymmembers** - User-Gym relationships
   - Links members to gyms
   - Trainer assignments
   - Membership status

4. **workouttemplates** - Reusable workout templates
   - Exercises with sets, reps, rest time
   - Media URLs, notes

5. **assignedworkouts** - Workouts assigned to members
   - Scheduled dates
   - Completion status
   - Recurrence references

6. **exerciselogs** - Exercise completion records
   - Sets completed, reps data
   - Weight, notes, timestamps

7. **memberships** - Member subscriptions
   - Start/end dates
   - Payment plan types
   - Stripe subscription IDs

8. **paymentrecords** - Payment transactions
   - Amount, currency, status
   - Provider (Stripe, Razorpay, manual)
   - Invoice/receipt URLs

9. **notifications** - User notifications
   - Type, title, body
   - Status (pending/sent/read)
   - Scheduled times

10. **recurrencerules** - Recurring workout rules
    - Daily/weekly/monthly patterns
    - Start/end dates
    - Days of week

## Models Location

All models are in `server/src/models/`:
- `User.model.ts` (reference - Better Auth handles users)
- `UserProfile.model.ts`
- `Gym.model.ts`
- `GymMember.model.ts`
- `WorkoutTemplate.model.ts`
- `AssignedWorkout.model.ts`
- `ExerciseLog.model.ts`
- `Membership.model.ts`
- `PaymentRecord.model.ts`
- `Notification.model.ts`
- `RecurrenceRule.model.ts`

## Usage Example

```typescript
import mongoose from 'mongoose';
import { Gym, UserProfile } from './models';

// Connect
await mongoose.connect(process.env.MONGODB_URI!);

// Create
const gym = new Gym({
  ownerId: userId,
  name: 'My Gym',
  address: '123 Main St'
});
await gym.save();

// Query
const gyms = await Gym.find({ ownerId: userId })
  .populate('ownerId')
  .exec();

// Update
await Gym.findByIdAndUpdate(gymId, {
  name: 'Updated Name'
});

// Delete
await Gym.findByIdAndDelete(gymId);
```

## Indexes

All models have indexes for:
- Foreign keys (userId, gymId, etc.)
- Query fields (status, scheduledAt, etc.)
- Unique constraints (email, gymId+userId, etc.)

## Data Relationships

```
User (Better Auth)
  └─ UserProfile (1:1)
      └─ GymMember (many:many with Gym)
          └─ Membership (1:many)
              └─ PaymentRecord (1:many)

Gym (1:many)
  ├─ GymMember
  └─ WorkoutTemplate
      └─ AssignedWorkout (1:many)
          └─ ExerciseLog (1:many)
              └─ RecurrenceRule (optional)
```

## Connection in Code

The connection is established in `server/src/index.ts`:

```typescript
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_db';
  await mongoose.connect(mongoURI);
  console.log('✅ MongoDB connected successfully');
};
```

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/gym_db
```

For production, use MongoDB Atlas or managed MongoDB:
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/gym_db
```

## MongoDB Tools

### MongoDB Compass (GUI)
Download: https://www.mongodb.com/products/compass

Connect to: `mongodb://localhost:27017`

### MongoDB Shell (mongosh)
```bash
# Connect
mongosh mongodb://localhost:27017/gym_db

# Show databases
show dbs

# Use database
use gym_db

# Show collections
show collections

# Query
db.gyms.find()
db.userprofiles.find({ role: 'owner' })
```

## Backup & Restore

### Backup
```bash
mongodump --uri="mongodb://localhost:27017/gym_db" --out=/backup
```

### Restore
```bash
mongorestore --uri="mongodb://localhost:27017/gym_db" /backup/gym_db
```

## Production Considerations

1. **Use MongoDB Atlas** or managed MongoDB service
2. **Enable authentication** (username/password)
3. **Use connection string with credentials**
4. **Set up replica sets** for high availability
5. **Enable SSL/TLS** for encrypted connections
6. **Regular backups** (automated)
7. **Monitor performance** (slow queries, indexes)

