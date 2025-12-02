/**
 * Health Sync Service
 * Handles syncing health data from Apple Health, Google Fit, and Fitbit
 */

import { Platform } from 'react-native';
import apiClient from './api';
import * as SecureStore from 'expo-secure-store';
import { AppleHealthProvider } from './health-providers/apple-health';
import { GoogleFitProvider } from './health-providers/google-fit';
import { FitbitProvider } from './health-providers/fitbit';
import * as WebBrowser from 'expo-web-browser';

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
   */
  async requestAppleHealthPermissions(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      const isAvailable = await AppleHealthProvider.isAvailable();
      if (!isAvailable) {
        console.warn('HealthKit is not available on this device');
        return false;
      }

      const granted = await AppleHealthProvider.requestPermissions();
      if (granted) {
        // Update sync settings
        await this.updateSyncSettings({ appleHealthEnabled: true });
      }
      return granted;
    } catch (error) {
      console.error('Error requesting Apple Health permissions:', error);
      return false;
    }
  }

  /**
   * Request Google Fit permissions (Android only)
   */
  async requestGoogleFitPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const isAvailable = await GoogleFitProvider.isAvailable();
      if (!isAvailable) {
        console.warn('Google Fit is not available on this device');
        return false;
      }

      const granted = await GoogleFitProvider.requestPermissions();
      if (granted) {
        // Update sync settings
        await this.updateSyncSettings({ googleFitEnabled: true });
      }
      return granted;
    } catch (error) {
      console.error('Error requesting Google Fit permissions:', error);
      return false;
    }
  }

  /**
   * Request Fitbit authorization
   */
  async requestFitbitAuthorization(): Promise<boolean> {
    try {
      const authUrl = await FitbitProvider.getAuthUrl();
      if (!authUrl) {
        console.error('Failed to get Fitbit auth URL');
        return false;
      }

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'gym-mobile://fitbit-callback'
      );

      if (result.type === 'success' && result.url) {
        // Extract code from callback URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        if (code) {
          const success = await FitbitProvider.exchangeCode(code);
          return success;
        }
      }

      return false;
    } catch (error) {
      console.error('Error requesting Fitbit authorization:', error);
      return false;
    }
  }

  /**
   * Sync health data from Apple Health
   */
  async syncAppleHealth(date: Date = new Date()): Promise<HealthResponse> {
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: { message: 'Apple Health is only available on iOS' },
      };
    }

    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const data = await AppleHealthProvider.readAllData(startDate, endDate);
      if (!data) {
        return {
          success: false,
          error: { message: 'No health data available' },
        };
      }

      return await this.syncHealthData({
        date: date.toISOString().split('T')[0],
        source: 'apple-health',
        ...data,
      });
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Failed to sync Apple Health data' },
      };
    }
  }

  /**
   * Sync health data from Google Fit
   */
  async syncGoogleFit(date: Date = new Date()): Promise<HealthResponse> {
    if (Platform.OS !== 'android') {
      return {
        success: false,
        error: { message: 'Google Fit is only available on Android' },
      };
    }

    try {
      const isAuthorized = await GoogleFitProvider.isAuthorized();
      if (!isAuthorized) {
        return {
          success: false,
          error: { message: 'Google Fit not authorized' },
        };
      }

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const data = await GoogleFitProvider.readAllData(startDate, endDate);
      if (!data) {
        return {
          success: false,
          error: { message: 'No health data available' },
        };
      }

      return await this.syncHealthData({
        date: date.toISOString().split('T')[0],
        source: 'google-fit',
        ...data,
      });
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Failed to sync Google Fit data' },
      };
    }
  }

  /**
   * Sync health data from Fitbit
   */
  async syncFitbit(date: Date = new Date()): Promise<HealthResponse> {
    try {
      const isAuthorized = await FitbitProvider.isAuthorized();
      if (!isAuthorized) {
        return {
          success: false,
          error: { message: 'Fitbit not authorized' },
        };
      }

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const data = await FitbitProvider.readAllData(startDate, endDate);
      if (!data) {
        return {
          success: false,
          error: { message: 'No health data available' },
        };
      }

      return await this.syncHealthData({
        date: date.toISOString().split('T')[0],
        source: 'fitbit',
        ...data,
      });
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Failed to sync Fitbit data' },
      };
    }
  }

  /**
   * Auto-sync all enabled health sources
   */
  async autoSync(date: Date = new Date()): Promise<HealthResponse[]> {
    const results: HealthResponse[] = [];
    const settings = await this.getSyncSettings();

    if (settings.success && settings.data?.settings) {
      const { settings: syncSettings } = settings.data;

      if (syncSettings.appleHealthEnabled && Platform.OS === 'ios') {
        results.push(await this.syncAppleHealth(date));
      }

      if (syncSettings.googleFitEnabled && Platform.OS === 'android') {
        results.push(await this.syncGoogleFit(date));
      }

      if (syncSettings.fitbitEnabled) {
        results.push(await this.syncFitbit(date));
      }
    }

    return results;
  }

  /**
   * Read steps from Apple Health
   */
  async readAppleHealthSteps(startDate: Date, endDate: Date): Promise<number | null> {
    return AppleHealthProvider.readSteps(startDate, endDate);
  }

  /**
   * Read heart rate from Apple Health
   */
  async readAppleHealthHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    const heartRate = await AppleHealthProvider.readHeartRate(startDate, endDate);
    return heartRate?.average || null;
  }

  /**
   * Read steps from Google Fit
   */
  async readGoogleFitSteps(startDate: Date, endDate: Date): Promise<number | null> {
    return GoogleFitProvider.readSteps(startDate, endDate);
  }

  /**
   * Read heart rate from Google Fit
   */
  async readGoogleFitHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    const heartRate = await GoogleFitProvider.readHeartRate(startDate, endDate);
    return heartRate?.average || null;
  }
}

export const healthSyncAPI = new HealthSyncService();

