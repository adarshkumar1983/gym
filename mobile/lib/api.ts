import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { getApiUrl } from './config';

// API base URL - adjust this to match your server
// For iOS Simulator: use http://localhost:3000
// For Android Emulator: use http://10.0.2.2:3000
// For physical device: use http://YOUR_COMPUTER_IP:3000
const API_BASE_URL = getApiUrl();

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // For mobile, cookies are handled automatically by axios with withCredentials
    // But we can also store session info if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Store cookies if needed (for better-auth session management)
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      // Cookies are automatically handled by axios with withCredentials: true
      // But we can store session info for persistence
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Clear any stored auth data on unauthorized
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role?: string;
    };
    session?: any;
  };
  error?: {
    message: string;
  };
}

// Auth API functions
export const authAPI = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/sign-up', data);
    return response.data;
  },

  signIn: async (data: SignInData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/sign-in', data, {
      withCredentials: true,
    });
    
    // Store session cookie/token if provided
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      // Extract token from cookie if needed
      // Better Auth uses cookies, so we might need to handle this differently
    }
    
    return response.data;
  },

  signOut: async (): Promise<void> => {
    await apiClient.post('/api/auth/sign-out');
    await SecureStore.deleteItemAsync('auth_token');
  },

  getSession: async (): Promise<AuthResponse> => {
    const response = await apiClient.get('/api/auth/session', {
      withCredentials: true,
    });
    return response.data;
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await apiClient.get('/api/auth/me', {
      withCredentials: true,
    });
    return response.data;
  },
};

export default apiClient;

