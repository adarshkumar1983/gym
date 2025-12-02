# Health Sync Implementation - Complete Guide

## ✅ Implementation Status

All native health integrations have been fully implemented! Here's what's ready:

### Mobile App
- ✅ Apple HealthKit integration (iOS)
- ✅ Google Fit integration (Android)  
- ✅ Fitbit OAuth integration (iOS & Android)
- ✅ Health sync service with auto-sync
- ✅ Permission requests
- ✅ Data reading from all sources
- ✅ UI integration in Progress screen

### Backend
- ✅ Fitbit OAuth endpoints
- ✅ Token management
- ✅ Health data storage
- ✅ Sync settings management

## 📦 Installed Packages

### Mobile (`mobile/package.json`)
```json
{
  "react-native-health": "^1.19.0",
  "react-native-google-fit": "^0.13.0"
}
```

### Server (`server/package.json`)
```json
{
  "axios": "^1.6.2"
}
```

## 🔧 Configuration Required

### 1. Backend Environment Variables

Add to `server/.env`:

```env
# Fitbit OAuth
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
FITBIT_REDIRECT_URI=http://localhost:3000/api/health/fitbit/callback
```

### 2. Fitbit App Setup

1. Go to https://dev.fitbit.com/
2. Register/Login
3. Click "Register a New App"
4. Fill in:
   - **Application Name**: Your App Name
   - **Description**: App description
   - **Application Website**: Your website
   - **OAuth 2.0 Application Type**: Personal
   - **Callback URL**: `http://localhost:3000/api/health/fitbit/callback`
   - **Default Access Type**: Read Only
5. Save and copy **Client ID** and **Client Secret**
6. Add to your `.env` file

### 3. iOS Setup (Apple HealthKit)

1. Open `ios/YourApp.xcworkspace` in Xcode
2. Select your app target
3. Go to **Signing & Capabilities** tab
4. Click **"+ Capability"**
5. Add **"HealthKit"**
6. Permissions are already configured in `app.json`

**Note:** HealthKit only works on physical devices, not simulators.

### 4. Android Setup (Google Fit)

1. Go to https://console.cloud.google.com/
2. Create/Select project
3. Enable **Google Fitness API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - Application type: Android
   - Package name: `com.gym.mobile`
   - SHA-1 certificate fingerprint: Get from `keytool -list -v -keystore ~/.android/debug.keystore`
6. Create and save credentials

Add to `server/.env` (optional, for server-side OAuth):
```env
GOOGLE_FIT_CLIENT_ID=your_google_fit_client_id
GOOGLE_FIT_CLIENT_SECRET=your_google_fit_client_secret
```

## 🚀 Usage

### Request Permissions

```typescript
import { healthSyncAPI } from './lib/health-sync';

// Apple Health (iOS)
const appleGranted = await healthSyncAPI.requestAppleHealthPermissions();

// Google Fit (Android)
const googleGranted = await healthSyncAPI.requestGoogleFitPermissions();

// Fitbit (iOS & Android)
const fitbitGranted = await healthSyncAPI.requestFitbitAuthorization();
```

### Sync Health Data

```typescript
// Sync from specific source
const appleResult = await healthSyncAPI.syncAppleHealth();
const googleResult = await healthSyncAPI.syncGoogleFit();
const fitbitResult = await healthSyncAPI.syncFitbit();

// Auto-sync all enabled sources
const results = await healthSyncAPI.autoSync();
```

### Read Health Data

```typescript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');

// Read steps
const steps = await healthSyncAPI.readAppleHealthSteps(startDate, endDate);

// Read heart rate
const heartRate = await healthSyncAPI.readAppleHealthHeartRate(startDate, endDate);
```

## 📱 Testing

### Test on iOS (Apple Health)
1. Build and run on physical device
2. Open app → Progress screen
3. Tap "Sync Now"
4. Grant HealthKit permissions
5. Data should sync automatically

### Test on Android (Google Fit)
1. Build and run on device/emulator
2. Open app → Progress screen
3. Tap "Sync Now"
4. Authorize Google Fit
5. Data should sync automatically

### Test Fitbit
1. Ensure Fitbit credentials are in `.env`
2. Open app → Progress screen
3. Tap "Sync Now"
4. Select Fitbit
5. Complete OAuth flow in browser
6. Data should sync automatically

## 🔍 API Endpoints

### Fitbit OAuth
- `GET /api/health/fitbit/auth-url` - Get OAuth URL
- `GET /api/health/fitbit/callback` - OAuth callback
- `POST /api/health/fitbit/refresh` - Refresh token

### Health Data
- `POST /api/health/sync` - Sync health data
- `GET /api/health/today` - Get today's data
- `GET /api/health/data` - Get data for date range
- `GET /api/health/stats` - Get aggregated stats
- `GET /api/health/settings` - Get sync settings
- `PUT /api/health/settings` - Update sync settings

## 🐛 Troubleshooting

### iOS HealthKit Issues
- ✅ Ensure HealthKit capability is enabled in Xcode
- ✅ Test on physical device (not simulator)
- ✅ Check iOS Settings → Privacy → Health → Your App
- ✅ Verify Info.plist has permission descriptions

### Android Google Fit Issues
- ✅ Verify OAuth credentials are correct
- ✅ Check SHA-1 fingerprint matches
- ✅ Ensure Google Fit API is enabled
- ✅ Check app has ACTIVITY_RECOGNITION permission

### Fitbit OAuth Issues
- ✅ Verify redirect URI matches exactly
- ✅ Check client ID and secret are correct
- ✅ Ensure app is approved (for production)
- ✅ Check network connectivity
- ✅ Verify tokens are being stored

## 📝 Notes

- **HealthKit** requires physical iOS device
- **Google Fit** works on Android devices and emulators
- **Fitbit** works on both iOS and Android
- Tokens are stored securely using SecureStore
- Auto-refresh is handled automatically
- All data is synced to backend for persistence

## ✨ Features

- ✅ Steps tracking
- ✅ Heart rate monitoring
- ✅ Distance tracking
- ✅ Active calories
- ✅ Multiple data sources
- ✅ Auto-sync configuration
- ✅ Secure token storage
- ✅ Token refresh handling
- ✅ Error handling and fallbacks
- ✅ UI integration

## 🎉 Ready to Use!

All health integrations are fully implemented and ready for testing. Follow the configuration steps above to enable each health source.

