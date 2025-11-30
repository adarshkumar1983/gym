/**
 * Nutrition Goal Service
 * Handles nutrition goal operations
 */

import { NutritionGoal, INutritionGoal } from '../../models/NutritionGoal.model';
import { calculateNutritionGoals } from './nutrition-calculator.service';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
type GoalType = 'weight-loss' | 'muscle-gain' | 'maintenance';

interface GoalData {
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  goalType?: string;
  currentWeight?: number;
  targetWeight?: number;
  activityLevel?: string;
}

const isValidActivityLevel = (level: string | undefined): level is ActivityLevel => {
  return level === 'sedentary' || level === 'light' || level === 'moderate' || level === 'active' || level === 'very-active';
};

const isValidGoalType = (goal: string | undefined): goal is GoalType => {
  return goal === 'weight-loss' || goal === 'muscle-gain' || goal === 'maintenance';
};

export const getActiveGoal = async (userId: string): Promise<INutritionGoal | null> => {
  return await NutritionGoal.findOne({ userId, isActive: true });
};

export const createOrUpdateGoal = async (userId: string, goalData: GoalData): Promise<INutritionGoal> => {
  let calculatedGoals;
  const activityLevel: ActivityLevel = isValidActivityLevel(goalData.activityLevel) ? goalData.activityLevel : 'moderate';
  const goalType: GoalType = isValidGoalType(goalData.goalType) ? goalData.goalType : 'maintenance';
  
  if (!goalData.targetCalories && goalData.goalType) {
    calculatedGoals = calculateNutritionGoals({
      activityLevel,
      goal: goalType,
    });
  }

  const finalGoalData = {
    userId,
    targetCalories: goalData.targetCalories || calculatedGoals?.calories || 2000,
    targetProtein: goalData.targetProtein || calculatedGoals?.protein || 150,
    targetCarbs: goalData.targetCarbs || calculatedGoals?.carbs || 200,
    targetFats: goalData.targetFats || calculatedGoals?.fats || 65,
    goalType: goalType,
    currentWeight: goalData.currentWeight,
    targetWeight: goalData.targetWeight,
    activityLevel: activityLevel,
    isActive: true,
  };

  return await NutritionGoal.findOneAndUpdate(
    { userId, isActive: true },
    finalGoalData,
    { new: true, upsert: true, runValidators: true }
  );
};

