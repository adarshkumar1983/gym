/**
 * Fitbit OAuth Controller
 * Handles Fitbit OAuth flow
 */

import { Request, Response } from 'express';
import axios from 'axios';
import { HealthSyncSettingsService } from '../services/health';

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET;
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI || 'http://localhost:3000/api/health/fitbit/callback';
const FITBIT_BASE_URL = 'https://www.fitbit.com/oauth2';

/**
 * Get Fitbit OAuth authorization URL
 */
export const getFitbitAuthUrl = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    if (!FITBIT_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        error: { message: 'Fitbit client ID not configured' },
      });
    }

    // Generate state for CSRF protection
    const state = Buffer.from(`${userId}-${Date.now()}`).toString('base64');

    // Store state in session
    if (!req.session) {
      req.session = {} as any;
    }
    (req.session as any).fitbitState = state;

    const scopes = [
      'activity',
      'heartrate',
      'location',
      'nutrition',
      'profile',
      'settings',
      'sleep',
      'social',
      'weight',
    ].join(' ');

    const authUrl = `${FITBIT_BASE_URL}/authorize?` +
      `response_type=code&` +
      `client_id=${FITBIT_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(FITBIT_REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${state}`;

    return res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error: any) {
    console.error('Error generating Fitbit auth URL:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to generate auth URL' },
    });
  }
};

/**
 * Handle Fitbit OAuth callback
 */
export const fitbitCallback = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    const { code, state } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Authorization code is required' },
      });
    }

    // Verify state
    const sessionState = (req.session as any)?.fitbitState;
    if (state !== sessionState) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid state parameter' },
      });
    }

    if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: { message: 'Fitbit credentials not configured' },
      });
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      `${FITBIT_BASE_URL}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: FITBIT_CLIENT_ID,
        code: code as string,
        redirect_uri: FITBIT_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in, user_id } = tokenResponse.data;

    // Store tokens in database
    await HealthSyncSettingsService.updateTokens(userId, 'fitbit', {
      accessToken: access_token,
      refreshToken: refresh_token,
      fitbitUserId: user_id,
    });

    // Clear state from session
    delete (req.session as any).fitbitState;

    return res.json({
      success: true,
      data: {
        tokens: {
          access_token,
          refresh_token,
          expires_in,
          user_id,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in Fitbit callback:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error.response?.data?.errors?.[0]?.message || error.message || 'Failed to complete OAuth flow',
      },
    });
  }
};

/**
 * Refresh Fitbit access token
 */
export const refreshFitbitToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refresh token is required' },
      });
    }

    if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: { message: 'Fitbit credentials not configured' },
      });
    }

    // Refresh token
    const tokenResponse = await axios.post(
      `${FITBIT_BASE_URL}/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token as string,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );

    const { access_token, refresh_token: new_refresh_token, expires_in } = tokenResponse.data;

    // Update tokens in database
    await HealthSyncSettingsService.updateTokens(userId, 'fitbit', {
      accessToken: access_token,
      refreshToken: new_refresh_token || refresh_token,
    });

    return res.json({
      success: true,
      data: {
        tokens: {
          access_token,
          refresh_token: new_refresh_token || refresh_token,
          expires_in,
        },
      },
    });
  } catch (error: any) {
    console.error('Error refreshing Fitbit token:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error.response?.data?.errors?.[0]?.message || error.message || 'Failed to refresh token',
      },
    });
  }
};

