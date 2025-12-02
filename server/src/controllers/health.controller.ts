/**
 * Health Controller
 * Handles health data sync and retrieval requests
 */

import { Request, Response } from 'express';
import { HealthDataService, HealthSyncSettingsService } from '../services/health';

/**
 * Sync health data from wearable devices
 */
export const syncHealthData = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const healthData = await HealthDataService.upsertHealthData({
      userId,
      ...req.body,
    });

    return res.json({
      success: true,
      data: { healthData },
    });
  } catch (error: any) {
    console.error('Error syncing health data:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to sync health data' },
    });
  }
};

/**
 * Get today's health data
 */
export const getTodayHealthData = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const healthData = await HealthDataService.getTodayHealthData(userId);

    return res.json({
      success: true,
      data: { healthData },
    });
  } catch (error: any) {
    console.error('Error getting today health data:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get health data' },
    });
  }
};

/**
 * Get health data within a date range
 */
export const getHealthData = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { startDate, endDate, source } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const sourceFilter = source as string | undefined;

    const healthData = await HealthDataService.getHealthData(userId, start, end, sourceFilter);

    return res.json({
      success: true,
      data: { healthData },
    });
  } catch (error: any) {
    console.error('Error getting health data:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get health data' },
    });
  }
};

/**
 * Get aggregated health stats
 */
export const getHealthStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date();
    start.setDate(start.getDate() - 7); // Default to last 7 days
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await HealthDataService.getHealthStats(userId, start, end);

    return res.json({
      success: true,
      data: { stats },
    });
  } catch (error: any) {
    console.error('Error getting health stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get health stats' },
    });
  }
};

/**
 * Get sync settings
 */
export const getSyncSettings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const settings = await HealthSyncSettingsService.getSettings(userId);

    // Don't return sensitive tokens
    const safeSettings = {
      ...settings.toObject(),
      appleHealthToken: undefined,
      googleFitToken: undefined,
      googleFitRefreshToken: undefined,
      fitbitAccessToken: undefined,
      fitbitRefreshToken: undefined,
    };

    return res.json({
      success: true,
      data: { settings: safeSettings },
    });
  } catch (error: any) {
    console.error('Error getting sync settings:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get sync settings' },
    });
  }
};

/**
 * Update sync settings
 */
export const updateSyncSettings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const settings = await HealthSyncSettingsService.updateSettings(userId, {
      userId,
      ...req.body,
    });

    // Don't return sensitive tokens
    const safeSettings = {
      ...settings.toObject(),
      appleHealthToken: undefined,
      googleFitToken: undefined,
      googleFitRefreshToken: undefined,
      fitbitAccessToken: undefined,
      fitbitRefreshToken: undefined,
    };

    return res.json({
      success: true,
      data: { settings: safeSettings },
    });
  } catch (error: any) {
    console.error('Error updating sync settings:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to update sync settings' },
    });
  }
};

/**
 * Delete health data
 */
export const deleteHealthData = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { id } = req.params;

    const deleted = await HealthDataService.deleteHealthData(userId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Health data not found' },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Health data deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting health data:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to delete health data' },
    });
  }
};

