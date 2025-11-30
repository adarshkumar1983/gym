/**
 * Session Validator Service
 * Handles session validation from cookies and Bearer tokens
 */

import { IncomingHttpHeaders } from 'http';
import { getAuth } from '../../lib/better-auth';

interface SessionResult {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string | null;
  };
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

/**
 * Validate session from cookies (Better Auth default)
 */
export const validateCookieSession = async (headers: IncomingHttpHeaders): Promise<SessionResult | null> => {
  try {
    const session = await getAuth().api.getSession({ headers });
    if (session?.user) {
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role ?? null,
        },
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Validate session from Bearer token by converting to cookie format
 */
export const validateBearerTokenAsCookie = async (
  headers: IncomingHttpHeaders,
  token: string
): Promise<SessionResult | null> => {
  try {
    const modifiedHeaders = {
      ...headers,
      cookie: `better-auth.session_token=${token}`,
    };
    const session = await getAuth().api.getSession({ headers: modifiedHeaders });
    if (session?.user) {
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role ?? null,
        },
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Validate session from Bearer token by querying database
 */
export const validateBearerTokenFromDb = async (token: string): Promise<SessionResult | null> => {
  try {
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    if (!db) {
      console.log('⚠️ [validateBearerTokenFromDb] Database not available');
      return null;
    }

    const sessionCollection = db.collection('session');
    
    console.log(`🔍 [validateBearerTokenFromDb] Searching for token: ${token.substring(0, 10)}...`);
    
    // Try different field names
    let sessionDoc = await sessionCollection.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!sessionDoc) {
      console.log('   Trying sessionToken field...');
      sessionDoc = await sessionCollection.findOne({
        sessionToken: token,
        expiresAt: { $gt: new Date() },
      });
    }

    if (!sessionDoc) {
      console.log('   Trying without expiresAt check...');
      sessionDoc = await sessionCollection.findOne({ token });
      if (!sessionDoc) {
        sessionDoc = await sessionCollection.findOne({ sessionToken: token });
      }
    }

    if (sessionDoc) {
      console.log(`   ✅ Found session document. Fields:`, Object.keys(sessionDoc));
      console.log(`   Token field value:`, sessionDoc.token || sessionDoc.sessionToken || 'not found');
    } else {
      console.log('   ❌ No session document found. Checking sample document...');
      const sampleDoc = await sessionCollection.findOne({});
      if (sampleDoc) {
        console.log(`   Sample document fields:`, Object.keys(sampleDoc));
        console.log(`   Sample token field:`, sampleDoc.token || sampleDoc.sessionToken || 'not found');
      }
    }

    if (!sessionDoc?.userId) {
      console.log('   ❌ Session document found but no userId');
      return null;
    }

    const userCollection = db.collection('user');
    const userId = sessionDoc.userId.toString ? sessionDoc.userId.toString() : sessionDoc.userId;
    const userDoc = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });

    if (!userDoc) return null;

    return {
      user: {
        id: userDoc._id.toString(),
        email: userDoc.email,
        name: userDoc.name,
        role: userDoc.role || null,
      },
      session: {
        id: sessionDoc._id.toString(),
        userId,
        expiresAt: sessionDoc.expiresAt,
      },
    };
  } catch (error) {
    console.error('Error validating Bearer token from database:', error);
    return null;
  }
};

/**
 * Extract Bearer token from Authorization header
 */
export const extractBearerToken = (headers: IncomingHttpHeaders): string | null => {
  const authHeader = headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

/**
 * Main session validation function - tries all methods
 */
export const validateSession = async (headers: IncomingHttpHeaders): Promise<SessionResult | null> => {
  // Try cookie-based session first
  const cookieSession = await validateCookieSession(headers);
  if (cookieSession) return cookieSession;

  // Try Bearer token
  const token = extractBearerToken(headers);
  if (!token) return null;

  // Try converting Bearer token to cookie format
  const cookieConvertedSession = await validateBearerTokenAsCookie(headers, token);
  if (cookieConvertedSession) return cookieConvertedSession;

  // Try database lookup
  return await validateBearerTokenFromDb(token);
};

