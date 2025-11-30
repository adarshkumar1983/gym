/**
 * Nutrition Service Types
 */

export interface FoodSearchResult {
  foodId: string;
  label: string;
  brand?: string;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  servingSizes: Array<{
    label: string;
    quantity: number;
  }>;
}

export interface NutritionApiService {
  searchFood: (query: string) => Promise<FoodSearchResult[]>;
  getFoodDetails: (foodId: string) => Promise<FoodSearchResult | null>;
  calculateNutrition: (foodId: string, quantity: number, unit: string) => Promise<FoodSearchResult['nutrients'] | null>;
}

