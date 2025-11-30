/**
 * Edamam Food Database API Service (Fallback)
 * Free tier: 10,000 requests/month
 */

import { getCachedFood, setCachedFood } from './cache.service';
import { checkRateLimit } from './rate-limiter.service';
import { FoodSearchResult, NutritionApiService } from './types';

export class EdamamNutritionService implements NutritionApiService {
  private readonly apiKey: string;
  private readonly appId: string;
  private readonly baseUrl = 'https://api.edamam.com/api/food-database/v2';

  constructor() {
    this.apiKey = process.env.EDAMAM_API_KEY || '';
    this.appId = process.env.EDAMAM_APP_ID || '';
  }

  async searchFood(query: string): Promise<FoodSearchResult[]> {
    if (!this.apiKey || !this.appId) {
      return this.getFallbackResults(query);
    }

    const cacheKey = `edamam_search:${query.toLowerCase()}`;
    const cached = getCachedFood(cacheKey);
    if (cached) {
      console.log(`📦 Using cached Edamam search: ${query}`);
      return cached;
    }

    if (!checkRateLimit()) {
      console.warn('⚠️ Rate limit exceeded, using fallback');
      return this.getFallbackResults(query);
    }

    try {
      const url = `${this.baseUrl}/parser?ingr=${encodeURIComponent(query)}&app_id=${this.appId}&app_key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        console.error(`❌ Edamam API error: ${response.status}`);
        return this.getFallbackResults(query);
      }

      const data: any = await response.json();
      const results = this.transformEdamamFoods(data.hints || []);
      
      setCachedFood(cacheKey, results);
      return results;
    } catch (error) {
      console.error('❌ Error searching Edamam food:', error);
      return this.getFallbackResults(query);
    }
  }

  async getFoodDetails(_foodId: string): Promise<FoodSearchResult | null> {
    // Edamam requires a different endpoint for food details
    // This is a placeholder implementation
    return null;
  }

  async calculateNutrition(_foodId: string, _quantity: number, _unit: string): Promise<FoodSearchResult['nutrients'] | null> {
    // TODO: Implement Edamam nutrition calculation endpoint
    return null;
  }

  private transformEdamamFoods(hints: any[]): FoodSearchResult[] {
    return hints.slice(0, 20).map((hint: any) => {
      const food = hint.food;
      const nutrients = food.nutrients || {};
      
      return {
        foodId: food.foodId || food.label.toLowerCase().replace(/\s+/g, '-'),
        label: food.label,
        brand: food.brand,
        nutrients: {
          calories: nutrients.ENERC_KCAL || 0,
          protein: nutrients.PROCNT || 0,
          carbs: nutrients.CHOCDF || 0,
          fat: nutrients.FAT || 0,
          fiber: nutrients.FIBTG || 0,
          sugar: nutrients.SUGAR || 0,
        },
        servingSizes: [
          { label: '100g', quantity: 100 },
          { label: '1 serving', quantity: food.servingSizes?.[0]?.quantity || 100 },
        ],
      };
    });
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

