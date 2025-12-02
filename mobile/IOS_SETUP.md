# iOS Development Setup Guide

## Issue: Code Signing Required

When using native modules (like `react-native-health`), you need a development build. Expo Go won't work with these modules.

## Solutions

### Option 1: Use iOS Simulator (Recommended for Development)

iOS Simulator doesn't require code signing. Use this for development:

```bash
# Start iOS Simulator first
open -a Simulator

# Then build for simulator (no code signing needed)
npx expo run:ios --device
```

Or use the existing script:
```bash
./start-ios.sh
```

### Option 2: Use EAS Build (Easiest for Physical Devices)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure EAS:
```bash
eas build:configure
```

4. Build for iOS:
```bash
eas build --platform ios --profile development
```

This will create a development build that you can install on your device.

### Option 3: Set Up Code Signing in Xcode

1. Open Xcode:
```bash
open mobile/ios/GymMobile.xcworkspace
```

2. Select your project in the navigator
3. Go to **Signing & Capabilities**
4. Select your **Team** (requires Apple Developer account - free account works)
5. Xcode will automatically manage certificates

**For Free Apple Developer Account:**
- Sign in with your Apple ID in Xcode
- Select "Automatically manage signing"
- Xcode will create certificates automatically

### Option 4: Use Expo Development Build Locally

1. Install development build dependencies:
```bash
cd mobile
npx expo install expo-dev-client
```

2. Build development client:
```bash
npx expo run:ios --device
```

## Quick Fix for Simulator

Since you're developing, the easiest is to use the iOS Simulator:

```bash
# Make sure simulator is running
open -a Simulator

# Build for simulator (no code signing)
cd mobile
npx expo run:ios --simulator
```

Or modify your package.json script:
```json
{
  "ios": "expo start --ios"
}
```

Then use Expo Go for basic testing (but note: native health modules won't work in Expo Go).

## For Native Modules (Health Sync)

Since you're using `react-native-health` and `react-native-google-fit`, you **must** use a development build, not Expo Go.

**Best approach for development:**
1. Use iOS Simulator (no code signing needed)
2. Or set up free Apple Developer account for physical device testing

## Testing Health Features

**Important:** 
- HealthKit only works on **physical devices**, not simulators
- For testing HealthKit, you'll need:
  - Physical iOS device
  - Apple Developer account (free works)
  - Code signing set up

For now, you can:
- Test other features in simulator
- Test HealthKit features later on a physical device

