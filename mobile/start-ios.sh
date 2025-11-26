#!/bin/bash
# Start iOS Simulator manually first, then start Expo

echo "📱 Starting iOS Simulator..."
open -a Simulator

echo "⏳ Waiting for simulator to be ready..."
sleep 5

echo "🚀 Starting Expo..."
npx expo start --ios
