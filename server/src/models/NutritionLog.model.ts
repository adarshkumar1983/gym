/**
 * Nutrition Log Model
 * Tracks daily nutrition intake for users
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface INutritionLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date; // Date of the log entry
  totalCalories: number;
  totalProtein: number; // in grams
  totalCarbs: number; // in grams
  totalFats: number; // in grams
  totalFiber?: number; // in grams
  totalSugar?: number; // in grams
  meals: mongoose.Types.ObjectId[]; // References to Meal documents
  waterIntake?: number; // in ml
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NutritionLogSchema = new Schema<INutritionLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    totalCalories: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalProtein: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCarbs: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalFats: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalFiber: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSugar: {
      type: Number,
      default: 0,
      min: 0,
    },
    meals: [{
      type: Schema.Types.ObjectId,
      ref: 'Meal',
    }],
    waterIntake: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
NutritionLogSchema.index({ userId: 1, date: -1 }, { unique: true });
NutritionLogSchema.index({ userId: 1, createdAt: -1 });

// Virtual for calculating remaining calories (if goals are set)
NutritionLogSchema.virtual('remainingCalories').get(function() {
  // This would be calculated based on user goals
  return 0;
});

export const NutritionLog = mongoose.model<INutritionLog>('NutritionLog', NutritionLogSchema);

