/**
 * User Profile Service
 * Handles user profile loading and attachment to requests
 */

import { UserProfile } from '../../models/UserProfile.model';

export interface UserProfileData {
  userId: string;
  role: 'owner' | 'trainer' | 'member';
  phone?: string;
  profileImageUrl?: string;
  gymId?: string;
  trainerId?: string;
}

/**
 * Load user profile by userId
 */
export const loadUserProfile = async (userId: string): Promise<UserProfileData | null> => {
  try {
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) return null;

    return {
      userId: userProfile.userId,
      role: userProfile.role,
      phone: userProfile.phone,
      profileImageUrl: userProfile.profileImageUrl,
      gymId: userProfile.gymId?.toString(),
      trainerId: userProfile.trainerId?.toString(),
    };
  } catch (error) {
    console.warn('User profile not found for user:', userId);
    return null;
  }
};

