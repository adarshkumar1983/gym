/**
 * Multi-Provider Nutrition Service
 * Tries USDA first (free, unlimited), falls back to Edamam if needed
 */

import { FoodSearchResult, NutritionApiService } from './types';
import { USDANutritionService } from './usda-api.service';
import { EdamamNutritionService } from './edamam-api.service';
import { calculateNutritionForQuantity } from './nutrition-calculator-util.service';

export class MultiProviderNutritionService implements NutritionApiService {
  private readonly usdaService: USDANutritionService;
  private readonly edamamService: EdamamNutritionService;

  constructor() {
    this.usdaService = new USDANutritionService();
    this.edamamService = new EdamamNutritionService();
  }

  async searchFood(query: string): Promise<FoodSearchResult[]> {
    // Try USDA first (preferred)
    const usdaResults = await this.usdaService.searchFood(query);
    if (usdaResults && usdaResults.length > 0) {
      return usdaResults;
    }

    // Fallback to Edamam if USDA returns no results
    console.log('🔄 USDA returned no results, trying Edamam...');
    const edamamResults = await this.edamamService.searchFood(query);
    if (edamamResults && edamamResults.length > 0) {
      return edamamResults;
    }

    // Final fallback - use Edamam's fallback
    return this.edamamService['getFallbackResults'](query);
  }

  async getFoodDetails(foodId: string): Promise<FoodSearchResult | null> {
    // Try USDA first
    const usdaResult = await this.usdaService.getFoodDetails(foodId);
    if (usdaResult) {
      return usdaResult;
    }

    // Fallback to Edamam
    return await this.edamamService.getFoodDetails(foodId);
  }

  async calculateNutrition(foodId: string, quantity: number, unit: string): Promise<FoodSearchResult['nutrients'] | null> {
    // Get food details first
    const food = await this.getFoodDetails(foodId);
    if (!food) {
      return null;
    }

    // Calculate nutrition for the specified quantity
    return calculateNutritionForQuantity(food, quantity, unit);
  }
}

