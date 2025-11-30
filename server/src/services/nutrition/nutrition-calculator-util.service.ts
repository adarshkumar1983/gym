/**
 * Nutrition Calculator Utility Service
 * Handles unit conversions and nutrition calculations
 */

import { FoodSearchResult } from './types';

export const convertToGrams = (quantity: number, unit: string): number => {
  if (unit === 'g' || unit === 'gram' || unit === 'grams') {
    return quantity;
  }
  if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') {
    return quantity * 28.35;
  }
  if (unit === 'lb' || unit === 'pound' || unit === 'pounds') {
    return quantity * 453.6;
  }
  if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters') {
    return quantity; // Approximate 1:1 for liquids
  }
  if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
    return quantity * 1000;
  }
  // Default: assume grams
  return quantity;
};

export const calculateNutritionForQuantity = (
  food: FoodSearchResult,
  quantity: number,
  unit: string
): FoodSearchResult['nutrients'] => {
  const quantityInGrams = convertToGrams(quantity, unit);
  const ratio = quantityInGrams / 100;

  return {
    calories: Math.round(food.nutrients.calories * ratio),
    protein: Math.round((food.nutrients.protein * ratio) * 10) / 10,
    carbs: Math.round((food.nutrients.carbs * ratio) * 10) / 10,
    fat: Math.round((food.nutrients.fat * ratio) * 10) / 10,
    fiber: food.nutrients.fiber ? Math.round((food.nutrients.fiber * ratio) * 10) / 10 : undefined,
    sugar: food.nutrients.sugar ? Math.round((food.nutrients.sugar * ratio) * 10) / 10 : undefined,
  };
};

