// API Configuration
// For iOS Simulator: use http://localhost:3000
// For Android Emulator: use http://10.0.2.2:3000
// For physical device: use http://YOUR_COMPUTER_IP:3000

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
};

// Helper to get the correct API URL based on platform
export const getApiUrl = () => {
  // You can customize this based on your setup
  return API_CONFIG.BASE_URL;
};

