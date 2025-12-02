/**
 * User Search Screen
 * Search and discover users to follow
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { socialAPI, User } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

const THEME = {
  primary: '#007AFF',
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  divider: '#2C2C2E',
};

export default function UserSearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await socialAPI.searchUsers(query);
      if (response.success && response.data) {
        setUsers(response.data.users);
        // Build following map
        const map: Record<string, boolean> = {};
        response.data.users.forEach((u: User) => {
          map[u._id] = u.isFollowing || false;
        });
        setFollowingMap(map);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFollow = async (userId: string) => {
    const isFollowing = followingMap[userId];
    try {
      const response = isFollowing
        ? await socialAPI.unfollowUser(userId)
        : await socialAPI.followUser(userId);
      
      if (response.success) {
        setFollowingMap({
          ...followingMap,
          [userId]: !isFollowing,
        });
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const renderUser = ({ item, index }: { item: User; index: number }) => {
    const isFollowing = followingMap[item._id] || false;
    const isOwnProfile = item._id === currentUser?.id;

    return (
      <Reanimated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity
          style={styles.userItem}
          onPress={() => {
            router.push({
              pathname: '/social/profile/[userId]',
              params: { userId: item._id },
            });
          }}
        >
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Ionicons name="person" size={24} color={THEME.textSecondary} />
            </View>
          )}
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>

          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followButtonActive]}
              onPress={() => handleFollow(item._id)}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Reanimated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={THEME.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={THEME.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchUsers(text);
            }}
            autoCapitalize="none"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setUsers([]); }}>
              <Ionicons name="close-circle" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : users.length > 0 ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : searchQuery.length >= 2 ? (
        <View style={styles.centerContent}>
          <Ionicons name="search-outline" size={48} color={THEME.textTertiary} />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <View style={styles.centerContent}>
          <Ionicons name="people-outline" size={48} color={THEME.textTertiary} />
          <Text style={styles.emptyText}>Search for users to follow</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    marginLeft: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: THEME.primary,
  },
  followButtonActive: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.divider,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followButtonTextActive: {
    color: THEME.text,
  },
  emptyText: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginTop: 16,
  },
});


