/**
 * Calendar Routes
 * API routes for calendar and workout scheduling
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as calendarController from '../controllers/calendar.controller';

const router = Router();

/**
 * Get calendar events for a date range
 * GET /api/calendar/events?startDate=2024-01-01&endDate=2024-01-31
 */
router.get('/events', requireAuth, calendarController.getCalendarEvents);

/**
 * Get workouts for a specific date
 * GET /api/calendar/workouts?date=2024-01-15
 */
router.get('/workouts', requireAuth, calendarController.getWorkoutsForDate);

/**
 * Schedule a workout
 * POST /api/calendar/schedule
 */
router.post('/schedule', requireAuth, calendarController.scheduleWorkout);

/**
 * Update workout status
 * PUT /api/calendar/workouts/:id/status
 */
router.put('/workouts/:id/status', requireAuth, calendarController.updateWorkoutStatus);

/**
 * Reschedule a workout
 * PUT /api/calendar/workouts/:id/reschedule
 */
router.put('/workouts/:id/reschedule', requireAuth, calendarController.rescheduleWorkout);

/**
 * Delete a scheduled workout
 * DELETE /api/calendar/workouts/:id
 */
router.delete('/workouts/:id', requireAuth, calendarController.deleteWorkout);

/**
 * Get upcoming workouts
 * GET /api/calendar/upcoming?limit=5
 */
router.get('/upcoming', requireAuth, calendarController.getUpcomingWorkouts);

/**
 * Get workout statistics
 * GET /api/calendar/stats?startDate=2024-01-01&endDate=2024-01-31
 */
router.get('/stats', requireAuth, calendarController.getWorkoutStats);

export default router;

