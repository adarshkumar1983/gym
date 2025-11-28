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
    // Fix old Better Auth endpoints to use new v1.4.1 endpoints
    if (config.url === '/api/auth/sign-up' && config.method?.toLowerCase() === 'post') {
      console.warn(`⚠️ [API Interceptor] Redirecting old endpoint /api/auth/sign-up to /api/auth/sign-up/email`);
      config.url = '/api/auth/sign-up/email';
    }
    if (config.url === '/api/auth/sign-in' && config.method?.toLowerCase() === 'post') {
      console.warn(`⚠️ [API Interceptor] Redirecting old endpoint /api/auth/sign-in to /api/auth/sign-in/email`);
      config.url = '/api/auth/sign-in/email';
    }
    
    // Ensure Origin header is set for Better Auth endpoints
    if (config.url?.includes('/api/auth/')) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      if (!config.headers['Origin']) {
        config.headers['Origin'] = API_BASE_URL;
      }
    }
    
    console.log(`📤 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`   Base URL: ${config.baseURL}`);
    console.log(`   Full URL: ${config.baseURL}${config.url}`);
    console.log(`   Headers:`, JSON.stringify(config.headers, null, 2));
    console.log(`   Data:`, config.data ? JSON.stringify(config.data, null, 2) : 'No data');
    console.log(`   With Credentials: ${config.withCredentials}`);
    
    // For mobile, cookies are handled automatically by axios with withCredentials
    // But we can also store session info if needed
    return config;
  },
  (error) => {
    console.error(`❌ [API Request Error]`, error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 [API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
    
    // Store cookies if needed (for better-auth session management)
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      console.log(`   🍪 Set-Cookie header found:`, setCookie);
      // Cookies are automatically handled by axios with withCredentials: true
      // But we can store session info for persistence
    }
    return response;
  },
  async (error) => {
    console.error(`❌ [API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error(`   Status: ${error.response?.status} ${error.response?.statusText}`);
    console.error(`   Response Data:`, error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No data');
    console.error(`   Error Message:`, error.message);
    
    if (error.response?.status === 401) {
      console.warn(`   ⚠️ Unauthorized - clearing auth token`);
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
    // Better Auth v1.4.1 uses /sign-up/email endpoint (NOT /sign-up)
    console.log(`[authAPI.signUp] Calling /api/auth/sign-up/email`);
    try {
      const response = await apiClient.post('/api/auth/sign-up/email', data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Origin': API_BASE_URL, // Better Auth requires Origin header
        },
      });
      
      // Better Auth returns { token, user } format, normalize to our expected format
      const betterAuthResponse = response.data;
      if (betterAuthResponse.user) {
        return {
          success: true,
          data: {
            user: betterAuthResponse.user,
            session: betterAuthResponse.token ? { token: betterAuthResponse.token } : undefined,
          },
        };
      }
      
      // If response doesn't match expected format, check for error
      if (betterAuthResponse.error || betterAuthResponse.message) {
        return {
          success: false,
          error: {
            message: betterAuthResponse.error?.message || betterAuthResponse.message || 'Registration failed',
          },
        };
      }
      
      // Unknown format
      return {
        success: false,
        error: { message: 'Unexpected response format' },
      };
    } catch (error: any) {
      // Handle axios errors
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: {
            message: errorData.error?.message || errorData.message || 'Registration failed',
          },
        };
      }
      throw error; // Re-throw if it's not an axios error
    }
  },

  signIn: async (data: SignInData): Promise<AuthResponse> => {
    // Better Auth v1.4.1 uses /sign-in/email endpoint (NOT /sign-in)
    console.log(`[authAPI.signIn] Calling /api/auth/sign-in/email`);
    try {
      const response = await apiClient.post('/api/auth/sign-in/email', data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Origin': API_BASE_URL, // Better Auth requires Origin header
        },
      });
      
      // Better Auth returns { token, user } format, normalize to our expected format
      const betterAuthResponse = response.data;
      if (betterAuthResponse.user) {
        return {
          success: true,
          data: {
            user: betterAuthResponse.user,
            session: betterAuthResponse.token ? { token: betterAuthResponse.token } : undefined,
          },
        };
      }
      
      // If response doesn't match expected format, check for error
      if (betterAuthResponse.error || betterAuthResponse.message) {
        return {
          success: false,
          error: {
            message: betterAuthResponse.error?.message || betterAuthResponse.message || 'Login failed',
          },
        };
      }
      
      // Unknown format
      return {
        success: false,
        error: { message: 'Unexpected response format' },
      };
    } catch (error: any) {
      // Handle axios errors
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: {
            message: errorData.error?.message || errorData.message || 'Login failed',
          },
        };
      }
      throw error; // Re-throw if it's not an axios error
    }
  },

  signOut: async (): Promise<void> => {
    console.log(`[authAPI.signOut] Calling /api/auth/sign-out`);
    await apiClient.post('/api/auth/sign-out', {}, {
      headers: {
        'Origin': API_BASE_URL, // Better Auth requires Origin header
      },
    });
    await SecureStore.deleteItemAsync('auth_token');
  },

  getSession: async (): Promise<AuthResponse> => {
    try {
      const response = await apiClient.get('/api/auth/session', {
        withCredentials: true,
      });
      
      // Our custom endpoint returns { success: true, data: { session, user } }
      const responseData = response.data;
      
      if (responseData.success && responseData.data) {
        // Extract user from response.data.user or response.data.session.user
        const user = responseData.data.user || responseData.data.session?.user;
        
        if (user) {
          return {
            success: true,
            data: {
              user,
              session: responseData.data.session,
            },
          };
        }
      }
      
      // If format doesn't match expected structure
      return {
        success: false,
        error: { message: 'Invalid session response format' },
      };
    } catch (error: any) {
      // Handle axios errors
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: {
            message: errorData.error?.message || errorData.message || 'Failed to get session',
          },
        };
      }
      throw error;
    }
  },

  getMe: async (): Promise<AuthResponse> => {
    try {
      const response = await apiClient.get('/api/auth/me', {
        withCredentials: true,
      });
      
      // Our custom endpoint returns { success: true, data: { user } }
      const responseData = response.data;
      
      if (responseData.success && responseData.data?.user) {
        return {
          success: true,
          data: {
            user: responseData.data.user,
          },
        };
      }
      
      // If format doesn't match expected structure
      return {
        success: false,
        error: { message: 'Invalid user response format' },
      };
    } catch (error: any) {
      // Handle axios errors
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: {
            message: errorData.error?.message || errorData.message || 'Failed to get user',
          },
        };
      }
      throw error;
    }
  },
};

export default apiClient;

