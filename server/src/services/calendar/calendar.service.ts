/**
 * Calendar Service
 * Handles calendar operations for workouts and scheduling
 */

import { AssignedWorkout, IAssignedWorkout } from '../../models/AssignedWorkout.model';
import { WorkoutTemplate } from '../../models/WorkoutTemplate.model';
import { RecurrenceRule } from '../../models/RecurrenceRule.model';
import mongoose from 'mongoose';

export interface CalendarEvent {
  date: string; // ISO date string (YYYY-MM-DD)
  workouts: Array<{
    id: string;
    templateId: string;
    templateName: string;
    scheduledAt: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    duration?: number; // Estimated duration in minutes
    exercisesCount?: number;
  }>;
}

export interface ScheduleWorkoutInput {
  userId: string;
  templateId: string;
  scheduledAt: Date;
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  };
}

export class CalendarService {
  /**
   * Get calendar events for a date range
   */
  static async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const workouts = await AssignedWorkout.find({
      userId: new mongoose.Types.ObjectId(userId),
      scheduledAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate('templateId', 'name exercises')
      .sort({ scheduledAt: 1 });

    // Group workouts by date
    const eventsMap = new Map<string, CalendarEvent['workouts']>();

    workouts.forEach((workout) => {
      const dateKey = new Date(workout.scheduledAt).toISOString().split('T')[0];
      const template = workout.templateId as any;

      if (!eventsMap.has(dateKey)) {
        eventsMap.set(dateKey, []);
      }

      eventsMap.get(dateKey)!.push({
        id: workout._id.toString(),
        templateId: workout.templateId.toString(),
        templateName: template?.name || 'Unknown Workout',
        scheduledAt: workout.scheduledAt,
        status: workout.status,
        exercisesCount: template?.exercises?.length || 0,
      });
    });

    // Convert map to array
    const events: CalendarEvent[] = [];
    eventsMap.forEach((workouts, date) => {
      events.push({
        date,
        workouts,
      });
    });

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get workouts for a specific date
   */
  static async getWorkoutsForDate(
    userId: string,
    date: Date
  ): Promise<IAssignedWorkout[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return AssignedWorkout.find({
      userId: new mongoose.Types.ObjectId(userId),
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('templateId')
      .sort({ scheduledAt: 1 });
  }

  /**
   * Schedule a workout
   */
  static async scheduleWorkout(input: ScheduleWorkoutInput): Promise<IAssignedWorkout> {
    const { userId, templateId, scheduledAt, recurrence } = input;

    // Verify template exists
    const template = await WorkoutTemplate.findById(templateId);
    if (!template) {
      throw new Error('Workout template not found');
    }

    // Create the workout
    const workout = await AssignedWorkout.create({
      userId: new mongoose.Types.ObjectId(userId),
      templateId: new mongoose.Types.ObjectId(templateId),
      scheduledAt: new Date(scheduledAt),
      status: 'pending',
    });

    // Handle recurrence if provided
    if (recurrence) {
      const recurrenceRule = await RecurrenceRule.create({
        userId: new mongoose.Types.ObjectId(userId),
        templateId: new mongoose.Types.ObjectId(templateId),
        recurrenceType: recurrence.type,
        interval: recurrence.interval || 1,
        startDate: new Date(scheduledAt),
        endDate: recurrence.endDate ? new Date(recurrence.endDate) : undefined,
        daysOfWeek: recurrence.daysOfWeek,
        isActive: true,
      });

      workout.recurrenceRef = recurrenceRule._id;
      await workout.save();

      // Generate recurring workouts
      await this.generateRecurringWorkouts(recurrenceRule);
    }

    return workout.populate('templateId');
  }

  /**
   * Generate recurring workouts based on recurrence rule
   */
  static async generateRecurringWorkouts(
    recurrenceRule: any,
    limit: number = 12 // Generate up to 12 future workouts
  ): Promise<void> {
    const { userId, templateId, recurrenceType, interval, startDate, endDate, daysOfWeek } =
      recurrenceRule;

    const workouts: any[] = [];
    let currentDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let generated = 0;

    while (generated < limit && currentDate <= (endDate || new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000))) {
      if (currentDate < today) {
        // Skip past dates
        this.advanceDate(currentDate, recurrenceType, interval, daysOfWeek);
        continue;
      }

      // Check if workout already exists for this date
      const existing = await AssignedWorkout.findOne({
        userId,
        templateId,
        scheduledAt: {
          $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
          $lt: new Date(currentDate.setHours(23, 59, 59, 999)),
        },
        recurrenceRef: recurrenceRule._id,
      });

      if (!existing) {
        workouts.push({
          userId,
          templateId,
          scheduledAt: new Date(currentDate),
          status: 'pending',
          recurrenceRef: recurrenceRule._id,
        });
        generated++;
      }

      this.advanceDate(currentDate, recurrenceType, interval, daysOfWeek);
    }

    if (workouts.length > 0) {
      await AssignedWorkout.insertMany(workouts);
    }
  }

  /**
   * Advance date based on recurrence type
   */
  private static advanceDate(
    date: Date,
    type: 'daily' | 'weekly' | 'monthly',
    interval: number,
    daysOfWeek?: number[]
  ): void {
    if (type === 'daily') {
      date.setDate(date.getDate() + interval);
    } else if (type === 'weekly') {
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Find next matching day of week
        let daysToAdd = 1;
        let attempts = 0;
        while (attempts < 14) {
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + daysToAdd);
          if (daysOfWeek.includes(nextDate.getDay())) {
            date.setTime(nextDate.getTime());
            break;
          }
          daysToAdd++;
          attempts++;
        }
      } else {
        date.setDate(date.getDate() + interval * 7);
      }
    } else if (type === 'monthly') {
      date.setMonth(date.getMonth() + interval);
    }
  }

  /**
   * Update workout status
   */
  static async updateWorkoutStatus(
    userId: string,
    workoutId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ): Promise<IAssignedWorkout> {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const workout = await AssignedWorkout.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(workoutId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      updateData,
      { new: true }
    ).populate('templateId');

    if (!workout) {
      throw new Error('Workout not found');
    }

    return workout;
  }

  /**
   * Reschedule a workout
   */
  static async rescheduleWorkout(
    userId: string,
    workoutId: string,
    newDate: Date
  ): Promise<IAssignedWorkout> {
    const workout = await AssignedWorkout.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(workoutId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { scheduledAt: new Date(newDate) },
      { new: true }
    ).populate('templateId');

    if (!workout) {
      throw new Error('Workout not found');
    }

    return workout;
  }

  /**
   * Delete a scheduled workout
   */
  static async deleteWorkout(userId: string, workoutId: string): Promise<boolean> {
    const result = await AssignedWorkout.deleteOne({
      _id: new mongoose.Types.ObjectId(workoutId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  }

  /**
   * Get upcoming workouts
   */
  static async getUpcomingWorkouts(
    userId: string,
    limit: number = 5
  ): Promise<IAssignedWorkout[]> {
    const now = new Date();

    return AssignedWorkout.find({
      userId: new mongoose.Types.ObjectId(userId),
      scheduledAt: { $gte: now },
      status: { $in: ['pending', 'in_progress'] },
    })
      .populate('templateId')
      .sort({ scheduledAt: 1 })
      .limit(limit);
  }

  /**
   * Get workout statistics for a date range
   */
  static async getWorkoutStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    completed: number;
    pending: number;
    skipped: number;
    completionRate: number;
  }> {
    const workouts = await AssignedWorkout.find({
      userId: new mongoose.Types.ObjectId(userId),
      scheduledAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const stats = {
      total: workouts.length,
      completed: workouts.filter((w) => w.status === 'completed').length,
      pending: workouts.filter((w) => w.status === 'pending').length,
      skipped: workouts.filter((w) => w.status === 'skipped').length,
      completionRate: 0,
    };

    if (stats.total > 0) {
      stats.completionRate = (stats.completed / stats.total) * 100;
    }

    return stats;
  }
}

