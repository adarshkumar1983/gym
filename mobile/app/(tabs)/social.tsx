/**
 * Social Feed Screen
 * Snapchat-style stories + Instagram-style feed
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { socialAPI, Post, Story, User } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import Reanimated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  FadeInDown,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_SIZE = 70;
const STORY_PADDING = 8;

const THEME = {
  primary: '#007AFF',
  background: '#000000', // Snapchat-style dark background
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  divider: '#2C2C2E',
};

const AnimatedFlatList = Reanimated.createAnimatedComponent(FlatList<Post>);

interface StoryGroup {
  user: User;
  stories: Story[];
}

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, checkSession } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const loadFeed = useCallback(async () => {
    try {
      setError(null);
      const [feedResponse, storiesResponse] = await Promise.all([
        socialAPI.getFeed(),
        socialAPI.getStories(),
      ]);

      if (feedResponse.success && feedResponse.data) {
        setPosts(feedResponse.data.posts);
      }

      if (storiesResponse.success && storiesResponse.data) {
        setStories(storiesResponse.data.stories);
      }
    } catch (error: any) {
      console.error('Error loading feed:', error);
      setError(error.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleLike = async (postId: string) => {
    const response = await socialAPI.likePost(postId);
    if (response.success && response.data) {
      // Update post in local state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, likes: response.data!.post.likes }
            : post
        )
      );
    }
  };

  const renderStoryItem = ({ item, index }: { item: StoryGroup; index: number }) => {
    const firstStory = item.stories[0];
    const hasUnviewed = firstStory.views.length === 0 || !firstStory.views.includes(useAuthStore.getState().user?.id || '');

    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => {
          // Navigate to story viewer
          router.push({
            pathname: '/social/story/[userId]',
            params: { userId: item.user._id },
          });
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.storyCircle, hasUnviewed && styles.storyCircleUnviewed]}>
          {item.user.image ? (
            <Image source={{ uri: item.user.image }} style={styles.storyImage} />
          ) : (
            <View style={styles.storyPlaceholder}>
              <Ionicons name="person" size={30} color={THEME.textSecondary} />
            </View>
          )}
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {item.user.name.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    const isLiked = item.likes.includes(useAuthStore.getState().user?.id || '');
    const user = item.userId;

    return (
      <Reanimated.View entering={FadeInDown.delay(index * 50).duration(300)} style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
          style={styles.postUserInfo}
          onPress={() => {
            router.push({
              pathname: '/social/profile/[userId]',
              params: { userId: user._id },
            });
          }}
        >
            {user.image ? (
              <Image source={{ uri: user.image }} style={styles.postAvatar} />
            ) : (
              <View style={styles.postAvatarPlaceholder}>
                <Ionicons name="person" size={20} color={THEME.textSecondary} />
              </View>
            )}
            <View>
              <Text style={styles.postUsername}>{user.name}</Text>
              <Text style={styles.postTime}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={THEME.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        {item.content && (
          <Text style={styles.postContent}>{item.content}</Text>
        )}

        {/* Post Media */}
        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <View style={styles.postMedia}>
            <Image
              source={{ uri: item.mediaUrls[0] }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.postAction}
            onPress={() => handleLike(item._id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? THEME.danger : THEME.textSecondary}
            />
            <Text style={[styles.postActionText, isLiked && styles.postActionTextLiked]}>
              {item.likes.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.postAction}
            onPress={() => {
              // Navigate to post details/comments
              router.push({
                pathname: '/social/post/[postId]',
                params: { 
                  postId: item._id,
                  post: JSON.stringify(item),
                },
              });
            }}
          >
            <Ionicons name="chatbubble-outline" size={24} color={THEME.textSecondary} />
            <Text style={styles.postActionText}>{item.comments.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.postAction}>
            <Ionicons name="share-outline" size={24} color={THEME.textSecondary} />
          </TouchableOpacity>
        </View>
      </Reanimated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Social</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/social/create')}>
            <Ionicons name="add-circle-outline" size={28} color={THEME.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/social/search')}
            style={{ marginLeft: 16 }}
          >
            <Ionicons name="search" size={24} color={THEME.text} />
          </TouchableOpacity>
        </View>
      </View>

      <AnimatedFlatList
        data={posts}
        keyExtractor={(item) => item._id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadFeed();
        }}
        ListHeaderComponent={
          <View>
            {/* Stories Row */}
            {stories.length > 0 && (
              <View style={styles.storiesContainer}>
                <FlatList
                  data={stories}
                  keyExtractor={(item) => item.user._id}
                  renderItem={renderStoryItem}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.storiesList}
                />
              </View>
            )}
          </View>
        }
        renderItem={renderPost}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={THEME.textTertiary} />
            <Text style={styles.emptyStateText}>No posts yet</Text>
            <Text style={styles.emptyStateSubtext}>Follow users to see their posts</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/social/search')}
            >
              <Text style={styles.emptyStateButtonText}>Find People</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: THEME.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: THEME.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storiesContainer: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
    marginBottom: 8,
  },
  storiesList: {
    paddingHorizontal: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: STORY_PADDING,
    width: STORY_SIZE,
  },
  storyCircle: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    borderWidth: 2,
    borderColor: THEME.divider,
    overflow: 'hidden',
    marginBottom: 6,
  },
  storyCircleUnviewed: {
    borderColor: THEME.primary,
    borderWidth: 3,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyUsername: {
    fontSize: 12,
    color: THEME.text,
    fontWeight: '500',
    maxWidth: STORY_SIZE,
  },
  postCard: {
    backgroundColor: THEME.card,
    marginBottom: 12,
    paddingBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  postTime: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: THEME.text,
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postMedia: {
    width: '100%',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: SCREEN_WIDTH,
    backgroundColor: THEME.divider,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.divider,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  postActionText: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  postActionTextLiked: {
    color: THEME.danger,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

