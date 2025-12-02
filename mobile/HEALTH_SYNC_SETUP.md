# Health Sync Setup Guide

This guide explains how to set up health data syncing with Apple Health, Google Fit, and Fitbit.

## Overview

The health sync feature allows users to sync their health data from wearable devices and health apps to get richer metrics in the gym app. Supported sources:

- **Apple Health** (iOS only)
- **Google Fit** (Android only)
- **Fitbit** (iOS & Android)

## Features

- Steps tracking
- Heart rate monitoring
- Workout data sync
- Distance tracking
- Active calories
- Sleep data (optional)
- Weight tracking (optional)

## Setup Instructions

### 1. Install Required Packages

For **Apple Health** (iOS):
```bash
npm install react-native-health
# or
npm install expo-health
```

For **Google Fit** (Android):
```bash
npm install react-native-google-fit
```

For **Fitbit**:
```bash
npm install @fitbit/api-client
```

### 2. iOS Setup (Apple Health)

1. Add HealthKit capability in Xcode:
   - Open `ios/YourApp.xcworkspace` in Xcode
   - Select your target → Signing & Capabilities
   - Click "+ Capability" → Add "HealthKit"

2. Add permissions to `Info.plist`:
```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your health data to sync steps, heart rate, and workouts.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>We need access to write workout data to Apple Health.</string>
```

3. Request permissions in code:
```typescript
import { healthSyncAPI } from './lib/health-sync';

// Request permissions
const hasPermission = await healthSyncAPI.requestAppleHealthPermissions();
```

### 3. Android Setup (Google Fit)

1. Get Google Fit API credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Fit API
   - Create OAuth 2.0 credentials
   - Add your app's package name and SHA-1 fingerprint

2. Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-fitness:21.0.1'
}
```

3. Add permissions to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
```

4. Request permissions in code:
```typescript
import { healthSyncAPI } from './lib/health-sync';

// Request permissions
const hasPermission = await healthSyncAPI.requestGoogleFitPermissions();
```

### 4. Fitbit Setup

1. Create a Fitbit app:
   - Go to [Fitbit Developer Portal](https://dev.fitbit.com/)
   - Create a new app
   - Get Client ID and Client Secret
   - Set OAuth 2.0 redirect URI

2. Add Fitbit credentials to backend `.env`:
```env
FITBIT_CLIENT_ID=your_client_id
FITBIT_CLIENT_SECRET=your_client_secret
FITBIT_REDIRECT_URI=your_redirect_uri
```

3. Implement OAuth flow:
   - User authorizes app via Fitbit OAuth
   - Store access token and refresh token
   - Use tokens to fetch health data

## Usage

### Syncing Health Data

```typescript
import { healthSyncAPI } from './lib/health-sync';

// Sync today's data
const healthData = {
  date: new Date().toISOString(),
  source: 'apple-health', // or 'google-fit', 'fitbit'
  steps: 8500,
  distanceMeters: 6500,
  averageHeartRate: 72,
  activeCalories: 450,
};

const response = await healthSyncAPI.syncHealthData(healthData);
```

### Getting Health Data

```typescript
// Get today's data
const today = await healthSyncAPI.getTodayHealthData();

// Get data for date range
const range = await healthSyncAPI.getHealthData(
  '2024-01-01',
  '2024-01-31',
  'apple-health'
);

// Get aggregated stats
const stats = await healthSyncAPI.getHealthStats('2024-01-01', '2024-01-31');
```

### Managing Sync Settings

```typescript
// Get settings
const settings = await healthSyncAPI.getSyncSettings();

// Update settings
await healthSyncAPI.updateSyncSettings({
  autoSync: true,
  syncFrequency: 'hourly',
  syncSteps: true,
  syncHeartRate: true,
});
```

## Backend API Endpoints

- `POST /api/health/sync` - Sync health data
- `GET /api/health/today` - Get today's health data
- `GET /api/health/data` - Get health data (with date range)
- `GET /api/health/stats` - Get aggregated stats
- `GET /api/health/settings` - Get sync settings
- `PUT /api/health/settings` - Update sync settings
- `DELETE /api/health/data/:id` - Delete health data

## Data Models

### HealthData
- `userId` - User ID
- `date` - Date of the data
- `source` - Data source (apple-health, google-fit, fitbit, manual)
- `steps` - Number of steps
- `distanceMeters` - Distance in meters
- `restingHeartRate` - Resting heart rate (bpm)
- `averageHeartRate` - Average heart rate (bpm)
- `maxHeartRate` - Maximum heart rate (bpm)
- `activeCalories` - Active calories burned
- `workoutDuration` - Workout duration (minutes)
- `activeMinutes` - Active minutes
- And more...

### HealthSyncSettings
- `userId` - User ID
- `appleHealthEnabled` - Enable Apple Health sync
- `googleFitEnabled` - Enable Google Fit sync
- `fitbitEnabled` - Enable Fitbit sync
- `autoSync` - Auto-sync enabled
- `syncFrequency` - Sync frequency (realtime, hourly, daily)
- `syncSteps` - Sync steps data
- `syncHeartRate` - Sync heart rate data
- And more...

## Security Notes

- OAuth tokens are stored encrypted in the database
- Tokens are not returned in API responses by default
- Use secure storage for tokens on mobile devices
- Implement token refresh for long-lived sessions

## Troubleshooting

### iOS - HealthKit permissions not working
- Check that HealthKit capability is enabled
- Verify Info.plist permissions are set
- Ensure app is running on a physical device (not simulator)

### Android - Google Fit not connecting
- Verify OAuth credentials are correct
- Check SHA-1 fingerprint matches
- Ensure Google Fit API is enabled in Cloud Console

### Fitbit - OAuth flow failing
- Verify redirect URI matches exactly
- Check client ID and secret are correct
- Ensure app is approved (if in production)

## Next Steps

1. Implement native health data reading (see TODO comments in `health-sync.ts`)
2. Add automatic background sync
3. Create health data visualization charts
4. Add health goals and targets
5. Implement data export functionality

