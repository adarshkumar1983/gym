import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    
    // Add Bearer token if available
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        if (!config.headers) {
          config.headers = {} as any;
        }
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log(`   🔑 Added Bearer token to request`);
      } else {
        console.log(`   ⚠️ No auth token found in SecureStore`);
      }
    } catch (error) {
      console.warn('   ⚠️ Error retrieving auth token:', error);
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
      // In React Native, cookies need to be manually managed
      // Better Auth uses cookies, but React Native doesn't handle them automatically
      // The withCredentials: true should help, but cookies might not persist
    }
    
    // Check if response contains a session token (Better Auth might return this)
    // Better Auth returns token in nested structure: data.session.session.token
    const token = response.data?.session?.session?.token || 
                  response.data?.session?.token || 
                  response.data?.token;
    if (token) {
      console.log(`   🔑 Storing auth token from response`);
      SecureStore.setItemAsync('auth_token', token).catch(err => {
        console.warn('Failed to store auth token:', err);
      });
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
        // Store token if present
        if (betterAuthResponse.token) {
          await SecureStore.setItemAsync('auth_token', betterAuthResponse.token);
        }
        
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
        // Store token if present
        if (betterAuthResponse.token) {
          await SecureStore.setItemAsync('auth_token', betterAuthResponse.token);
        }

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
        
        // Extract and store token from nested structure: data.session.session.token
        const token = responseData.data.session?.session?.token || 
                      responseData.data.session?.token || 
                      responseData.data.token;
        if (token) {
          console.log(`[authAPI.getSession] Storing token from session response`);
          await SecureStore.setItemAsync('auth_token', token);
        }
        
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

// Exercise API functions
export interface Exercise {
  name: string;
  sets: number;
  reps?: number;
  restSeconds: number;
  mediaUrl?: string;
  notes?: string;
  workoutCount?: number;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  type?: string;
  instructions?: string;
}

export interface ExerciseResponse {
  success: boolean;
  data?: {
    exercises: Exercise[];
    total: number;
  };
  error?: {
    message: string;
  };
}

const EXERCISES_CACHE_KEY = '@gym_app:exercises_cache';
const EXERCISES_CACHE_TIMESTAMP_KEY = '@gym_app:exercises_cache_timestamp';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export const exerciseAPI = {
  getAllExercises: async (gymId?: string, search?: string, useCache: boolean = true): Promise<ExerciseResponse> => {
    try {
      // Try to load from cache first (if not searching and cache is enabled)
      if (useCache && (!search || search.trim() === '')) {
        try {
          const cachedData = await AsyncStorage.getItem(EXERCISES_CACHE_KEY);
          const cachedTimestamp = await AsyncStorage.getItem(EXERCISES_CACHE_TIMESTAMP_KEY);
          
          if (cachedData && cachedTimestamp) {
            const timestamp = parseInt(cachedTimestamp, 10);
            const now = Date.now();
            
            if (now - timestamp < CACHE_DURATION) {
              console.log('📦 Using cached exercises');
              const parsed = JSON.parse(cachedData);
              return {
                success: true,
                data: {
                  exercises: parsed.exercises || [],
                  total: parsed.total || 0,
                },
              };
            } else {
              console.log('⏰ Cache expired, fetching fresh data');
            }
          }
        } catch (cacheError) {
          console.log('⚠️ Cache read error, fetching fresh:', cacheError);
        }
      }

      // Fetch from API
      const params: any = {};
      if (gymId) params.gymId = gymId;
      if (search) params.search = search;

      const response = await apiClient.get('/api/exercises', {
        params,
        withCredentials: true,
      });

      const responseData = response.data;

      if (responseData.success && responseData.data) {
        const result = {
          success: true,
          data: {
            exercises: responseData.data.exercises || [],
            total: responseData.data.total || 0,
          },
        };

        // Cache the result (only if not searching)
        if (useCache && (!search || search.trim() === '')) {
          try {
            await AsyncStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(result.data));
            await AsyncStorage.setItem(EXERCISES_CACHE_TIMESTAMP_KEY, Date.now().toString());
            console.log('💾 Cached exercises');
          } catch (cacheError) {
            console.log('⚠️ Cache write error:', cacheError);
          }
        }

        return result;
      }

      return {
        success: false,
        error: { message: 'Invalid response format' },
      };
    } catch (error: any) {
      // If API fails, try to return cached data as fallback
      if (useCache && (!search || search.trim() === '')) {
        try {
          const cachedData = await AsyncStorage.getItem(EXERCISES_CACHE_KEY);
          if (cachedData) {
            console.log('📦 API failed, using cached exercises as fallback');
            const parsed = JSON.parse(cachedData);
            return {
              success: true,
              data: {
                exercises: parsed.exercises || [],
                total: parsed.total || 0,
              },
            };
          }
        } catch (cacheError) {
          console.log('⚠️ Cache fallback error:', cacheError);
        }
      }

      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: {
            message: errorData.error?.message || errorData.message || 'Failed to fetch exercises',
          },
        };
      }
      throw error;
    }
  },

  getExerciseByName: async (name: string, gymId?: string): Promise<ExerciseResponse> => {
    try {
      const params: any = {};
      if (gymId) params.gymId = gymId;

      const response = await apiClient.get(`/api/exercises/${encodeURIComponent(name)}`, {
        params,
        withCredentials: true,
      });

      const responseData = response.data;

      if (responseData.success && responseData.data?.exercise) {
        return {
          success: true,
          data: {
            exercises: [responseData.data.exercise],
            total: 1,
          },
        };
      }

      return {
        success: false,
        error: { message: 'Exercise not found' },
      };
    } catch (error: any) {
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: {
            message: errorData.error?.message || errorData.message || 'Failed to fetch exercise',
          },
        };
      }
      throw error;
    }
  },
};

