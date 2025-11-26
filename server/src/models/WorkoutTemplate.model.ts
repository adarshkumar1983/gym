import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise {
  name: string;
  sets: number;
  reps?: number;
  restSeconds: number;
  mediaUrl?: string;
  notes?: string;
  orderIndex: number;
}

export interface IWorkoutTemplate extends Document {
  gymId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  exercises: IExercise[];
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true
  },
  sets: {
    type: Number,
    required: [true, 'Number of sets is required'],
    min: 1
  },
  reps: {
    type: Number,
    min: 1
  },
  restSeconds: {
    type: Number,
    default: 60,
    min: 0
  },
  mediaUrl: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  },
  orderIndex: {
    type: Number,
    default: 0
  }
}, { _id: true }); // _id: true allows each exercise to have its own ID for referencing

const WorkoutTemplateSchema = new Schema<IWorkoutTemplate>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Gym ID is required']
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    exercises: {
      type: [ExerciseSchema],
      default: []
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Indexes
WorkoutTemplateSchema.index({ gymId: 1 });
WorkoutTemplateSchema.index({ createdBy: 1 });
WorkoutTemplateSchema.index({ isActive: 1 });

export const WorkoutTemplate = mongoose.model<IWorkoutTemplate>('WorkoutTemplate', WorkoutTemplateSchema);

