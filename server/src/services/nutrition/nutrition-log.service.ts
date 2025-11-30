/**
 * Nutrition Log Service
 * Handles nutrition log operations
 */

import { NutritionLog, INutritionLog } from '../../models/NutritionLog.model';
import { Meal, IMeal } from '../../models/Meal.model';
import { NutritionGoal } from '../../models/NutritionGoal.model';
import { calculateRemaining } from './nutrition-calculator.service';

export const getOrCreateTodayLog = async (userId: string): Promise<INutritionLog> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let nutritionLog = await NutritionLog.findOne({
    userId,
    date: today,
  }).populate('meals');

  if (!nutritionLog) {
    nutritionLog = new NutritionLog({
      userId,
      date: today,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      meals: [],
    });
    await nutritionLog.save();
  }

  return nutritionLog;
};

export const addMealToLog = async (
  userId: string,
  nutritionLogId: string,
  mealData: {
    mealType: string;
    foodItems: any[];
    consumedAt?: Date;
    notes?: string;
    imageUrl?: string;
  }
): Promise<{ meal: IMeal; nutritionLog: INutritionLog }> => {
  const meal = new Meal({
    userId,
    nutritionLogId,
    ...mealData,
    consumedAt: mealData.consumedAt || new Date(),
  });

  await meal.save();

  const nutritionLog = await NutritionLog.findById(nutritionLogId);
  if (!nutritionLog) {
    throw new Error('Nutrition log not found');
  }

  nutritionLog.meals.push(meal._id);
  nutritionLog.totalCalories += meal.totalCalories;
  nutritionLog.totalProtein += meal.totalProtein;
  nutritionLog.totalCarbs += meal.totalCarbs;
  nutritionLog.totalFats += meal.totalFats;
  nutritionLog.totalFiber = (nutritionLog.totalFiber || 0) + (meal.totalFiber || 0);
  nutritionLog.totalSugar = (nutritionLog.totalSugar || 0) + (meal.totalSugar || 0);

  await nutritionLog.save();
  await nutritionLog.populate('meals');

  return { meal, nutritionLog };
};

export const getTodayNutritionWithGoal = async (userId: string) => {
  const nutritionLog = await getOrCreateTodayLog(userId);
  const goal = await NutritionGoal.findOne({ userId, isActive: true });

  let remaining = null;
  if (goal) {
    remaining = calculateRemaining(goal, {
      calories: nutritionLog.totalCalories,
      protein: nutritionLog.totalProtein,
      carbs: nutritionLog.totalCarbs,
      fats: nutritionLog.totalFats,
    });
  }

  return { nutritionLog, goal, remaining };
};

