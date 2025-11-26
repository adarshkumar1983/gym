import mongoose, { Document, Schema } from 'mongoose';

export interface IExerciseLog extends Document {
  assignedWorkoutId: mongoose.Types.ObjectId;
  exerciseId: mongoose.Types.ObjectId;
  setsCompleted: number;
  repsData: number[]; // Array of reps per set [10, 10, 8]
  weightKg?: number; // Optional weight if applicable
  notes?: string;
  loggedAt: Date;
  createdAt: Date;
}

const ExerciseLogSchema = new Schema<IExerciseLog>(
  {
    assignedWorkoutId: {
      type: Schema.Types.ObjectId,
      ref: 'AssignedWorkout',
      required: [true, 'Assigned workout ID is required']
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: 'Exercise',
      required: [true, 'Exercise ID is required']
    },
    setsCompleted: {
      type: Number,
      required: [true, 'Sets completed is required'],
      min: 0
    },
    repsData: {
      type: [Number],
      default: []
    },
    weightKg: {
      type: Number,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    },
    loggedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes
ExerciseLogSchema.index({ assignedWorkoutId: 1 });
ExerciseLogSchema.index({ exerciseId: 1 });
ExerciseLogSchema.index({ loggedAt: -1 });

export const ExerciseLog = mongoose.model<IExerciseLog>('ExerciseLog', ExerciseLogSchema);

