/**
 * Comment Model
 * Comments on posts
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[]; // User IDs who liked the comment
  parentCommentId?: mongoose.Types.ObjectId; // For nested replies
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post ID is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: 500,
      trim: true,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
  },
  {
    timestamps: true,
  }
);

CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);

