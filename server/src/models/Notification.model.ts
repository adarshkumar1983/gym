import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  toUserId: mongoose.Types.ObjectId;
  type: string; // 'workout_reminder', 'payment_due', 'workout_assigned', etc.
  title: string;
  body: string;
  payload: Record<string, any>; // Additional data (workout_id, etc.)
  status: 'pending' | 'sent' | 'read' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    type: {
      type: String,
      required: [true, 'Notification type is required']
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'read', 'failed'],
      default: 'pending'
    },
    scheduledAt: {
      type: Date
    },
    sentAt: {
      type: Date
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
NotificationSchema.index({ toUserId: 1, status: 1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ scheduledAt: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

