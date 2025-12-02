/**
 * Health Sync Settings Model
 * Stores user preferences for health data syncing
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthSyncSettings extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Sync sources
  appleHealthEnabled: boolean;
  googleFitEnabled: boolean;
  fitbitEnabled: boolean;
  
  // Sync preferences
  autoSync: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily'; // How often to sync
  lastSyncAt?: Date;
  
  // Data types to sync
  syncSteps: boolean;
  syncHeartRate: boolean;
  syncWorkouts: boolean;
  syncSleep: boolean;
  syncWeight: boolean;
  
  // OAuth tokens (encrypted)
  appleHealthToken?: string; // Encrypted
  googleFitToken?: string; // Encrypted
  googleFitRefreshToken?: string; // Encrypted
  fitbitAccessToken?: string; // Encrypted
  fitbitRefreshToken?: string; // Encrypted
  
  // Fitbit specific
  fitbitUserId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const HealthSyncSettingsSchema = new Schema<IHealthSyncSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    appleHealthEnabled: {
      type: Boolean,
      default: false,
    },
    googleFitEnabled: {
      type: Boolean,
      default: false,
    },
    fitbitEnabled: {
      type: Boolean,
      default: false,
    },
    autoSync: {
      type: Boolean,
      default: true,
    },
    syncFrequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily'],
      default: 'hourly',
    },
    lastSyncAt: {
      type: Date,
    },
    syncSteps: {
      type: Boolean,
      default: true,
    },
    syncHeartRate: {
      type: Boolean,
      default: true,
    },
    syncWorkouts: {
      type: Boolean,
      default: true,
    },
    syncSleep: {
      type: Boolean,
      default: false,
    },
    syncWeight: {
      type: Boolean,
      default: false,
    },
    appleHealthToken: {
      type: String,
      select: false, // Don't return by default for security
    },
    googleFitToken: {
      type: String,
      select: false,
    },
    googleFitRefreshToken: {
      type: String,
      select: false,
    },
    fitbitAccessToken: {
      type: String,
      select: false,
    },
    fitbitRefreshToken: {
      type: String,
      select: false,
    },
    fitbitUserId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const HealthSyncSettings = mongoose.model<IHealthSyncSettings>('HealthSyncSettings', HealthSyncSettingsSchema);

