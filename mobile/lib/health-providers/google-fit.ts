/**
 * Google Fit Integration
 * Android only - requires react-native-google-fit package
 */

import { Platform } from 'react-native';

// Type definitions for react-native-google-fit
interface GoogleFit {
  authorize(options: {
    scopes: string[];
  }): Promise<boolean>;
  isAuthorized(): Promise<boolean>;
  disconnect(): Promise<void>;
  getDailyStepCountSamples(startDate: Date, endDate: Date): Promise<Array<{
    steps: number;
    date: string;
  }>>;
  getHeartRateSamples(startDate: Date, endDate: Date): Promise<Array<{
    value: number;
    startDate: string;
    endDate: string;
  }>>;
  getDailyCalorieSamples(startDate: Date, endDate: Date): Promise<Array<{
    calorie: number;
    date: string;
  }>>;
  getDailyDistanceSamples(startDate: Date, endDate: Date): Promise<Array<{
    distance: number;
    date: string;
  }>>;
}

let GoogleFitModule: GoogleFit | null = null;

// Lazy load the module
const getGoogleFit = async (): Promise<GoogleFit | null> => {
  if (Platform.OS !== 'android') {
    return null;
  }

  if (GoogleFitModule) {
    return GoogleFitModule;
  }

  try {
    const RNGoogleFit = require('react-native-google-fit');
    GoogleFitModule = RNGoogleFit.default || RNGoogleFit;
    return GoogleFitModule;
  } catch (error) {
    console.warn('react-native-google-fit not available:', error);
    return null;
  }
};

export const GoogleFitProvider = {
  /**
   * Check if Google Fit is available
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const googleFit = await getGoogleFit();
      return googleFit !== null;
    } catch (error) {
      console.error('Error checking Google Fit availability:', error);
      return false;
    }
  },

  /**
   * Request Google Fit authorization
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const googleFit = await getGoogleFit();
      if (!googleFit) return false;

      const authorized = await googleFit.authorize({
        scopes: [
          Scopes.FITNESS_ACTIVITY_READ,
          Scopes.FITNESS_HEART_RATE_READ,
          Scopes.FITNESS_LOCATION_READ,
        ],
      });

      return authorized;
    } catch (error) {
      console.error('Error requesting Google Fit permissions:', error);
      return false;
    }
  },

  /**
   * Check if already authorized
   */
  async isAuthorized(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const googleFit = await getGoogleFit();
      if (!googleFit) return false;

      return await googleFit.isAuthorized();
    } catch (error) {
      console.error('Error checking Google Fit authorization:', error);
      return false;
    }
  },

  /**
   * Disconnect from Google Fit
   */
  async disconnect(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      const googleFit = await getGoogleFit();
      if (googleFit) {
        await googleFit.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting from Google Fit:', error);
    }
  },

  /**
   * Read steps for date range
   */
  async readSteps(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    try {
      const googleFit = await getGoogleFit();
      if (!googleFit) return null;

      const samples = await googleFit.getDailyStepCountSamples(startDate, endDate);
      const totalSteps = samples.reduce((sum, sample) => sum + sample.steps, 0);
      return totalSteps;
    } catch (error) {
      console.error('Error reading steps from Google Fit:', error);
      return null;
    }
  },

  /**
   * Read heart rate for date range
   */
  async readHeartRate(startDate: Date, endDate: Date): Promise<{
    average?: number;
    samples?: Array<{ timestamp: string; bpm: number }>;
  } | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    try {
      const googleFit = await getGoogleFit();
      if (!googleFit) return null;

      const samples = await googleFit.getHeartRateSamples(startDate, endDate);

      if (samples.length === 0) {
        return null;
      }

      const values = samples.map(s => s.value);
      const average = values.reduce((a, b) => a + b, 0) / values.length;

      return {
        average: Math.round(average),
        samples: samples.map(s => ({
          timestamp: s.startDate,
          bpm: Math.round(s.value),
        })),
      };
    } catch (error) {
      console.error('Error reading heart rate from Google Fit:', error);
      return null;
    }
  },

  /**
   * Read active calories
   */
  async readActiveCalories(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    try {
      const googleFit = await getGoogleFit();
      if (!googleFit) return null;

      const samples = await googleFit.getDailyCalorieSamples(startDate, endDate);
      const totalCalories = samples.reduce((sum, sample) => sum + sample.calorie, 0);
      return Math.round(totalCalories);
    } catch (error) {
      console.error('Error reading active calories from Google Fit:', error);
      return null;
    }
  },

  /**
   * Read distance
   */
  async readDistance(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    try {
      const googleFit = await getGoogleFit();
      if (!googleFit) return null;

      const samples = await googleFit.getDailyDistanceSamples(startDate, endDate);
      // Google Fit returns distance in meters
      const totalDistance = samples.reduce((sum, sample) => sum + sample.distance, 0);
      return Math.round(totalDistance);
    } catch (error) {
      console.error('Error reading distance from Google Fit:', error);
      return null;
    }
  },

  /**
   * Read all health data for a date range
   */
  async readAllData(startDate: Date, endDate: Date): Promise<{
    steps?: number;
    distanceMeters?: number;
    averageHeartRate?: number;
    heartRateData?: Array<{ timestamp: string; bpm: number }>;
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
      if (heartRate) {
        if (heartRate.average !== undefined) result.averageHeartRate = heartRate.average;
        if (heartRate.samples) result.heartRateData = heartRate.samples;
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      console.error('Error reading all health data:', error);
      return null;
    }
  },
};

// Google Fit API Scopes
const Scopes = {
  FITNESS_ACTIVITY_READ: 'https://www.googleapis.com/auth/fitness.activity.read',
  FITNESS_HEART_RATE_READ: 'https://www.googleapis.com/auth/fitness.heart_rate.read',
  FITNESS_LOCATION_READ: 'https://www.googleapis.com/auth/fitness.location.read',
};

