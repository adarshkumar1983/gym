/**
 * Nutrition Calculator Service
 * Calculates nutrition goals, macros, and recommendations
 */

import { INutritionGoal } from '../../models/NutritionGoal.model';

interface UserProfile {
  age?: number;
  gender?: 'male' | 'female';
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goal: 'weight-loss' | 'muscle-gain' | 'maintenance';
}

interface CalculatedGoals {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
}

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 */
const calculateBMR = (profile: UserProfile): number => {
  if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
    // Default BMR if data missing
    return 2000;
  }

  const { weight, height, age, gender } = profile;
  
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
const calculateTDEE = (bmr: number, activityLevel: string): number => {
  const multipliers: Record<string, number> = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9,
  };

  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
};

/**
 * Calculate macro distribution based on goal
 */
const calculateMacros = (calories: number, goal: string): { protein: number; carbs: number; fats: number } => {
  let proteinPercent: number;
  let carbsPercent: number;
  let fatsPercent: number;

  switch (goal) {
    case 'weight-loss':
      // Higher protein, moderate carbs, lower fats
      proteinPercent = 0.35;
      carbsPercent = 0.35;
      fatsPercent = 0.30;
      break;
    case 'muscle-gain':
      // High protein, high carbs, moderate fats
      proteinPercent = 0.30;
      carbsPercent = 0.45;
      fatsPercent = 0.25;
      break;
    case 'maintenance':
    default:
      // Balanced macros
      proteinPercent = 0.30;
      carbsPercent = 0.40;
      fatsPercent = 0.30;
      break;
  }

  // Convert percentages to grams
  // Protein: 4 calories per gram
  // Carbs: 4 calories per gram
  // Fats: 9 calories per gram
  const protein = Math.round((calories * proteinPercent) / 4);
  const carbs = Math.round((calories * carbsPercent) / 4);
  const fats = Math.round((calories * fatsPercent) / 9);

  return { protein, carbs, fats };
};

/**
 * Calculate nutrition goals for a user
 */
export const calculateNutritionGoals = (profile: UserProfile): CalculatedGoals => {
  const bmr = calculateBMR(profile);
  let tdee = calculateTDEE(bmr, profile.activityLevel);

  // Adjust calories based on goal
  if (profile.goal === 'weight-loss') {
    // Create 500 calorie deficit (lose ~1 lb per week)
    tdee = Math.max(tdee - 500, 1200); // Minimum 1200 calories
  } else if (profile.goal === 'muscle-gain') {
    // Create 300-500 calorie surplus
    tdee = tdee + 400;
  }

  const macros = calculateMacros(tdee, profile.goal);

  return {
    calories: Math.round(tdee),
    ...macros,
  };
};

/**
 * Calculate remaining nutrition for the day
 */
export const calculateRemaining = (
  goal: INutritionGoal,
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }
): {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  percentages: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
} => {
  const remaining = {
    calories: Math.max(0, goal.targetCalories - consumed.calories),
    protein: Math.max(0, goal.targetProtein - consumed.protein),
    carbs: Math.max(0, goal.targetCarbs - consumed.carbs),
    fats: Math.max(0, goal.targetFats - consumed.fats),
  };

  const percentages = {
    calories: goal.targetCalories > 0 ? (consumed.calories / goal.targetCalories) * 100 : 0,
    protein: goal.targetProtein > 0 ? (consumed.protein / goal.targetProtein) * 100 : 0,
    carbs: goal.targetCarbs > 0 ? (consumed.carbs / goal.targetCarbs) * 100 : 0,
    fats: goal.targetFats > 0 ? (consumed.fats / goal.targetFats) * 100 : 0,
  };

  return { ...remaining, percentages };
};

