import mongoose, { Document, Schema } from 'mongoose';

/**
 * User Profile model - extends Better Auth user with custom fields
 * Better Auth handles authentication, this model stores additional profile data
 */
export interface IUserProfile extends Document {
  userId: string; // Better Auth user ID
  role: 'owner' | 'trainer' | 'member';
  phone?: string;
  profileImageUrl?: string;
  gymId?: mongoose.Types.ObjectId; // If user is a member, link to their gym
  trainerId?: mongoose.Types.ObjectId; // If user is a member, link to their trainer
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    role: {
      type: String,
      enum: ['owner', 'trainer', 'member'],
      required: [true, 'Role is required'],
      default: 'member'
    },
    phone: {
      type: String,
      trim: true
    },
    profileImageUrl: {
      type: String
    },
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym'
    },
    trainerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
UserProfileSchema.index({ userId: 1 });
UserProfileSchema.index({ role: 1 });
UserProfileSchema.index({ gymId: 1 });

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

