/**
 * Calendar API
 * Handles calendar and workout scheduling operations
 */

import apiClient from './api';

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  workouts: Array<{
    id: string;
    templateId: string;
    templateName: string;
    scheduledAt: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    exercisesCount?: number;
  }>;
}

export interface Workout {
  _id: string;
  userId: string;
  templateId: string | {
    _id: string;
    name: string;
    exercises: any[];
  };
  scheduledAt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  recurrenceRef?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleWorkoutInput {
  templateId: string;
  scheduledAt: string; // ISO string
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
}

export interface CalendarResponse {
  success: boolean;
  data?: {
    events?: CalendarEvent[];
    workouts?: Workout[];
    workout?: Workout;
    stats?: {
      total: number;
      completed: number;
      pending: number;
      skipped: number;
      completionRate: number;
    };
  };
  error?: {
    message: string;
  };
}

class CalendarAPI {
  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarResponse> {
    try {
      const response = await apiClient.get('/api/calendar/events', {
        params: { startDate, endDate },
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            events: responseData.data.events,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get calendar events' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get calendar events',
        },
      };
    }
  }

  /**
   * Get workouts for a specific date
   */
  async getWorkoutsForDate(date: string): Promise<CalendarResponse> {
    try {
      const response = await apiClient.get('/api/calendar/workouts', {
        params: { date },
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            workouts: responseData.data.workouts,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get workouts' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get workouts',
        },
      };
    }
  }

  /**
   * Schedule a workout
   */
  async scheduleWorkout(input: ScheduleWorkoutInput): Promise<CalendarResponse> {
    try {
      const response = await apiClient.post('/api/calendar/schedule', input, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            workout: responseData.data.workout,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to schedule workout' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to schedule workout',
        },
      };
    }
  }

  /**
   * Update workout status
   */
  async updateWorkoutStatus(workoutId: string, status: 'pending' | 'in_progress' | 'completed' | 'skipped'): Promise<CalendarResponse> {
    try {
      const response = await apiClient.put(`/api/calendar/workouts/${workoutId}/status`, { status }, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            workout: responseData.data.workout,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to update workout status' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to update workout status',
        },
      };
    }
  }

  /**
   * Reschedule a workout
   */
  async rescheduleWorkout(workoutId: string, scheduledAt: string): Promise<CalendarResponse> {
    try {
      const response = await apiClient.put(`/api/calendar/workouts/${workoutId}/reschedule`, { scheduledAt }, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            workout: responseData.data.workout,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to reschedule workout' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to reschedule workout',
        },
      };
    }
  }

  /**
   * Delete a scheduled workout
   */
  async deleteWorkout(workoutId: string): Promise<CalendarResponse> {
    try {
      const response = await apiClient.delete(`/api/calendar/workouts/${workoutId}`, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to delete workout' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to delete workout',
        },
      };
    }
  }

  /**
   * Get upcoming workouts
   */
  async getUpcomingWorkouts(limit: number = 5): Promise<CalendarResponse> {
    try {
      const response = await apiClient.get('/api/calendar/upcoming', {
        params: { limit },
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: {
            workouts: responseData.data.workouts,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get upcoming workouts' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get upcoming workouts',
        },
      };
    }
  }

  /**
   * Get workout statistics
   */
  async getWorkoutStats(startDate?: string, endDate?: string): Promise<CalendarResponse> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get('/api/calendar/stats', {
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
        error: { message: responseData.error?.message || 'Failed to get workout stats' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get workout stats',
        },
      };
    }
  }
}

export const calendarAPI = new CalendarAPI();

