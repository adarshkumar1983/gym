/**
 * Post Detail Screen
 * View post with full comments section
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { socialAPI, Post, Comment } from '../../../lib/api';
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

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  
  // Accept post as parameter or load from feed
  const initialPost = params.post ? JSON.parse(params.post as string) : null;
  const [post, setPost] = useState<Post | null>(initialPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(!initialPost);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPostAndComments();
  }, []);

  const loadPostAndComments = async () => {
    try {
      setLoading(true);
      // Load comments
      const commentsResponse = await socialAPI.getComments(params.postId as string);
      if (commentsResponse.success && commentsResponse.data) {
        setComments(commentsResponse.data.comments || []);
      }
      
      // If post wasn't passed, try to get it from feed
      if (!post) {
        const feedResponse = await socialAPI.getFeed();
        if (feedResponse.success && feedResponse.data) {
          const foundPost = feedResponse.data.posts?.find((p: Post) => p._id === params.postId);
          if (foundPost) {
            setPost(foundPost);
          }
        }
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    const response = await socialAPI.likePost(post._id);
    if (response.success && response.data) {
      setPost({
        ...post,
        likes: response.data.post?.likes || post.likes,
      });
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !post) return;
    
    setSubmitting(true);
    try {
      const response = await socialAPI.addComment(post._id, commentText.trim());
      if (response.success && response.data) {
        setComments([...comments, response.data.comment]);
        setCommentText('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = ({ item, index }: { item: Comment; index: number }) => {
    const commentUser = typeof item.userId === 'object' ? item.userId : { name: 'User', image: undefined };
    const isLiked = item.likes.includes(user?.id || '');

    return (
      <Reanimated.View entering={FadeInDown.delay(index * 30)} style={styles.commentItem}>
        {commentUser.image ? (
          <Image source={{ uri: commentUser.image }} style={styles.commentAvatar} />
        ) : (
          <View style={styles.commentAvatarPlaceholder}>
            <Ionicons name="person" size={16} color={THEME.textSecondary} />
          </View>
        )}
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentUsername}>{commentUser.name}</Text>
            <Text style={styles.commentText}>{item.content}</Text>
          </View>
          <View style={styles.commentActions}>
            <Text style={styles.commentTime}>
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <TouchableOpacity style={styles.commentLikeButton}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={14}
                color={isLiked ? THEME.primary : THEME.textSecondary}
              />
              <Text style={styles.commentLikeCount}>{item.likes.length}</Text>
            </TouchableOpacity>
          </View>
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

  if (!post) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const postUser = typeof post.userId === 'object' ? post.userId : { name: 'User', image: undefined };
  const isLiked = post.likes.includes(user?.id || '');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        renderItem={renderComment}
        ListHeaderComponent={
          <View style={styles.postSection}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              {postUser.image ? (
                <Image source={{ uri: postUser.image }} style={styles.postAvatar} />
              ) : (
                <View style={styles.postAvatarPlaceholder}>
                  <Ionicons name="person" size={20} color={THEME.textSecondary} />
                </View>
              )}
              <View style={styles.postHeaderInfo}>
                <Text style={styles.postUsername}>{postUser.name}</Text>
                <Text style={styles.postTime}>
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {/* Post Content */}
            {post.content && (
              <Text style={styles.postContent}>{post.content}</Text>
            )}

            {/* Post Media */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <Image source={{ uri: post.mediaUrls[0] }} style={styles.postImage} />
            )}

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.postAction} onPress={handleLike}>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={isLiked ? '#FF3B30' : THEME.textSecondary}
                />
                <Text style={[styles.postActionText, isLiked && styles.postActionTextLiked]}>
                  {post.likes.length}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.commentsHeader}>
              <Text style={styles.commentsHeaderText}>
                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Comment Input */}
      <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom }]}>
        {user?.image ? (
          <Image source={{ uri: user.image }} style={styles.inputAvatar} />
        ) : (
          <View style={styles.inputAvatarPlaceholder}>
            <Ionicons name="person" size={16} color={THEME.textSecondary} />
          </View>
        )}
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor={THEME.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleAddComment}
          disabled={!commentText.trim() || submitting}
          style={[
            styles.sendButton,
            (!commentText.trim() || submitting) && styles.sendButtonDisabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={THEME.primary} />
          ) : (
            <Ionicons name="send" size={20} color={THEME.primary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  postSection: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postHeaderInfo: {
    flex: 1,
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
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: THEME.card,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
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
    color: '#FF3B30',
  },
  commentsHeader: {
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.divider,
  },
  commentsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: THEME.text,
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  commentTime: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginRight: 12,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikeCount: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.divider,
    backgroundColor: THEME.background,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  inputAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.text,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: THEME.card,
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
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

