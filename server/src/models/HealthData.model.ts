/**
 * Health Data Model
 * Stores synced health data from Apple Health, Google Fit, Fitbit, etc.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthData extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date; // Date of the health data entry
  source: 'apple-health' | 'google-fit' | 'fitbit' | 'manual';
  
  // Steps data
  steps?: number;
  distanceMeters?: number; // Distance walked/run in meters
  
  // Heart rate data
  restingHeartRate?: number; // bpm
  averageHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  heartRateData?: Array<{
    timestamp: Date;
    bpm: number;
  }>;
  
  // Workout data
  activeCalories?: number; // kcal
  totalCalories?: number; // kcal
  workoutDuration?: number; // minutes
  workoutType?: string; // e.g., 'running', 'cycling', 'strength-training'
  
  // Activity data
  activeMinutes?: number; // minutes of moderate to vigorous activity
  sedentaryMinutes?: number; // minutes of sedentary time
  
  // Sleep data (optional)
  sleepHours?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  
  // Weight/Body metrics (optional)
  weight?: number; // kg
  bodyFatPercentage?: number;
  
  // Metadata
  syncedAt: Date;
  rawData?: any; // Store raw API response for debugging
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const HealthDataSchema = new Schema<IHealthData>(
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
    source: {
      type: String,
      enum: ['apple-health', 'google-fit', 'fitbit', 'manual'],
      required: [true, 'Source is required'],
      index: true,
    },
    steps: {
      type: Number,
      min: 0,
    },
    distanceMeters: {
      type: Number,
      min: 0,
    },
    restingHeartRate: {
      type: Number,
      min: 0,
      max: 300,
    },
    averageHeartRate: {
      type: Number,
      min: 0,
      max: 300,
    },
    maxHeartRate: {
      type: Number,
      min: 0,
      max: 300,
    },
    heartRateData: [{
      timestamp: {
        type: Date,
        required: true,
      },
      bpm: {
        type: Number,
        required: true,
        min: 0,
        max: 300,
      },
    }],
    activeCalories: {
      type: Number,
      min: 0,
    },
    totalCalories: {
      type: Number,
      min: 0,
    },
    workoutDuration: {
      type: Number,
      min: 0,
    },
    workoutType: {
      type: String,
      trim: true,
    },
    activeMinutes: {
      type: Number,
      min: 0,
    },
    sedentaryMinutes: {
      type: Number,
      min: 0,
    },
    sleepHours: {
      type: Number,
      min: 0,
      max: 24,
    },
    sleepQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
    },
    weight: {
      type: Number,
      min: 0,
    },
    bodyFatPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
    rawData: {
      type: Schema.Types.Mixed,
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

// Compound indexes for efficient queries
HealthDataSchema.index({ userId: 1, date: -1 });
HealthDataSchema.index({ userId: 1, source: 1, date: -1 });
HealthDataSchema.index({ userId: 1, syncedAt: -1 });

// Prevent duplicate entries for same user, date, and source
HealthDataSchema.index({ userId: 1, date: 1, source: 1 }, { unique: true });

export const HealthData = mongoose.model<IHealthData>('HealthData', HealthDataSchema);