// Nutrition API functions
export interface FoodItem {
  foodId: string;
  label: string;
  brand?: string;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  servingSizes: Array<{
    label: string;
    quantity: number;
  }>;
}

export interface Meal {
  _id?: string;
  userId: string;
  nutritionLogId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  name?: string;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  consumedAt: string;
  notes?: string;
  imageUrl?: string;
}

export interface NutritionLog {
  _id?: string;
  userId: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  meals: Meal[];
  waterIntake?: number;
}

export interface NutritionGoal {
  _id?: string;
  userId: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  goalType: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'custom';
  isActive: boolean;
}

export interface NutritionResponse {
  success: boolean;
  data?: {
    foods?: FoodItem[];
    count?: number;
    nutritionLog?: NutritionLog;
    goal?: NutritionGoal;
    remaining?: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      percentages: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
      };
    };
    meal?: Meal;
    logs?: NutritionLog[];
  };
  error?: {
    message: string;
  };
}

export const nutritionAPI = {
  searchFood: async (query: string): Promise<NutritionResponse> => {
    try {
      const response = await apiClient.get('/api/nutrition/food/search', {
        params: { query },
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            foods: responseData.data.foods || [],
            count: responseData.data.count || 0,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to search food' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to search food',
        },
      };
    }
  },

  getTodayNutrition: async (): Promise<NutritionResponse> => {
    try {
      const response = await apiClient.get('/api/nutrition/today', {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            nutritionLog: responseData.data.nutritionLog,
            goal: responseData.data.goal,
            remaining: responseData.data.remaining,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get nutrition log' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get nutrition log',
        },
      };
    }
  },

  addMeal: async (mealData: {
    mealType: string;
    foodItems: FoodItem[];
    consumedAt?: string;
    notes?: string;
    imageUrl?: string;
  }): Promise<NutritionResponse> => {
    try {
      const response = await apiClient.post('/api/nutrition/meals', mealData, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            meal: responseData.data.meal,
            nutritionLog: responseData.data.nutritionLog,
            goal: responseData.data.goal,
            remaining: responseData.data.remaining,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to add meal' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to add meal',
        },
      };
    }
  },

  getNutritionGoal: async (): Promise<NutritionResponse> => {
    try {
      const response = await apiClient.get('/api/nutrition/goals', {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            goal: responseData.data.goal,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get nutrition goal' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get nutrition goal',
        },
      };
    }
  },

  setNutritionGoal: async (goalData: {
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFats?: number;
    goalType?: string;
    activityLevel?: string;
  }): Promise<NutritionResponse> => {
    try {
      const response = await apiClient.post('/api/nutrition/goals', goalData, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            goal: responseData.data.goal,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to set nutrition goal' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to set nutrition goal',
        },
      };
    }
  },

  getNutritionHistory: async (startDate?: string, endDate?: string, limit?: number): Promise<NutritionResponse> => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (limit) params.limit = limit;

      const response = await apiClient.get('/api/nutrition/history', {
        params,
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            logs: responseData.data.logs || [],
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get nutrition history' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get nutrition history',
        },
      };
    }
  },
};

