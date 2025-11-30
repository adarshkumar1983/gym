/**
 * Post Model
 * Represents a social media post (workout, progress, etc.)
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'workout' | 'progress' | 'achievement' | 'meal' | 'general';
  content: string; // Text content
  mediaUrls: string[]; // Images/videos
  workoutId?: mongoose.Types.ObjectId; // Linked workout if type is 'workout'
  mealId?: mongoose.Types.ObjectId; // Linked meal if type is 'meal'
  likes: mongoose.Types.ObjectId[]; // User IDs who liked
  comments: mongoose.Types.ObjectId[]; // Comment IDs
  views: number;
  isPremium: boolean; // Premium-only content
  tags: string[]; // Hashtags
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['workout', 'progress', 'achievement', 'meal', 'general'],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: 2000,
      trim: true,
    },
    mediaUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (urls: string[]) => urls.length <= 10,
        message: 'Maximum 10 media items allowed',
      },
    },
    workoutId: {
      type: Schema.Types.ObjectId,
      ref: 'Workout',
    },
    mealId: {
      type: Schema.Types.ObjectId,
      ref: 'Meal',
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    }],
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    location: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ type: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ isPremium: 1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);

