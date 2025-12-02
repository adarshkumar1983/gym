/**
 * Calendar Controller
 * Handles calendar-related HTTP requests
 */

import { Request, Response } from 'express';
import { CalendarService } from '../services/calendar';

/**
 * Get calendar events for a date range
 */
export const getCalendarEvents = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required' },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const events = await CalendarService.getCalendarEvents(userId, start, end);

    return res.json({
      success: true,
      data: { events },
    });
  } catch (error: any) {
    console.error('Error getting calendar events:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get calendar events' },
    });
  }
};

/**
 * Get workouts for a specific date
 */
export const getWorkoutsForDate = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: { message: 'Date is required' },
      });
    }

    const targetDate = new Date(date as string);
    const workouts = await CalendarService.getWorkoutsForDate(userId, targetDate);

    return res.json({
      success: true,
      data: { workouts },
    });
  } catch (error: any) {
    console.error('Error getting workouts for date:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get workouts' },
    });
  }
};

/**
 * Schedule a workout
 */
export const scheduleWorkout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { templateId, scheduledAt, recurrence } = req.body;

    if (!templateId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        error: { message: 'templateId and scheduledAt are required' },
      });
    }

    const workout = await CalendarService.scheduleWorkout({
      userId,
      templateId,
      scheduledAt: new Date(scheduledAt),
      recurrence,
    });

    return res.json({
      success: true,
      data: { workout },
    });
  } catch (error: any) {
    console.error('Error scheduling workout:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to schedule workout' },
    });
  }
};

/**
 * Update workout status
 */
export const updateWorkoutStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'in_progress', 'completed', 'skipped'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid status is required' },
      });
    }

    const workout = await CalendarService.updateWorkoutStatus(userId, id, status);

    return res.json({
      success: true,
      data: { workout },
    });
  } catch (error: any) {
    console.error('Error updating workout status:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to update workout status' },
    });
  }
};

/**
 * Reschedule a workout
 */
export const rescheduleWorkout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        error: { message: 'scheduledAt is required' },
      });
    }

    const workout = await CalendarService.rescheduleWorkout(userId, id, new Date(scheduledAt));

    return res.json({
      success: true,
      data: { workout },
    });
  } catch (error: any) {
    console.error('Error rescheduling workout:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to reschedule workout' },
    });
  }
};

/**
 * Delete a scheduled workout
 */
export const deleteWorkout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { id } = req.params;

    const deleted = await CalendarService.deleteWorkout(userId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workout not found' },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Workout deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting workout:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to delete workout' },
    });
  }
};

/**
 * Get upcoming workouts
 */
export const getUpcomingWorkouts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const limit = parseInt(req.query.limit as string) || 5;

    const workouts = await CalendarService.getUpcomingWorkouts(userId, limit);

    return res.json({
      success: true,
      data: { workouts },
    });
  } catch (error: any) {
    console.error('Error getting upcoming workouts:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get upcoming workouts' },
    });
  }
};

/**
 * Get workout statistics
 */
export const getWorkoutStats = async (req: Request, res: Response): Promise<Response> => {
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
    start.setDate(start.getDate() - 30); // Default to last 30 days
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await CalendarService.getWorkoutStats(userId, start, end);

    return res.json({
      success: true,
      data: { stats },
    });
  } catch (error: any) {
    console.error('Error getting workout stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get workout stats' },
    });
  }
};

