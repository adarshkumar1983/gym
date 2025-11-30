# 🥗 Nutrition Tracking Feature - Implementation Guide

## Overview
Enterprise-grade nutrition tracking system with food database integration, meal logging, and goal tracking.

## Architecture

### Models
- **NutritionLog**: Daily nutrition summary
- **Meal**: Individual meals (breakfast, lunch, dinner, snack)
- **MealPlan**: Pre-built meal plans (premium feature)
- **NutritionGoal**: User's daily nutrition targets

### Services
- **nutrition-api.service.ts**: External API integration (Edamam) with caching & rate limiting
- **nutrition-calculator.service.ts**: BMR/TDEE calculations, macro distribution

### Controllers
- **nutrition.controller.ts**: RESTful API endpoints

## API Endpoints

### Food Search
```
GET /api/nutrition/food/search?query=chicken
```
**Response:**
```json
{
  "success": true,
  "data": {
    "foods": [
      {
        "foodId": "chicken-breast",
        "label": "Chicken Breast",
        "nutrients": {
          "calories": 165,
          "protein": 31,
          "carbs": 0,
          "fat": 3.6
        },
        "servingSizes": [...]
      }
    ],
    "count": 1
  }
}
```

### Get Today's Nutrition
```
GET /api/nutrition/today
```
**Response:**
```json
{
  "success": true,
  "data": {
    "nutritionLog": {
      "totalCalories": 1850,
      "totalProtein": 120,
      "totalCarbs": 200,
      "totalFats": 65,
      "meals": [...]
    },
    "goal": {
      "targetCalories": 2000,
      "targetProtein": 150,
      ...
    },
    "remaining": {
      "calories": 150,
      "protein": 30,
      "percentages": {
        "calories": 92.5,
        "protein": 80
      }
    }
  }
}
```

### Add Meal
```
POST /api/nutrition/meals
Body: {
  "mealType": "lunch",
  "foodItems": [
    {
      "name": "Chicken Breast",
      "quantity": 200,
      "unit": "g",
      "calories": 330,
      "protein": 62,
      "carbs": 0,
      "fats": 7.2
    }
  ],
  "consumedAt": "2024-01-15T12:00:00Z",
  "notes": "Grilled chicken"
}
```

### Set Nutrition Goal
```
POST /api/nutrition/goals
Body: {
  "targetCalories": 2000,
  "targetProtein": 150,
  "targetCarbs": 200,
  "targetFats": 65,
  "goalType": "weight-loss",
  "activityLevel": "moderate"
}
```

### Get Meal Plans
```
GET /api/nutrition/meal-plans?category=weight-loss&difficulty=beginner
```

### Get Nutrition History
```
GET /api/nutrition/history?startDate=2024-01-01&endDate=2024-01-31&limit=30
```

## Environment Variables

Add to `.env`:
```bash
# USDA FoodData Central API (FREE, unlimited, recommended)
USDA_API_KEY=your_api_key

# Optional: Edamam as fallback (Free tier: 10,000 requests/month)
EDAMAM_APP_ID=your_app_id
EDAMAM_API_KEY=your_api_key
```

**Get API keys:**
- **USDA** (Recommended): https://fdc.nal.usda.gov/api-guide.html (FREE, no limits)
- **Edamam**: https://developer.edamam.com/ (10K/month free tier)

## Features

### ✅ Implemented
- Food search with external API integration
- Meal logging with automatic nutrition calculation
- Daily nutrition tracking
- Nutrition goal setting
- BMR/TDEE calculation
- Macro distribution based on goals
- Remaining calories/macros calculation
- Caching for API responses (1 hour)
- Rate limiting (30 requests/minute)
- Fallback food database

### 🚧 Coming Soon
- Meal plan templates
- Premium subscription checks
- Barcode scanning
- Meal photo uploads
- Nutrition analytics/charts
- Water intake tracking
- Recipe builder

## Database Indexes

Optimized indexes for performance:
- `NutritionLog`: `{ userId: 1, date: -1 }` (unique)
- `Meal`: `{ userId: 1, consumedAt: -1 }`
- `NutritionGoal`: `{ userId: 1, isActive: 1 }` (unique)

## Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

## Rate Limiting

- Food search: 30 requests/minute per server instance
- Cached responses: 1 hour TTL
- Fallback to common foods if API unavailable

## Next Steps

1. **Mobile UI**: Create nutrition tracking screens
2. **Premium Integration**: Add subscription checks
3. **Meal Plans**: Build meal plan templates
4. **Analytics**: Add charts and progress tracking
5. **Image Upload**: Integrate S3/Cloudinary for meal photos

