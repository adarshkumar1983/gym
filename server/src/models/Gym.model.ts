import mongoose, { Document, Schema } from 'mongoose';

export interface IGym extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  address?: string;
  timezone: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const GymSchema = new Schema<IGym>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required']
    },
    name: {
      type: String,
      required: [true, 'Gym name is required'],
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Indexes
GymSchema.index({ ownerId: 1 });

export const Gym = mongoose.model<IGym>('Gym', GymSchema);

