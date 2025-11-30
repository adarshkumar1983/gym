# USDA FoodData Central vs Edamam - API Comparison

## 📊 Quick Comparison

| Feature | USDA FoodData Central | Edamam |
|---------|----------------------|--------|
| **Cost** | ✅ **100% FREE** (No limits) | ⚠️ Free: 10K/month, Paid: $99+/month |
| **Data Source** | ✅ Government (USDA) - Most authoritative | Commercial database |
| **Database Size** | ✅ **300,000+ foods** | ~1M foods (but many duplicates) |
| **Data Types** | ✅ Foundation, Branded, Experimental, SR Legacy | Branded + Generic |
| **Accuracy** | ✅ **Highest** (Government research) | High (commercial) |
| **API Key** | ✅ Required (free registration) | Required |
| **Rate Limits** | ✅ **No hard limits** (reasonable use) | 10K/month free tier |
| **Updates** | ✅ Regular government updates | Regular updates |
| **Branded Foods** | ✅ Yes (extensive) | Yes |
| **International** | ⚠️ US-focused | ✅ Global |
| **Ease of Use** | ⚠️ More complex API | ✅ Simpler API |

## 🏆 Winner: **USDA FoodData Central**

### Why USDA is Better:
1. **100% Free Forever** - No monthly limits, no credit card
2. **Most Authoritative** - Government-backed research data
3. **Larger Database** - 300K+ foods with detailed nutrients
4. **No Rate Limits** - Use as much as needed (within reason)
5. **Multiple Data Types** - Foundation, Branded, Experimental
6. **Better for US Market** - Comprehensive US food data

### When to Use Edamam:
- Need international foods
- Want simpler API integration
- Already have paid subscription

## 📝 USDA API Details

### Endpoints:
```
GET /fdc/v1/foods/search?query=chicken&api_key=YOUR_KEY
GET /fdc/v1/food/{fdcId}?api_key=YOUR_KEY
GET /fdc/v1/foods?fdcIds=123456,789012&api_key=YOUR_KEY
```

### Response Format:
```json
{
  "foods": [
    {
      "fdcId": 173944,
      "description": "Chicken, broiler, breast, meat only, raw",
      "dataType": "Foundation",
      "foodNutrients": [
        {
          "nutrientId": 1008,
          "nutrientName": "Energy",
          "value": 120,
          "unitName": "KCAL"
        },
        {
          "nutrientId": 1003,
          "nutrientName": "Protein",
          "value": 23.09,
          "unitName": "G"
        }
      ]
    }
  ],
  "totalHits": 500,
  "currentPage": 1,
  "totalPages": 50
}
```

### Registration:
1. Visit: https://fdc.nal.usda.gov/api-guide.html
2. Sign up for free API key
3. No credit card required
4. Instant access

## 🔄 Recommendation

**Switch to USDA FoodData Central** because:
- ✅ Free forever (no monthly limits)
- ✅ More authoritative data
- ✅ Better for production apps
- ✅ No subscription worries

**Keep Edamam as fallback** for:
- International foods
- Backup when USDA is down

