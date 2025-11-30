/**
 * Nutrition API Service
 * Main export for nutrition API integration
 * Uses multi-provider service (USDA primary, Edamam fallback)
 */

export { FoodSearchResult, NutritionApiService } from './types';
export { MultiProviderNutritionService } from './multi-provider.service';
export { USDANutritionService } from './usda-api.service';
export { EdamamNutritionService } from './edamam-api.service';

import { MultiProviderNutritionService } from './multi-provider.service';

// Export multi-provider service instance (USDA primary, Edamam fallback)
export const nutritionApiService = new MultiProviderNutritionService();
