/**
 * Apple HealthKit Integration
 * iOS only - requires react-native-health package
 */

import { Platform } from 'react-native';

// Type definitions for react-native-health
interface HealthKit {
  isAvailable(): Promise<boolean>;
  requestAuthorization(permissions: {
    read?: string[];
    write?: string[];
  }): Promise<boolean>;
  getStepCount(startDate: Date, endDate: Date): Promise<number>;
  getHeartRateSamples(startDate: Date, endDate: Date): Promise<Array<{
    value: number;
    startDate: string;
    endDate: string;
  }>>;
  getActiveEnergyBurned(startDate: Date, endDate: Date): Promise<number>;
  getDistanceWalkingRunning(startDate: Date, endDate: Date): Promise<number>;
  getRestingHeartRate(startDate: Date, endDate: Date): Promise<number>;
}

let HealthKitModule: HealthKit | null = null;

// Lazy load the module
const getHealthKit = async (): Promise<HealthKit | null> => {
  if (Platform.OS !== 'ios') {
    return null;
  }

  if (HealthKitModule) {
    return HealthKitModule;
  }

  try {
    const RNHealth = require('react-native-health');
    HealthKitModule = RNHealth.default || RNHealth;
    return HealthKitModule;
  } catch (error) {
    console.warn('react-native-health not available:', error);
    return null;
  }
};

export const AppleHealthProvider = {
  /**
   * Check if HealthKit is available
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      const healthKit = await getHealthKit();
      if (!healthKit) return false;
      return await healthKit.isAvailable();
    } catch (error) {
      console.error('Error checking HealthKit availability:', error);
      return false;
    }
  },

  /**
   * Request HealthKit permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      const healthKit = await getHealthKit();
      if (!healthKit) return false;

      const granted = await healthKit.requestAuthorization({
        read: [
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierHeartRate',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierDistanceWalkingRunning',
          'HKQuantityTypeIdentifierRestingHeartRate',
        ],
        write: [
          'HKQuantityTypeIdentifierWorkoutType',
        ],
      });

      return granted;
    } catch (error) {
      console.error('Error requesting HealthKit permissions:', error);
      return false;
    }
  },

  /**
   * Read steps for date range
   */
  async readSteps(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const healthKit = await getHealthKit();
      if (!healthKit) return null;

      const steps = await healthKit.getStepCount(startDate, endDate);
      return Math.round(steps);
    } catch (error) {
      console.error('Error reading steps from HealthKit:', error);
      return null;
    }
  },

  /**
   * Read heart rate for date range
   */
  async readHeartRate(startDate: Date, endDate: Date): Promise<{
    average?: number;
    resting?: number;
    samples?: Array<{ timestamp: string; bpm: number }>;
  } | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const healthKit = await getHealthKit();
      if (!healthKit) return null;

      const samples = await healthKit.getHeartRateSamples(startDate, endDate);
      const resting = await healthKit.getRestingHeartRate(startDate, endDate);

      if (samples.length === 0) {
        return resting ? { resting: Math.round(resting) } : null;
      }

      const values = samples.map(s => s.value);
      const average = values.reduce((a, b) => a + b, 0) / values.length;

      return {
        average: Math.round(average),
        resting: resting ? Math.round(resting) : undefined,
        samples: samples.map(s => ({
          timestamp: s.startDate,
          bpm: Math.round(s.value),
        })),
      };
    } catch (error) {
      console.error('Error reading heart rate from HealthKit:', error);
      return null;
    }
  },

  /**
   * Read active calories
   */
  async readActiveCalories(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const healthKit = await getHealthKit();
      if (!healthKit) return null;

      const calories = await healthKit.getActiveEnergyBurned(startDate, endDate);
      return Math.round(calories);
    } catch (error) {
      console.error('Error reading active calories from HealthKit:', error);
      return null;
    }
  },

  /**
   * Read distance
   */
  async readDistance(startDate: Date, endDate: Date): Promise<number | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const healthKit = await getHealthKit();
      if (!healthKit) return null;

      const distance = await healthKit.getDistanceWalkingRunning(startDate, endDate);
      // Convert from meters to meters (HealthKit returns in meters)
      return Math.round(distance);
    } catch (error) {
      console.error('Error reading distance from HealthKit:', error);
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
    restingHeartRate?: number;
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
        if (heartRate.resting !== undefined) result.restingHeartRate = heartRate.resting;
        if (heartRate.samples) result.heartRateData = heartRate.samples;
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      console.error('Error reading all health data:', error);
      return null;
    }
  },
};

