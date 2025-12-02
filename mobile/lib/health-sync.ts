/**
 * Health Sync Service
 * Handles syncing health data from Apple Health, Google Fit, and Fitbit
 */

import { Platform } from 'react-native';
import apiClient from './api';
import * as SecureStore from 'expo-secure-store';

export interface HealthData {
  date: string;
  source: 'apple-health' | 'google-fit' | 'fitbit' | 'manual';
  steps?: number;
  distanceMeters?: number;
  restingHeartRate?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  heartRateData?: Array<{ timestamp: string; bpm: number }>;
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
}

export interface HealthSyncSettings {
  appleHealthEnabled: boolean;
  googleFitEnabled: boolean;
  fitbitEnabled: boolean;
  autoSync: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  syncSteps: boolean;
  syncHeartRate: boolean;
  syncWorkouts: boolean;
  syncSleep: boolean;
  syncWeight: boolean;
  lastSyncAt?: string;
}

export interface HealthStats {
  totalSteps: number;
  totalDistance: number;
  avgRestingHeartRate: number;
  totalActiveCalories: number;
  totalWorkoutDuration: number;
  avgActiveMinutes: number;
}

export interface HealthResponse {
  success: boolean;
  data?: {
    healthData?: HealthData | HealthData[];
    settings?: HealthSyncSettings;
    stats?: HealthStats;
  };
  error?: {
    message: string;
  };
}

class HealthSyncService {
  /**
   * Sync health data to server
   */
  async syncHealthData(data: HealthData): Promise<HealthResponse> {
    try {
      const response = await apiClient.post('/api/health/sync', data, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            healthData: responseData.data.healthData,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to sync health data' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to sync health data',
        },
      };
    }
  }

  /**
   * Get today's health data
   */
  async getTodayHealthData(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get('/api/health/today', {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            healthData: responseData.data.healthData,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get health data' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get health data',
        },
      };
    }
  }

  /**
   * Get health data within date range
   */
  async getHealthData(
    startDate?: string,
    endDate?: string,
    source?: string
  ): Promise<HealthResponse> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (source) params.source = source;

      const response = await apiClient.get('/api/health/data', {
        params,
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            healthData: responseData.data.healthData,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get health data' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get health data',
        },
      };
    }
  }

  /**
   * Get aggregated health stats
   */
  async getHealthStats(startDate?: string, endDate?: string): Promise<HealthResponse> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get('/api/health/stats', {
        params,
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            stats: responseData.data.stats,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get health stats' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get health stats',
        },
      };
    }
  }

  /**
   * Get sync settings
   */
  async getSyncSettings(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get('/api/health/settings', {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            settings: responseData.data.settings,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get sync settings' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get sync settings',
        },
      };
    }
  }

  /**
   * Update sync settings
   */
  async updateSyncSettings(settings: Partial<HealthSyncSettings>): Promise<HealthResponse> {
    try {
      const response = await apiClient.put('/api/health/settings', settings, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            settings: responseData.data.settings,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to update sync settings' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to update sync settings',
        },
      };
    }
  }

  /**
   * Request Apple Health permissions (iOS only)
   * Note: Requires expo-health package
   */
  async requestAppleHealthPermissions(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    // TODO: Implement with expo-health or react-native-health
    // This requires additional setup and native modules
    console.log('Apple Health permissions requested');
    return false;
  }

  /**
   * Request Google Fit permissions (Android only)
   * Note: Requires Google Fit API setup
   */
  async requestGoogleFitPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    // TODO: Implement with Google Fit API
    // This requires OAuth setup and Google Fit SDK
    console.log('Google Fit permissions requested');
    return false;
  }

  /**
   * Read steps from Apple Health
   */
  async readAppleHealthSteps(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    // TODO: Implement with expo-health or react-native-health
    return null;
  }

  /**
   * Read heart rate from Apple Health
   */
  async readAppleHealthHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    // TODO: Implement with expo-health or react-native-health
    return null;
  }

  /**
   * Read steps from Google Fit
   */
  async readGoogleFitSteps(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    // TODO: Implement with Google Fit API
    return null;
  }

  /**
   * Read heart rate from Google Fit
   */
  async readGoogleFitHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    // TODO: Implement with Google Fit API
    return null;
  }
}

export const healthSyncAPI = new HealthSyncService();

