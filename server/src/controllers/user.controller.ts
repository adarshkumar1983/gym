import { Request, Response } from 'express';
import { UserProfile } from '../models/UserProfile.model';
import { createUserProfile } from '../utils/auth-helpers';

/**
 * User Controller
 * Handles all user-related business logic
 */

/**
 * Create or update user profile
 * @param req Express request object
 * @param res Express response object
 */
export const createOrUpdateProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const { role, phone, profileImageUrl, gymId, trainerId } = req.body;

    // Check if profile exists
    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      if (role) profile.role = role;
      if (phone !== undefined) profile.phone = phone;
      if (profileImageUrl !== undefined) profile.profileImageUrl = profileImageUrl;
      if (gymId) profile.gymId = gymId;
      if (trainerId) profile.trainerId = trainerId;
      
      await profile.save();
    } else {
      // Create new profile
      profile = await createUserProfile(
        userId,
        role || 'member',
        { phone, gymId, trainerId }
      );
    }

    // Ensure profile exists (TypeScript guard)
    if (!profile) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create or update profile' }
      });
    }

    return res.json({
      success: true,
      data: {
        profile: {
          userId: profile.userId,
          role: profile.role,
          phone: profile.phone,
          profileImageUrl: profile.profileImageUrl,
          gymId: profile.gymId,
          trainerId: profile.trainerId,
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Get user profile
 * @param req Express request object
 * @param res Express response object
 */
export const getProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Profile not found' }
      });
    }

    return res.json({
      success: true,
      data: {
        profile: {
          userId: profile.userId,
          role: profile.role,
          phone: profile.phone,
          profileImageUrl: profile.profileImageUrl,
          gymId: profile.gymId,
          trainerId: profile.trainerId,
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

