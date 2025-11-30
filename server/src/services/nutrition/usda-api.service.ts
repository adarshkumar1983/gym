/**
 * USDA FoodData Central API Service
 * FREE, unlimited requests, government-backed authoritative data
 */

import { getCachedFood, setCachedFood } from './cache.service';
import { checkRateLimit } from './rate-limiter.service';
import { FoodSearchResult, NutritionApiService } from './types';

export class USDANutritionService implements NutritionApiService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  constructor() {
    if (typeof process !== 'undefined' && process.env) {
      try {
        require('dotenv').config();
      } catch {
        // dotenv already loaded
      }
    }
    
    this.apiKey = process.env.USDA_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ USDA API key not configured. Nutrition search will be limited.');
    } else {
      console.log('✅ USDA API key configured');
    }
  }

  async searchFood(query: string): Promise<FoodSearchResult[]> {
    if (!this.apiKey) {
      return this.getFallbackResults(query);
    }

    const cacheKey = `usda_search:${query.toLowerCase()}`;
    const cached = getCachedFood(cacheKey);
    if (cached) {
      console.log(`📦 Using cached USDA search: ${query}`);
      return cached;
    }

    if (!checkRateLimit()) {
      console.warn('⚠️ Rate limit exceeded, using fallback');
      return this.getFallbackResults(query);
    }

    try {
      const url = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&pageSize=20&dataType=Foundation,Branded`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        console.error(`❌ USDA API error: ${response.status}`);
        return this.getFallbackResults(query);
      }

      const data: any = await response.json();
      const results = this.transformUSDAFoods(data.foods || []);
      
      setCachedFood(cacheKey, results);
      return results;
    } catch (error) {
      console.error('❌ Error searching USDA food:', error);
      return this.getFallbackResults(query);
    }
  }

  async getFoodDetails(foodId: string): Promise<FoodSearchResult | null> {
    if (!this.apiKey) return null;

    const cacheKey = `usda_food:${foodId}`;
    const cached = getCachedFood(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/food/${foodId}?api_key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) return null;

      const food: any = await response.json();
      const result = this.transformUSDAFood(food);
      
      if (result) {
        setCachedFood(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error getting USDA food details:', error);
      return null;
    }
  }

  async calculateNutrition(_foodId: string, _quantity: number, _unit: string): Promise<FoodSearchResult['nutrients'] | null> {
    // This is a placeholder - actual implementation would fetch food details
    // For now, return null to use the main service's implementation
    return null;
  }

  private transformUSDAFoods(foods: any[]): FoodSearchResult[] {
    return foods.map(food => this.transformUSDAFood(food)).filter(Boolean) as FoodSearchResult[];
  }

  private transformUSDAFood(food: any): FoodSearchResult | null {
    if (!food) return null;

    const nutrients = this.extractNutrients(food.foodNutrients || []);
    const servingSize = food.servingSize || 100;
    const servingSizeUnit = food.servingSizeUnit || 'g';

    return {
      foodId: food.fdcId?.toString() || food.description?.toLowerCase().replace(/\s+/g, '-'),
      label: food.description || 'Unknown Food',
      brand: food.brandOwner || food.brandName,
      nutrients: {
        calories: nutrients.calories || 0,
        protein: nutrients.protein || 0,
        carbs: nutrients.carbs || 0,
        fat: nutrients.fat || 0,
        fiber: nutrients.fiber || 0,
        sugar: nutrients.sugar || 0,
      },
      servingSizes: [
        { label: '100g', quantity: 100 },
        { label: `1 serving (${servingSize}${servingSizeUnit})`, quantity: servingSize },
      ],
    };
  }

  private extractNutrients(foodNutrients: any[]): Record<string, number> {
    const nutrients: Record<string, number> = {};
    
    foodNutrients.forEach((nutrient: any) => {
      const name = nutrient.nutrientName?.toLowerCase() || '';
      if (name.includes('energy')) {
        nutrients.calories = nutrient.value || 0;
      } else if (name.includes('protein')) {
        nutrients.protein = nutrient.value || 0;
      } else if (name.includes('carbohydrate') || name.includes('carb')) {
        nutrients.carbs = nutrient.value || 0;
      } else if (name.includes('fat') && !name.includes('saturated')) {
        nutrients.fat = nutrient.value || 0;
      } else if (name.includes('fiber')) {
        nutrients.fiber = nutrient.value || 0;
      } else if (name.includes('sugar')) {
        nutrients.sugar = nutrient.value || 0;
      }
    });
    
    return nutrients;
  }

  private getFallbackResults(query: string): FoodSearchResult[] {
    const commonFoods: Record<string, FoodSearchResult> = {
      'chicken breast': {
        foodId: 'chicken-breast',
        label: 'Chicken Breast',
        nutrients: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 },
        servingSizes: [{ label: '100g', quantity: 100 }],
      },
      'rice': {
        foodId: 'rice',
        label: 'White Rice, Cooked',
        nutrients: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0 },
        servingSizes: [{ label: '100g', quantity: 100 }],
      },
      'banana': {
        foodId: 'banana',
        label: 'Banana',
        nutrients: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12 },
        servingSizes: [{ label: '1 medium', quantity: 118 }],
      },
      'egg': {
        foodId: 'egg',
        label: 'Egg, Whole',
        nutrients: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 0.7 },
        servingSizes: [{ label: '1 large', quantity: 50 }],
      },
      'oatmeal': {
        foodId: 'oatmeal',
        label: 'Oatmeal, Cooked',
        nutrients: { calories: 68, protein: 2.4, carbs: 12, fat: 1.4, fiber: 1.7, sugar: 0.5 },
        servingSizes: [{ label: '100g', quantity: 100 }],
      },
    };

    const lowerQuery = query.toLowerCase();
    const matched = Object.entries(commonFoods).find(([key]) => 
      lowerQuery.includes(key) || key.includes(lowerQuery)
    );

    return matched ? [matched[1]] : [];
  }
}

