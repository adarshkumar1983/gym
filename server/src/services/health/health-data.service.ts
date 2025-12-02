/**
 * Health Data Service
 * Handles CRUD operations for health data
 */

import { HealthData, IHealthData } from '../../models/HealthData.model';
import { HealthSyncSettings } from '../../models/HealthSyncSettings.model';
import mongoose from 'mongoose';

export interface HealthDataInput {
  userId: string;
  date: Date;
  source: 'apple-health' | 'google-fit' | 'fitbit' | 'manual';
  steps?: number;
  distanceMeters?: number;
  restingHeartRate?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  heartRateData?: Array<{ timestamp: Date; bpm: number }>;
  activeCalories?: number;
  totalCalories?: number;
  workoutDuration?: number;
  workoutType?: string;
  activeMinutes?: number;
  sedentaryMinutes?: number;
  sleepHours?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  weight?: number;
  bodyFatPercentage?: number;
  notes?: string;
  rawData?: any;
}

export class HealthDataService {
  /**
   * Create or update health data for a user
   */
  static async upsertHealthData(input: HealthDataInput): Promise<IHealthData> {
    const { userId, date, source, ...data } = input;

    const healthData = await HealthData.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        date: new Date(date),
        source,
      },
      {
        ...data,
        syncedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Update last sync time in settings
    await HealthSyncSettings.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { lastSyncAt: new Date() },
      { upsert: true }
    );

    return healthData;
  }

  /**
   * Get health data for a user within a date range
   */
  static async getHealthData(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    source?: string
  ): Promise<IHealthData[]> {
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (source) {
      query.source = source;
    }

    return HealthData.find(query).sort({ date: -1 });
  }

  /**
   * Get today's health data
   */
  static async getTodayHealthData(userId: string): Promise<IHealthData | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return HealthData.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ syncedAt: -1 });
  }

  /**
   * Get aggregated health stats
   */
  static async getHealthStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSteps: number;
    totalDistance: number;
    avgRestingHeartRate: number;
    totalActiveCalories: number;
    totalWorkoutDuration: number;
    avgActiveMinutes: number;
  }> {
    const data = await HealthData.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const stats = {
      totalSteps: 0,
      totalDistance: 0,
      avgRestingHeartRate: 0,
      totalActiveCalories: 0,
      totalWorkoutDuration: 0,
      avgActiveMinutes: 0,
    };

    let restingHeartRateCount = 0;
    let activeMinutesCount = 0;

    data.forEach((entry) => {
      if (entry.steps) stats.totalSteps += entry.steps;
      if (entry.distanceMeters) stats.totalDistance += entry.distanceMeters;
      if (entry.restingHeartRate) {
        stats.avgRestingHeartRate += entry.restingHeartRate;
        restingHeartRateCount++;
      }
      if (entry.activeCalories) stats.totalActiveCalories += entry.activeCalories;
      if (entry.workoutDuration) stats.totalWorkoutDuration += entry.workoutDuration;
      if (entry.activeMinutes) {
        stats.avgActiveMinutes += entry.activeMinutes;
        activeMinutesCount++;
      }
    });

    if (restingHeartRateCount > 0) {
      stats.avgRestingHeartRate = stats.avgRestingHeartRate / restingHeartRateCount;
    }
    if (activeMinutesCount > 0) {
      stats.avgActiveMinutes = stats.avgActiveMinutes / activeMinutesCount;
    }

    return stats;
  }

  /**
   * Delete health data
   */
  static async deleteHealthData(userId: string, healthDataId: string): Promise<boolean> {
    const result = await HealthData.deleteOne({
      _id: new mongoose.Types.ObjectId(healthDataId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  }
}

