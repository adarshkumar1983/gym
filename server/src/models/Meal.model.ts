/**
 * Meal Model
 * Represents a single meal (breakfast, lunch, dinner, snack)
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodItem {
  foodId?: string; // External API food ID
  name: string;
  quantity: number; // in grams or units
  unit: string; // 'g', 'ml', 'piece', 'cup', etc.
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
  fiber?: number; // in grams
  sugar?: number; // in grams
  brand?: string;
  barcode?: string; // For scanned items
}

export interface IMeal extends Document {
  userId: mongoose.Types.ObjectId;
  nutritionLogId: mongoose.Types.ObjectId;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  name?: string; // Custom meal name
  foodItems: IFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalFiber?: number;
  totalSugar?: number;
  consumedAt: Date; // When the meal was consumed
  notes?: string;
  imageUrl?: string; // Photo of the meal
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema = new Schema<IFoodItem>({
  foodId: String,
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0,
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['g', 'ml', 'piece', 'cup', 'tbsp', 'tsp', 'oz', 'lb'],
    default: 'g',
  },
  calories: {
    type: Number,
    required: true,
    min: 0,
  },
  protein: {
    type: Number,
    required: true,
    min: 0,
  },
  carbs: {
    type: Number,
    required: true,
    min: 0,
  },
  fats: {
    type: Number,
    required: true,
    min: 0,
  },
  fiber: {
    type: Number,
    default: 0,
    min: 0,
  },
  sugar: {
    type: Number,
    default: 0,
    min: 0,
  },
  brand: String,
  barcode: String,
}, { _id: false });

const MealSchema = new Schema<IMeal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    nutritionLogId: {
      type: Schema.Types.ObjectId,
      ref: 'NutritionLog',
      required: [true, 'Nutrition log ID is required'],
      index: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout'],
      required: [true, 'Meal type is required'],
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    foodItems: {
      type: [FoodItemSchema],
      default: [],
      validate: {
        validator: (items: IFoodItem[]) => items.length > 0,
        message: 'Meal must have at least one food item',
      },
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
    consumedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

// Calculate totals before saving
MealSchema.pre('save', function(next) {
  if (this.foodItems && this.foodItems.length > 0) {
    this.totalCalories = this.foodItems.reduce((sum, item) => sum + item.calories, 0);
    this.totalProtein = this.foodItems.reduce((sum, item) => sum + item.protein, 0);
    this.totalCarbs = this.foodItems.reduce((sum, item) => sum + item.carbs, 0);
    this.totalFats = this.foodItems.reduce((sum, item) => sum + item.fats, 0);
    this.totalFiber = this.foodItems.reduce((sum, item) => sum + (item.fiber || 0), 0);
    this.totalSugar = this.foodItems.reduce((sum, item) => sum + (item.sugar || 0), 0);
  }
  next();
});

MealSchema.index({ userId: 1, consumedAt: -1 });
MealSchema.index({ nutritionLogId: 1 });

export const Meal = mongoose.model<IMeal>('Meal', MealSchema);

