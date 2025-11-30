/**
 * Nutrition Controller
 * Handles nutrition-related HTTP requests
 */

import { Request, Response } from 'express';
import { MealPlan } from '../models/MealPlan.model';
import { NutritionLog } from '../models/NutritionLog.model';
import { nutritionApiService } from '../services/nutrition';
import { getOrCreateTodayLog, addMealToLog, getTodayNutritionWithGoal } from '../services/nutrition/nutrition-log.service';
import { getActiveGoal, createOrUpdateGoal } from '../services/nutrition/nutrition-goal.service';

/**
 * Search for food items
 */
export const searchFood = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' },
      });
    }

    const results = await nutritionApiService.searchFood(query.trim());

    return res.json({
      success: true,
      data: {
        foods: results,
        count: results.length,
      },
    });
  } catch (error: any) {
    console.error('Error searching food:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to search food' },
    });
  }
};

/**
 * Get today's nutrition log
 */
export const getTodayNutrition = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { nutritionLog, goal, remaining } = await getTodayNutritionWithGoal(userId);

    return res.json({
      success: true,
      data: { nutritionLog, goal, remaining },
    });
  } catch (error: any) {
    console.error('Error getting today nutrition:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get nutrition log' },
    });
  }
};

/**
 * Add a meal
 */
export const addMeal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { mealType, foodItems, consumedAt, notes, imageUrl } = req.body;

    if (!mealType || !foodItems || !Array.isArray(foodItems) || foodItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Meal type and food items are required' },
      });
    }

    const nutritionLog = await getOrCreateTodayLog(userId);
    const { meal, nutritionLog: updatedLog } = await addMealToLog(userId, nutritionLog._id.toString(), {
      mealType,
      foodItems,
      consumedAt: consumedAt ? new Date(consumedAt) : undefined,
      notes,
      imageUrl,
    });

    const { goal, remaining } = await getTodayNutritionWithGoal(userId);

    return res.json({
      success: true,
      data: { meal, nutritionLog: updatedLog, goal, remaining },
    });
  } catch (error: any) {
    console.error('Error adding meal:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to add meal' },
    });
  }
};

/**
 * Get current nutrition goal
 */
export const getNutritionGoal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const goal = await getActiveGoal(userId);

    return res.json({
      success: true,
      data: { goal: goal || null },
    });
  } catch (error: any) {
    console.error('Error getting nutrition goal:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get nutrition goal' },
    });
  }
};

/**
 * Set nutrition goals
 */
export const setNutritionGoal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const goal = await createOrUpdateGoal(userId, req.body);

    return res.json({
      success: true,
      data: { goal },
    });
  } catch (error: any) {
    console.error('Error setting nutrition goal:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to set nutrition goal' },
    });
  }
};

/**
 * Get meal plans (with premium check)
 */
export const getMealPlans = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { category, difficulty, isPremium } = req.query;
    // TODO: Check if user has premium subscription
    // const userId = (req as any).user?.id;
    // const hasPremium = await checkPremiumSubscription(userId);

    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Filter premium plans based on subscription
    // For now, show all plans
    // if (isPremium === 'true' && !hasPremium) {
    //   return res.status(403).json({
    //     success: false,
    //     error: { message: 'Premium subscription required' },
    //   });
    // }

    if (isPremium === 'true') {
      query.isPremium = true;
    } else if (isPremium === 'false') {
      query.isPremium = false;
    }

    const mealPlans = await MealPlan.find(query)
      .populate('createdBy', 'name email')
      .sort({ purchaseCount: -1, createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      data: {
        mealPlans,
        count: mealPlans.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting meal plans:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get meal plans' },
    });
  }
};

/**
 * Get nutrition history
 */
export const getNutritionHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { startDate, endDate, limit = 30 } = req.query;

    const query: any = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate as string);
      }
    }

    const logs = await NutritionLog.find(query)
      .populate('meals')
      .sort({ date: -1 })
      .limit(Number(limit));

    return res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting nutrition history:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get nutrition history' },
    });
  }
};

