/**
 * Follow Model
 * Tracks user follow relationships
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId; // User who follows
  followingId: mongoose.Types.ObjectId; // User being followed
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate follows
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Prevent self-follow
FollowSchema.pre('save', function(next) {
  if (this.followerId.toString() === this.followingId.toString()) {
    next(new Error('Cannot follow yourself'));
  } else {
    next();
  }
});

export const Follow = mongoose.model<IFollow>('Follow', FollowSchema);


