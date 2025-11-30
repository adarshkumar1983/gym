/**
 * Story Viewer Screen
 * Full-screen Snapchat-style story viewer with swipe navigation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { socialAPI, Story, User } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const THEME = {
  primary: '#007AFF',
  background: '#000000',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  overlay: 'rgba(0, 0, 0, 0.3)',
};

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  userId: string;
}

export default function StoryViewerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewed, setViewed] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const swipeThreshold = 50;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > swipeThreshold && currentIndex > 0) {
            // Swipe right - previous story
            setCurrentIndex(currentIndex - 1);
          } else if (dx < -swipeThreshold && currentIndex < stories.length - 1) {
            // Swipe left - next story
            setCurrentIndex(currentIndex + 1);
          }
        } else {
          // Vertical swipe
          if (dy > swipeThreshold) {
            // Swipe down - close
            router.back();
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    if (stories.length > 0 && currentIndex < stories.length) {
      setViewed(false);
      markAsViewed(stories[currentIndex]._id);
      startProgressAnimation();
    }
  }, [currentIndex, stories]);

  const loadStories = async () => {
    try {
      const response = await socialAPI.getStories();
      if (response.success && response.data) {
        const userStories = response.data.stories.find(
          (s: { user: User; stories: Story[] }) => s.user._id === params.userId
        );
        if (userStories) {
          setStories(userStories.stories);
          setCurrentIndex(0);
        }
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (storyId: string) => {
    if (viewed) return;
    try {
      await socialAPI.viewStory(storyId);
      setViewed(true);
    } catch (error) {
      console.error('Error viewing story:', error);
    }
  };

  const startProgressAnimation = () => {
    progressAnim.setValue(0);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000, // 5 seconds per story
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        if (currentIndex < stories.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // All stories viewed, go back
          router.back();
        }
      }
    });
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.back();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading || stories.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading story...</Text>
        </View>
      </View>
    );
  }

  const currentStory = stories[currentIndex];
  const storyUser = typeof currentStory.userId === 'object' && currentStory.userId !== null
    ? currentStory.userId 
    : { name: 'User', image: undefined, _id: '' };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" />
      
      {/* Story Image/Video */}
      <Image
        source={{ uri: currentStory.mediaUrl }}
        style={styles.storyMedia}
        resizeMode="contain"
      />
      
      {/* Overlay Gradient */}
      <View style={styles.overlay} />
      
      {/* Progress Bars */}
      <View style={[styles.progressContainer, { top: insets.top + 8 }]}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground} />
            {index === currentIndex && (
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            )}
            {index < currentIndex && (
              <View style={[styles.progressBarFill, { width: '100%' }]} />
            )}
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={[styles.header, { top: insets.top + 50 }]}>
        <View style={styles.headerLeft}>
          {storyUser.image ? (
            <Image source={{ uri: storyUser.image }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person" size={20} color={THEME.textSecondary} />
            </View>
          )}
          <View>
            <Text style={styles.headerUsername}>{storyUser.name}</Text>
            <Text style={styles.headerTime}>
              {new Date(currentStory.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={THEME.text} />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {currentStory.caption && (
        <View style={[styles.captionContainer, { bottom: insets.bottom + 100 }]}>
          <Text style={styles.caption}>{currentStory.caption}</Text>
        </View>
      )}

      {/* Navigation Areas */}
      <TouchableOpacity
        style={[styles.navArea, styles.navAreaLeft]}
        onPress={handlePrevious}
        activeOpacity={1}
      />
      <TouchableOpacity
        style={[styles.navArea, styles.navAreaRight]}
        onPress={handleNext}
        activeOpacity={1}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.text,
    fontSize: 16,
  },
  storyMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.overlay,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.text,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: THEME.text,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: THEME.text,
  },
  headerUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  headerTime: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  captionContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  caption: {
    fontSize: 16,
    color: THEME.text,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  navArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH / 3,
    zIndex: 5,
  },
  navAreaLeft: {
    left: 0,
  },
  navAreaRight: {
    right: 0,
  },
});

