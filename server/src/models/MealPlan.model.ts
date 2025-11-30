/**
 * Meal Plan Model
 * Pre-built meal plans that users can purchase or follow
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IMealPlanDay {
  day: number; // Day 1, 2, 3, etc.
  meals: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    name: string;
    description?: string;
    foodItems: Array<{
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    }>;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface IMealPlan extends Document {
  gymId?: mongoose.Types.ObjectId; // Optional: gym-specific plans
  createdBy: mongoose.Types.ObjectId; // Creator (admin/trainer)
  name: string;
  description: string;
  category: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'keto' | 'vegan' | 'paleo' | 'custom';
  duration: number; // Number of days (7, 14, 30, etc.)
  targetCalories: number; // Daily calorie target
  targetProtein: number; // Daily protein target (grams)
  targetCarbs: number; // Daily carbs target (grams)
  targetFats: number; // Daily fats target (grams)
  days: IMealPlanDay[];
  isPremium: boolean; // Requires subscription
  price?: number; // One-time purchase price
  imageUrl?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  purchaseCount: number; // Track popularity
  rating?: number; // Average rating (1-5)
  createdAt: Date;
  updatedAt: Date;
}

const MealPlanDayMealSchema = new Schema({
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  foodItems: [{
    name: String,
    quantity: Number,
    unit: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
  }],
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFats: Number,
}, { _id: false });

const MealPlanDaySchema = new Schema({
  day: {
    type: Number,
    required: true,
    min: 1,
  },
  meals: {
    type: [MealPlanDayMealSchema],
    default: [],
  },
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFats: Number,
}, { _id: false });

const MealPlanSchema = new Schema<IMealPlan>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Meal plan name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['weight-loss', 'muscle-gain', 'maintenance', 'keto', 'vegan', 'paleo', 'custom'],
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
    },
    targetCalories: {
      type: Number,
      required: true,
      min: 0,
    },
    targetProtein: {
      type: Number,
      required: true,
      min: 0,
    },
    targetCarbs: {
      type: Number,
      required: true,
      min: 0,
    },
    targetFats: {
      type: Number,
      required: true,
      min: 0,
    },
    days: {
      type: [MealPlanDaySchema],
      required: true,
      validate: {
        validator: (days: IMealPlanDay[]) => days.length > 0,
        message: 'Meal plan must have at least one day',
      },
    },
    isPremium: {
      type: Boolean,
      default: false,
      index: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    imageUrl: String,
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

MealPlanSchema.index({ isPremium: 1, isActive: 1 });
MealPlanSchema.index({ category: 1, isActive: 1 });
MealPlanSchema.index({ createdAt: -1 });

export const MealPlan = mongoose.model<IMealPlan>('MealPlan', MealPlanSchema);

