/**
 * Nutrition Routes
 * API endpoints for nutrition tracking
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as nutritionController from '../controllers/nutrition.controller';

const router = Router();

// Food search (public, but rate-limited)
router.get('/food/search', nutritionController.searchFood);

// Nutrition tracking (requires auth)
router.get('/today', requireAuth, nutritionController.getTodayNutrition);
router.post('/meals', requireAuth, nutritionController.addMeal);
router.get('/history', requireAuth, nutritionController.getNutritionHistory);

// Nutrition goals
router.get('/goals', requireAuth, nutritionController.getNutritionGoal); // GET current goal
router.post('/goals', requireAuth, nutritionController.setNutritionGoal); // POST to set/update

// Meal plans
router.get('/meal-plans', requireAuth, nutritionController.getMealPlans);

export default router;

