# Health Sync API Documentation

## Overview

The Health Sync API allows users to sync health data from wearable devices (Apple Health, Google Fit, Fitbit) to the gym app for richer metrics and progress tracking.

## Endpoints

### Sync Health Data
**POST** `/api/health/sync`

Sync health data from a wearable device or manual entry.

**Request Body:**
```json
{
  "date": "2024-01-15T00:00:00.000Z",
  "source": "apple-health",
  "steps": 8500,
  "distanceMeters": 6500,
  "restingHeartRate": 65,
  "averageHeartRate": 72,
  "maxHeartRate": 145,
  "activeCalories": 450,
  "totalCalories": 2200,
  "workoutDuration": 45,
  "workoutType": "running",
  "activeMinutes": 30,
  "sleepHours": 7.5,
  "sleepQuality": "good",
  "weight": 75.5,
  "bodyFatPercentage": 18.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "healthData": {
      "_id": "...",
      "userId": "...",
      "date": "2024-01-15T00:00:00.000Z",
      "source": "apple-health",
      "steps": 8500,
      "syncedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Today's Health Data
**GET** `/api/health/today`

Get today's health data for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "healthData": {
      "_id": "...",
      "userId": "...",
      "date": "2024-01-15T00:00:00.000Z",
      "source": "apple-health",
      "steps": 8500,
      "distanceMeters": 6500,
      "averageHeartRate": 72,
      "activeCalories": 450
    }
  }
}
```

### Get Health Data (Date Range)
**GET** `/api/health/data?startDate=2024-01-01&endDate=2024-01-31&source=apple-health`

Get health data within a date range.

**Query Parameters:**
- `startDate` (optional) - Start date (ISO string)
- `endDate` (optional) - End date (ISO string)
- `source` (optional) - Filter by source (apple-health, google-fit, fitbit, manual)

**Response:**
```json
{
  "success": true,
  "data": {
    "healthData": [
      {
        "_id": "...",
        "date": "2024-01-15T00:00:00.000Z",
        "source": "apple-health",
        "steps": 8500
      }
    ]
  }
}
```

### Get Health Stats
**GET** `/api/health/stats?startDate=2024-01-01&endDate=2024-01-31`

Get aggregated health statistics for a date range.

**Query Parameters:**
- `startDate` (optional) - Start date (defaults to 7 days ago)
- `endDate` (optional) - End date (defaults to today)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalSteps": 59500,
      "totalDistance": 45500,
      "avgRestingHeartRate": 65,
      "totalActiveCalories": 3150,
      "totalWorkoutDuration": 315,
      "avgActiveMinutes": 30
    }
  }
}
```

### Get Sync Settings
**GET** `/api/health/settings`

Get user's health sync settings (tokens are not returned).

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "_id": "...",
      "userId": "...",
      "appleHealthEnabled": true,
      "googleFitEnabled": false,
      "fitbitEnabled": false,
      "autoSync": true,
      "syncFrequency": "hourly",
      "syncSteps": true,
      "syncHeartRate": true,
      "syncWorkouts": true,
      "syncSleep": false,
      "syncWeight": false,
      "lastSyncAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update Sync Settings
**PUT** `/api/health/settings`

Update user's health sync settings.

**Request Body:**
```json
{
  "appleHealthEnabled": true,
  "autoSync": true,
  "syncFrequency": "hourly",
  "syncSteps": true,
  "syncHeartRate": true,
  "syncWorkouts": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "_id": "...",
      "appleHealthEnabled": true,
      "autoSync": true
    }
  }
}
```

### Delete Health Data
**DELETE** `/api/health/data/:id`

Delete a specific health data entry.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Health data deleted successfully"
  }
}
```

## Authentication

All endpoints require authentication via session cookie or Bearer token.

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": {
    "message": "Error message here"
  }
}
```

## Data Sources

- `apple-health` - Apple HealthKit (iOS only)
- `google-fit` - Google Fit (Android only)
- `fitbit` - Fitbit (iOS & Android)
- `manual` - Manually entered data

## Notes

- Health data is stored per user, per date, per source (unique constraint)
- OAuth tokens are stored encrypted and not returned in API responses
- Automatic sync can be configured via settings
- Data can be aggregated across multiple sources

