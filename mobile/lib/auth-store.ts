import { create } from 'zustand';
import { authAPI } from './api';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await authAPI.signIn({ email, password });
      
      if (response.success && response.data?.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true });
      const response = await authAPI.signUp({ email, password, name });
      
      if (response.success && response.data?.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await authAPI.signOut();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      // Even if API call fails, clear local state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkSession: async () => {
    try {
      set({ isLoading: true });
      const response = await authAPI.getSession();
      
      if (response.success && response.data?.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