// Social API Types
export interface Post {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  type: 'workout' | 'progress' | 'achievement' | 'meal' | 'general';
  content: string;
  mediaUrls: string[];
  workoutId?: string;
  mealId?: string;
  likes: string[];
  comments: string[];
  views: number;
  isPremium: boolean;
  tags: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  views: string[];
  expiresAt: string;
  createdAt: string;
}

export interface Comment {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  postId: string;
  content: string;
  likes: string[];
  parentCommentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  isFollowing?: boolean;
}

export interface SocialResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

// Social API
export const socialAPI = {
  getFeed: async (): Promise<SocialResponse<{ posts: Post[] }>> => {
    try {
      const response = await apiClient.get('/api/social/feed', {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            posts: responseData.data.posts || [],
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get feed' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get feed',
        },
      };
    }
  },

  createPost: async (postData: {
    type?: string;
    content?: string;
    mediaUrls?: string[];
    workoutId?: string;
    mealId?: string;
    tags?: string[];
    location?: string;
    isPremium?: boolean;
  }): Promise<SocialResponse<{ post: Post }>> => {
    try {
      const response = await apiClient.post('/api/social/posts', postData, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            post: responseData.data.post,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to create post' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to create post',
        },
      };
    }
  },

  getStories: async (): Promise<SocialResponse<{ stories: Array<{ user: User; stories: Story[] }> }>> => {
    try {
      const response = await apiClient.get('/api/social/stories', {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            stories: responseData.data.stories || [],
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get stories' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get stories',
        },
      };
    }
  },

  createStory: async (storyData: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
  }): Promise<SocialResponse<{ story: Story }>> => {
    try {
      const response = await apiClient.post('/api/social/stories', storyData, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            story: responseData.data.story,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to create story' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to create story',
        },
      };
    }
  },

  viewStory: async (storyId: string): Promise<SocialResponse<{ story: Story }>> => {
    try {
      const response = await apiClient.post(`/api/social/stories/${storyId}/view`, {}, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            story: responseData.data.story,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to view story' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to view story',
        },
      };
    }
  },

  followUser: async (followingId: string): Promise<SocialResponse> => {
    try {
      const response = await apiClient.post('/api/social/follow', { followingId }, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: responseData.data,
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to follow user' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to follow user',
        },
      };
    }
  },

  unfollowUser: async (followingId: string): Promise<SocialResponse> => {
    try {
      const response = await apiClient.post('/api/social/unfollow', { followingId }, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: responseData.data,
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to unfollow user' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to unfollow user',
        },
      };
    }
  },

  likePost: async (postId: string): Promise<SocialResponse<{ post: Post; isLiked: boolean; likesCount: number }>> => {
    try {
      const response = await apiClient.post(`/api/social/posts/${postId}/like`, {}, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            post: responseData.data.post,
            isLiked: responseData.data.isLiked,
            likesCount: responseData.data.likesCount,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to like post' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to like post',
        },
      };
    }
  },

  addComment: async (postId: string, content: string, parentCommentId?: string): Promise<SocialResponse<{ comment: Comment }>> => {
    try {
      const response = await apiClient.post(`/api/social/posts/${postId}/comments`, {
        content,
        parentCommentId,
      }, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            comment: responseData.data.comment,
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to add comment' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to add comment',
        },
      };
    }
  },

  getComments: async (postId: string): Promise<SocialResponse<{ comments: Comment[] }>> => {
    try {
      const response = await apiClient.get(`/api/social/posts/${postId}/comments`, {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            comments: responseData.data.comments || [],
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get comments' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get comments',
        },
      };
    }
  },

  searchUsers: async (query: string): Promise<SocialResponse<{ users: User[] }>> => {
    try {
      const response = await apiClient.get('/api/social/users/search', {
        params: { query },
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            users: responseData.data.users || [],
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to search users' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to search users',
        },
      };
    }
  },

  getSuggestedUsers: async (): Promise<SocialResponse<{ users: User[] }>> => {
    try {
      const response = await apiClient.get('/api/social/users/suggested', {
        withCredentials: true,
      });

      const responseData = response.data;
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: {
            users: responseData.data.users || [],
          },
        };
      }

      return {
        success: false,
        error: { message: responseData.error?.message || 'Failed to get suggested users' },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || error.message || 'Failed to get suggested users',
        },
      };
    }
  },
};

export default apiClient;
