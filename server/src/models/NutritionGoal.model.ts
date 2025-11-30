/**
 * Nutrition Goal Model
 * User's daily nutrition targets and goals
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface INutritionGoal extends Document {
  userId: mongoose.Types.ObjectId;
  targetCalories: number;
  targetProtein: number; // in grams
  targetCarbs: number; // in grams
  targetFats: number; // in grams
  targetFiber?: number; // in grams
  targetWater?: number; // in ml
  goalType: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'custom';
  currentWeight?: number; // in kg
  targetWeight?: number; // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NutritionGoalSchema = new Schema<INutritionGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true, // One active goal per user
      index: true,
    },
    targetCalories: {
      type: Number,
      required: [true, 'Target calories is required'],
      min: 0,
      max: 10000,
    },
    targetProtein: {
      type: Number,
      required: [true, 'Target protein is required'],
      min: 0,
      max: 1000,
    },
    targetCarbs: {
      type: Number,
      required: [true, 'Target carbs is required'],
      min: 0,
      max: 1000,
    },
    targetFats: {
      type: Number,
      required: [true, 'Target fats is required'],
      min: 0,
      max: 1000,
    },
    targetFiber: {
      type: Number,
      min: 0,
      max: 200,
    },
    targetWater: {
      type: Number,
      default: 2000, // 2L default
      min: 0,
      max: 10000,
    },
    goalType: {
      type: String,
      enum: ['weight-loss', 'muscle-gain', 'maintenance', 'custom'],
      required: true,
    },
    currentWeight: {
      type: Number,
      min: 0,
      max: 500,
    },
    targetWeight: {
      type: Number,
      min: 0,
      max: 500,
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very-active'],
      default: 'moderate',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NutritionGoalSchema.index({ userId: 1, isActive: 1 });

export const NutritionGoal = mongoose.model<INutritionGoal>('NutritionGoal', NutritionGoalSchema);

