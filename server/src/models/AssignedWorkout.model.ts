import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignedWorkout extends Document {
  userId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  recurrenceRef?: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssignedWorkoutSchema = new Schema<IAssignedWorkout>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkoutTemplate',
      required: [true, 'Template ID is required']
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date is required']
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending'
    },
    recurrenceRef: {
      type: Schema.Types.ObjectId,
      ref: 'RecurrenceRule'
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
AssignedWorkoutSchema.index({ userId: 1, scheduledAt: 1 });
AssignedWorkoutSchema.index({ templateId: 1 });
AssignedWorkoutSchema.index({ status: 1 });
AssignedWorkoutSchema.index({ scheduledAt: 1 });

export const AssignedWorkout = mongoose.model<IAssignedWorkout>('AssignedWorkout', AssignedWorkoutSchema);

