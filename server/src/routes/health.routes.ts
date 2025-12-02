/**
 * Health Routes
 * API routes for health data sync and retrieval
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as healthController from '../controllers/health.controller';

const router = Router();

/**
 * Sync health data from wearable devices
 * POST /api/health/sync
 */
router.post('/sync', requireAuth, healthController.syncHealthData);

/**
 * Get today's health data
 * GET /api/health/today
 */
router.get('/today', requireAuth, healthController.getTodayHealthData);

/**
 * Get health data within a date range
 * GET /api/health/data?startDate=2024-01-01&endDate=2024-01-31&source=apple-health
 */
router.get('/data', requireAuth, healthController.getHealthData);

/**
 * Get aggregated health stats
 * GET /api/health/stats?startDate=2024-01-01&endDate=2024-01-31
 */
router.get('/stats', requireAuth, healthController.getHealthStats);

/**
 * Get sync settings
 * GET /api/health/settings
 */
router.get('/settings', requireAuth, healthController.getSyncSettings);

/**
 * Update sync settings
 * PUT /api/health/settings
 */
router.put('/settings', requireAuth, healthController.updateSyncSettings);

/**
 * Delete health data
 * DELETE /api/health/data/:id
 */
router.delete('/data/:id', requireAuth, healthController.deleteHealthData);

export default router;

