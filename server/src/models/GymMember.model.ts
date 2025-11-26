import mongoose, { Document, Schema } from 'mongoose';

export interface IGymMember extends Document {
  gymId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  trainerId?: mongoose.Types.ObjectId;
  joinedAt: Date;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const GymMemberSchema = new Schema<IGymMember>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Gym ID is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    trainerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Unique constraint: one user can only be a member of a gym once
GymMemberSchema.index({ gymId: 1, userId: 1 }, { unique: true });

// Indexes
GymMemberSchema.index({ gymId: 1 });
GymMemberSchema.index({ userId: 1 });
GymMemberSchema.index({ trainerId: 1 });
GymMemberSchema.index({ status: 1 });

export const GymMember = mongoose.model<IGymMember>('GymMember', GymMemberSchema);

