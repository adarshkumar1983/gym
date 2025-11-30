# 🥗 USDA FoodData Central API Setup

## Why USDA?

✅ **100% FREE** - No monthly limits, no credit card required  
✅ **300,000+ foods** - Most comprehensive database  
✅ **Government-backed** - Most authoritative nutrition data  
✅ **No rate limits** - Use as much as needed  
✅ **Production-ready** - Used by major apps  

## Quick Setup (2 minutes)

### Step 1: Get API Key

1. Visit: **https://fdc.nal.usda.gov/api-guide.html**
2. Click **"Get an API Key"**
3. Fill out the form (name, email, organization)
4. **No credit card required!**
5. Copy your API key

### Step 2: Add to Environment

Add to `server/.env`:

```bash
# USDA FoodData Central API (FREE, unlimited)
USDA_API_KEY=your_api_key_here

# Optional: Edamam as fallback (if you have it)
EDAMAM_APP_ID=your_app_id
EDAMAM_API_KEY=your_api_key
```

### Step 3: Restart Server

```bash
cd server
npm run dev
```

## ✅ Done!

The app now uses:
1. **USDA** (primary) - Free, unlimited, authoritative
2. **Edamam** (fallback) - If USDA has no results
3. **Local fallback** - Common foods if both APIs fail

## API Endpoints

The nutrition service automatically uses USDA:

```typescript
// Search food
GET /api/nutrition/food/search?query=chicken

// Response includes USDA data:
{
  "success": true,
  "data": {
    "foods": [
      {
        "foodId": "173944",
        "label": "Chicken, broiler, breast, meat only, raw",
        "brand": null,
        "nutrients": {
          "calories": 120,
          "protein": 23.09,
          "carbs": 0,
          "fat": 1.24
        }
      }
    ]
  }
}
```

## Benefits Over Edamam

| Feature | USDA | Edamam |
|---------|------|--------|
| Cost | ✅ FREE | ⚠️ 10K/month free |
| Database | ✅ 300K+ foods | ~1M (many duplicates) |
| Authority | ✅ Government | Commercial |
| Rate Limits | ✅ None | ⚠️ 10K/month |
| Branded Foods | ✅ Yes | Yes |

## Testing

Test the API:

```bash
# Search for chicken
curl "http://localhost:3000/api/nutrition/food/search?query=chicken"

# Should return USDA results
```

## Troubleshooting

**No results?**
- Check API key is correct
- Verify server restarted
- Check server logs for errors

**API key not working?**
- Make sure you copied the full key
- Check for extra spaces in `.env`
- Verify key at: https://fdc.nal.usda.gov/api-guide.html

## Documentation

- **USDA API Guide**: https://fdc.nal.usda.gov/api-guide.html
- **API Documentation**: https://fdc.nal.usda.gov/api-spec/fdc_api.html
- **Example Requests**: https://fdc.nal.usda.gov/api-spec/fdc_api.html#/FDC/getFood

---

**Status**: ✅ USDA integration complete  
**Next**: Test food search in mobile app

