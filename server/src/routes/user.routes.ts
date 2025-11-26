import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { UserProfile } from '../models/UserProfile.model';
import { createUserProfile } from '../utils/auth-helpers';

const router = Router();

/**
 * Create or update user profile
 * POST /api/users/profile
 */
router.post('/profile', requireAuth, async (req, res) => {
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
});

/**
 * Get user profile
 * GET /api/users/profile
 */
router.get('/profile', requireAuth, async (req, res) => {
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
});

export default router;

