/**
 * Health Sync Settings Service
 * Manages user health sync preferences and OAuth tokens
 */

import { HealthSyncSettings, IHealthSyncSettings } from '../../models/HealthSyncSettings.model';
import mongoose from 'mongoose';

export interface HealthSyncSettingsInput {
  userId: string;
  appleHealthEnabled?: boolean;
  googleFitEnabled?: boolean;
  fitbitEnabled?: boolean;
  autoSync?: boolean;
  syncFrequency?: 'realtime' | 'hourly' | 'daily';
  syncSteps?: boolean;
  syncHeartRate?: boolean;
  syncWorkouts?: boolean;
  syncSleep?: boolean;
  syncWeight?: boolean;
  appleHealthToken?: string;
  googleFitToken?: string;
  googleFitRefreshToken?: string;
  fitbitAccessToken?: string;
  fitbitRefreshToken?: string;
  fitbitUserId?: string;
}

export class HealthSyncSettingsService {
  /**
   * Get or create sync settings for a user
   */
  static async getSettings(userId: string): Promise<IHealthSyncSettings> {
    let settings = await HealthSyncSettings.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!settings) {
      settings = await HealthSyncSettings.create({
        userId: new mongoose.Types.ObjectId(userId),
      });
    }

    return settings;
  }

  /**
   * Update sync settings
   */
  static async updateSettings(
    userId: string,
    input: HealthSyncSettingsInput
  ): Promise<IHealthSyncSettings> {
    const { userId: _, ...updateData } = input;

    const settings = await HealthSyncSettings.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      updateData,
      { upsert: true, new: true }
    );

    return settings;
  }

  /**
   * Enable/disable a sync source
   */
  static async toggleSource(
    userId: string,
    source: 'apple-health' | 'google-fit' | 'fitbit',
    enabled: boolean
  ): Promise<IHealthSyncSettings> {
    const updateField =
      source === 'apple-health'
        ? 'appleHealthEnabled'
        : source === 'google-fit'
        ? 'googleFitEnabled'
        : 'fitbitEnabled';

    const settings = await HealthSyncSettings.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { [updateField]: enabled },
      { upsert: true, new: true }
    );

    return settings;
  }

  /**
   * Update OAuth tokens
   */
  static async updateTokens(
    userId: string,
    source: 'google-fit' | 'fitbit',
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      fitbitUserId?: string;
    }
  ): Promise<IHealthSyncSettings> {
    const updateData: any = {};

    if (source === 'google-fit') {
      if (tokens.accessToken) updateData.googleFitToken = tokens.accessToken;
      if (tokens.refreshToken) updateData.googleFitRefreshToken = tokens.refreshToken;
    } else if (source === 'fitbit') {
      if (tokens.accessToken) updateData.fitbitAccessToken = tokens.accessToken;
      if (tokens.refreshToken) updateData.fitbitRefreshToken = tokens.refreshToken;
      if (tokens.fitbitUserId) updateData.fitbitUserId = tokens.fitbitUserId;
    }

    const settings = await HealthSyncSettings.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      updateData,
      { upsert: true, new: true }
    );

    return settings;
  }
}

