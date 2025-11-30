/**
 * Auth Configuration
 * Handles Better Auth initialization
 */

import { createAuth } from '../lib/better-auth';

let auth: ReturnType<typeof createAuth> | null = null;
let betterAuthHandler: ((req: any, res: any, next?: any) => Promise<void>) | null = null;

export const initializeAuth = async (): Promise<void> => {
  try {
    const { setAuth } = await import('../lib/better-auth');
    auth = createAuth();
    setAuth(auth);
    
    const { toNodeHandler } = await import('better-auth/node');
    betterAuthHandler = toNodeHandler(auth);
    
    console.log('✅ Better Auth initialized successfully');
    console.log(`   Handler type: ${typeof betterAuthHandler}`);
    console.log(`   Auth config basePath: /api/auth`);
    console.log(`   ✅ Better Auth handler mounted at /api/auth/*`);
  } catch (error) {
    console.error('❌ Better Auth initialization error:', error);
    throw error;
  }
};

export const getBetterAuthHandler = () => betterAuthHandler;

