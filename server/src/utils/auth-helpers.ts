import { UserProfile } from '../models/UserProfile.model';

/**
 * Create user profile after Better Auth user registration
 */
export async function createUserProfile(
  userId: string,
  role: 'owner' | 'trainer' | 'member' = 'member',
  additionalData?: {
    phone?: string;
    gymId?: string;
    trainerId?: string;
  }
) {
  try {
    const profile = new UserProfile({
      userId,
      role,
      ...additionalData,
    });
    await profile.save();
    return profile;
  } catch (error: any) {
    // If profile already exists, return existing one
    if (error.code === 11000) {
      return await UserProfile.findOne({ userId });
    }
    throw error;
  }
}

/**
 * Get user with profile
 * Note: Better Auth doesn't expose getUser API, so this function
 * requires the user object from session
 */
export async function getUserWithProfile(user: { id: string; email: string; name: string; [key: string]: any }) {
  try {
    // Get profile
    const profile = await UserProfile.findOne({ userId: user.id });
    
    return {
      ...user,
      profile: profile ? {
        role: profile.role,
        phone: profile.phone,
        profileImageUrl: profile.profileImageUrl,
        gymId: profile.gymId,
        trainerId: profile.trainerId,
      } : null,
    };
  } catch (error) {
    throw error;
  }
}

