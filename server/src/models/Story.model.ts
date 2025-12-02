/**
 * Story Model
 * Snapchat-style stories that expire after 24 hours
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  mediaUrl: string; // Image or video URL
  mediaType: 'image' | 'video';
  caption?: string;
  views: mongoose.Types.ObjectId[]; // User IDs who viewed
  expiresAt: Date; // Auto-delete after 24 hours
  createdAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    mediaUrl: {
      type: String,
      required: [true, 'Media URL is required'],
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    caption: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    views: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired stories
    },
  },
  {
    timestamps: true,
  }
);

// Set expiration to 24 hours from creation
StorySchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

StorySchema.index({ userId: 1, createdAt: -1 });
StorySchema.index({ expiresAt: 1 });

export const Story = mongoose.model<IStory>('Story', StorySchema);


