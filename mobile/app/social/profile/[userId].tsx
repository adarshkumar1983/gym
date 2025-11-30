/**
 * User Profile Screen
 * View user profile, posts, and follow status
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { socialAPI, Post, User } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

const THEME = {
  primary: '#007AFF',
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  divider: '#2C2C2E',
};

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: currentUser } = useAuthStore();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const userId = (params.userId as string) || currentUser?.id;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // In a real app, you'd have a getUserProfile endpoint
      // For now, we'll use search to get user info
      const response = await socialAPI.searchUsers(userId || '');
      if (response.success && response.data?.users.length > 0) {
        const user = response.data.users[0];
        setProfileUser(user);
        setFollowing(user.isFollowing || false);
      }
      
      // Load user posts (you'd need a getUserPosts endpoint)
      // For now, we'll show empty state
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profileUser) return;
    
    try {
      const response = following
        ? await socialAPI.unfollowUser(profileUser._id)
        : await socialAPI.followUser(profileUser._id);
      
      if (response.success) {
        setFollowing(!following);
        setFollowersCount(following ? followersCount - 1 : followersCount + 1);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    return (
      <Reanimated.View entering={FadeInDown.delay(index * 50)} style={styles.postItem}>
        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <Image source={{ uri: item.mediaUrls[0] }} style={styles.postImage} />
        )}
        <View style={styles.postOverlay}>
          <Ionicons name="heart" size={16} color={THEME.text} />
          <Text style={styles.postStats}>{item.likes.length}</Text>
          <Ionicons name="chatbubble" size={16} color={THEME.text} style={{ marginLeft: 12 }} />
          <Text style={styles.postStats}>{item.comments.length}</Text>
        </View>
      </Reanimated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnProfile = profileUser._id === currentUser?.id;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{profileUser.name}</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color={THEME.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            {profileUser.image ? (
              <Image source={{ uri: profileUser.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color={THEME.textSecondary} />
              </View>
            )}
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileUser.name}</Text>
            <Text style={styles.profileEmail}>{profileUser.email}</Text>
          </View>

          {/* Follow Button */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followButton, following && styles.followButtonActive]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, following && styles.followButtonTextActive]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}

          {isOwnProfile && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/social/edit-profile')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Grid */}
        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <Ionicons name="grid" size={20} color={THEME.text} />
            <Text style={styles.postsHeaderText}>Posts</Text>
          </View>
          
          {posts.length > 0 ? (
            <FlatList
              data={posts}
              keyExtractor={(item) => item._id}
              renderItem={renderPost}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.postsGrid}
            />
          ) : (
            <View style={styles.emptyPosts}>
              <Ionicons name="image-outline" size={48} color={THEME.textTertiary} />
              <Text style={styles.emptyPostsText}>No posts yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },
  profileSection: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  statLabel: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  profileInfo: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  followButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: THEME.primary,
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.divider,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followButtonTextActive: {
    color: THEME.text,
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.divider,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  postsSection: {
    paddingTop: 16,
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  postsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  postsGrid: {
    paddingHorizontal: 2,
  },
  postItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: THEME.card,
  },
  postOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postStats: {
    fontSize: 12,
    color: THEME.text,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyPosts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyPostsText: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: THEME.primary,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

