/**
 * Post Creation Screen
 * Create new posts with media, captions, and tags
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { socialAPI } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

const THEME = {
  primary: '#007AFF',
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  divider: '#2C2C2E',
};

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [type, setType] = useState<'general' | 'workout' | 'progress' | 'achievement' | 'meal'>('general');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const urls = result.assets.map(asset => asset.uri);
      setMediaUrls([...mediaUrls, ...urls]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUrls([...mediaUrls, result.assets[0].uri]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      Alert.alert('Error', 'Please add content or media');
      return;
    }

    setLoading(true);
    try {
      // Extract hashtags from content
      const hashtags = content.match(/#\w+/g)?.map(tag => tag.slice(1).toLowerCase()) || [];

      // In production, upload media to cloud storage first
      // For now, use the first media URL if available
      const response = await socialAPI.createPost({
        type,
        content: content.trim(),
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        tags: hashtags,
      });

      if (response.success) {
        Alert.alert('Success', 'Post created!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to create post');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const postTypes = [
    { key: 'general' as const, label: 'General', icon: 'chatbubble' },
    { key: 'workout' as const, label: 'Workout', icon: 'barbell' },
    { key: 'progress' as const, label: 'Progress', icon: 'trending-up' },
    { key: 'achievement' as const, label: 'Achievement', icon: 'trophy' },
    { key: 'meal' as const, label: 'Meal', icon: 'restaurant' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={loading || (!content.trim() && mediaUrls.length === 0)}
        >
          <Text
            style={[
              styles.postButton,
              (!content.trim() && mediaUrls.length === 0) && styles.postButtonDisabled,
            ]}
          >
            {loading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Media Preview */}
        {mediaUrls.length > 0 && (
          <View style={styles.mediaContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mediaUrls.map((uri, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri }} style={styles.mediaPreview} />
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeMedia(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={THEME.text} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Content Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor={THEME.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>
        </View>

        {/* Post Type Selector */}
        <View style={styles.typeContainer}>
          <Text style={styles.sectionTitle}>Post Type</Text>
          <View style={styles.typeGrid}>
            {postTypes.map((postType) => (
              <TouchableOpacity
                key={postType.key}
                style={[
                  styles.typeButton,
                  type === postType.key && styles.typeButtonActive,
                ]}
                onPress={() => setType(postType.key)}
              >
                <Ionicons
                  name={postType.icon as any}
                  size={24}
                  color={type === postType.key ? THEME.text : THEME.textSecondary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === postType.key && styles.typeButtonTextActive,
                  ]}
                >
                  {postType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Media Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={THEME.primary} />
            <Text style={styles.actionButtonText}>Add Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color={THEME.primary} />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  cancelButton: {
    fontSize: 16,
    color: THEME.text,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.primary,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  mediaContainer: {
    paddingVertical: 16,
  },
  mediaItem: {
    marginLeft: 16,
    position: 'relative',
  },
  mediaPreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: THEME.card,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  inputContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  input: {
    fontSize: 16,
    color: THEME.text,
    minHeight: 120,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: THEME.textSecondary,
    textAlign: 'right',
  },
  typeContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.divider,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: THEME.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.divider,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '500',
  },
});

