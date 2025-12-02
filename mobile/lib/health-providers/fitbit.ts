/**
 * Fitbit Integration
 * Works on both iOS and Android
 * Requires OAuth setup and @fitbit/api-client package
 */

import { Platform } from 'react-native';
import apiClient from '../api';
import * as SecureStore from 'expo-secure-store';

const FITBIT_TOKEN_KEY = 'fitbit_access_token';
const FITBIT_REFRESH_TOKEN_KEY = 'fitbit_refresh_token';
const FITBIT_USER_ID_KEY = 'fitbit_user_id';

interface FitbitTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}

interface FitbitActivityData {
  'activities-steps': Array<{
    dateTime: string;
    value: string;
  }>;
  'activities-heart': Array<{
    dateTime: string;
    value: {
      restingHeartRate?: number;
      heartRateZones?: Array<{
        caloriesOut?: number;
      }>;
    };
  }>;
  'activities-calories': Array<{
    dateTime: string;
    value: string;
  }>;
  'activities-distance': Array<{
    dateTime: string;
    value: string;
  }>;
}

export const FitbitProvider = {
  /**
   * Get Fitbit OAuth URL from backend
   */
  async getAuthUrl(): Promise<string | null> {
    try {
      const response = await apiClient.get('/api/health/fitbit/auth-url', {
        withCredentials: true,
      });

      if (response.data?.success && response.data?.data?.authUrl) {
        return response.data.data.authUrl;
      }

      return null;
    } catch (error) {
      console.error('Error getting Fitbit auth URL:', error);
      return null;
    }
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<boolean> {
    try {
      const response = await apiClient.post(
        '/api/health/fitbit/callback',
        { code },
        { withCredentials: true }
      );

      if (response.data?.success && response.data?.data?.tokens) {
        const { access_token, refresh_token, user_id } = response.data.data.tokens;

        await SecureStore.setItemAsync(FITBIT_TOKEN_KEY, access_token);
        if (refresh_token) {
          await SecureStore.setItemAsync(FITBIT_REFRESH_TOKEN_KEY, refresh_token);
        }
        if (user_id) {
          await SecureStore.setItemAsync(FITBIT_USER_ID_KEY, user_id);
        }

        // Update sync settings
        await apiClient.put(
          '/api/health/settings',
          {
            fitbitEnabled: true,
            fitbitAccessToken: access_token,
            fitbitRefreshToken: refresh_token,
            fitbitUserId: user_id,
          },
          { withCredentials: true }
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error exchanging Fitbit code:', error);
      return false;
    }
  },

  /**
   * Check if Fitbit is authorized
   */
  async isAuthorized(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(FITBIT_TOKEN_KEY);
      return token !== null;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(FITBIT_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(FITBIT_REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const response = await apiClient.post(
        '/api/health/fitbit/refresh',
        { refresh_token: refreshToken },
        { withCredentials: true }
      );

      if (response.data?.success && response.data?.data?.tokens) {
        const { access_token, refresh_token } = response.data.data.tokens;

        await SecureStore.setItemAsync(FITBIT_TOKEN_KEY, access_token);
        if (refresh_token) {
          await SecureStore.setItemAsync(FITBIT_REFRESH_TOKEN_KEY, refresh_token);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing Fitbit token:', error);
      return false;
    }
  },

  /**
   * Disconnect from Fitbit
   */
  async disconnect(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(FITBIT_TOKEN_KEY);
      await SecureStore.deleteItemAsync(FITBIT_REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(FITBIT_USER_ID_KEY);

      await apiClient.put(
        '/api/health/settings',
        { fitbitEnabled: false },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Error disconnecting from Fitbit:', error);
    }
  },

  /**
   * Read steps for date range
   */
  async readSteps(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await apiClient.get(
        `https://api.fitbit.com/1/user/-/activities/steps/date/${startDateStr}/${endDateStr}.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.['activities-steps']) {
        const totalSteps = response.data['activities-steps'].reduce(
          (sum: number, entry: any) => sum + parseInt(entry.value || '0', 10),
          0
        );
        return totalSteps;
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.readSteps(startDate, endDate);
        }
      }
      console.error('Error reading steps from Fitbit:', error);
      return null;
    }
  },

  /**
   * Read heart rate for date range
   */
  async readHeartRate(startDate: Date, endDate: Date): Promise<{
    average?: number;
    resting?: number;
  } | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await apiClient.get(
        `https://api.fitbit.com/1/user/-/activities/heart/date/${startDateStr}/${endDateStr}.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.['activities-heart']) {
        const heartData = response.data['activities-heart'];
        const restingRates = heartData
          .map((entry: any) => entry.value?.restingHeartRate)
          .filter((rate: any) => rate !== undefined);

        const resting = restingRates.length > 0
          ? restingRates.reduce((sum: number, rate: number) => sum + rate, 0) / restingRates.length
          : undefined;

        return resting ? { resting: Math.round(resting) } : null;
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.readHeartRate(startDate, endDate);
        }
      }
      console.error('Error reading heart rate from Fitbit:', error);
      return null;
    }
  },

  /**
   * Read active calories
   */
  async readActiveCalories(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await apiClient.get(
        `https://api.fitbit.com/1/user/-/activities/calories/date/${startDateStr}/${endDateStr}.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.['activities-calories']) {
        const totalCalories = response.data['activities-calories'].reduce(
          (sum: number, entry: any) => sum + parseInt(entry.value || '0', 10),
          0
        );
        return totalCalories;
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.readActiveCalories(startDate, endDate);
        }
      }
      console.error('Error reading active calories from Fitbit:', error);
      return null;
    }
  },

  /**
   * Read distance
   */
  async readDistance(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await apiClient.get(
        `https://api.fitbit.com/1/user/-/activities/distance/date/${startDateStr}/${endDateStr}.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.['activities-distance']) {
        // Fitbit returns distance in kilometers, convert to meters
        const totalDistanceKm = response.data['activities-distance'].reduce(
          (sum: number, entry: any) => sum + parseFloat(entry.value || '0'),
          0
        );
        return Math.round(totalDistanceKm * 1000); // Convert to meters
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.readDistance(startDate, endDate);
        }
      }
      console.error('Error reading distance from Fitbit:', error);
      return null;
    }
  },

  /**
   * Read all health data for a date range
   */
  async readAllData(startDate: Date, endDate: Date): Promise<{
    steps?: number;
    distanceMeters?: number;
    restingHeartRate?: number;
    activeCalories?: number;
  } | null> {
    try {
      const [steps, distance, heartRate, calories] = await Promise.all([
        this.readSteps(startDate, endDate),
        this.readDistance(startDate, endDate),
        this.readHeartRate(startDate, endDate),
        this.readActiveCalories(startDate, endDate),
      ]);

      const result: any = {};
      if (steps !== null) result.steps = steps;
      if (distance !== null) result.distanceMeters = distance;
      if (calories !== null) result.activeCalories = calories;
      if (heartRate?.resting !== undefined) result.restingHeartRate = heartRate.resting;

      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      console.error('Error reading all health data from Fitbit:', error);
      return null;
    }
  },
};

