import { create } from 'zustand';
import { authAPI } from './api';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  image?: string;
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
    console.log(`🔵 [Auth Store] signIn called`);
    console.log(`   Email: ${email}`);
    
    try {
      set({ isLoading: true });
      console.log(`   📤 Calling authAPI.signIn...`);
      const response = await authAPI.signIn({ email, password });
      console.log(`   📥 Sign-in response:`, JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.user) {
        console.log(`   ✅ Sign-in successful, user:`, response.data.user.email);
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        console.error(`   ❌ Sign-in failed:`, response.error?.message || 'Unknown error');
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error: any) {
      console.error(`   ❌ Sign-in error:`, error.message);
      console.error(`   Stack:`, error.stack);
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    console.log(`🔵 [Auth Store] signUp called`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    
    try {
      set({ isLoading: true });
      console.log(`   📤 Calling authAPI.signUp...`);
      const response = await authAPI.signUp({ email, password, name });
      console.log(`   📥 Sign-up response:`, JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.user) {
        console.log(`   ✅ Sign-up successful, user:`, response.data.user.email);
        
        // After successful registration, automatically sign in to establish session
        // Better Auth sign-up creates a session, but we need to verify it works
        // by calling sign-in to ensure cookies are properly set
        try {
          console.log(`   📤 Calling authAPI.signIn after sign-up...`);
          const signInResponse = await authAPI.signIn({ email, password });
          console.log(`   📥 Sign-in response:`, JSON.stringify(signInResponse, null, 2));
          
          if (signInResponse.success && signInResponse.data?.user) {
            console.log(`   ✅ Sign-in after sign-up successful`);
            set({
              user: signInResponse.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            console.warn(`   ⚠️ Sign-in after sign-up failed, using sign-up user data`);
            // If sign-in fails, still set user from sign-up response
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (signInError: any) {
          console.error(`   ❌ Sign-in after sign-up error:`, signInError.message);
          console.error(`   Stack:`, signInError.stack);
          // If sign-in fails, still set user from sign-up response
          // The session might still be valid from sign-up
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        console.error(`   ❌ Sign-up failed:`, response.error?.message || 'Unknown error');
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error(`   ❌ Sign-up error:`, error.message);
      console.error(`   Stack:`, error.stack);
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
    console.log(`🔵 [Auth Store] checkSession called`);
    try {
      set({ isLoading: true });
      console.log(`   📤 Calling authAPI.getSession...`);
      const response = await authAPI.getSession();
      console.log(`   📥 Session response:`, JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.user) {
        console.log(`   ✅ Session valid, user:`, response.data.user.email);
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        console.warn(`   ⚠️ No valid session`);
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error(`   ❌ Session check error:`, error.message);
      console.error(`   Stack:`, error.stack);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

