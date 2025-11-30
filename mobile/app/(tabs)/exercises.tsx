import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { exerciseAPI, Exercise } from '../../lib/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 140;

// Theme Constants (Apple Inspired)
const THEME = {
  background: '#F2F2F7', // System Grouped Background
  card: '#FFFFFF',
  primary: '#007AFF', // Apple Blue
  secondary: '#5856D6', // Apple Indigo
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FFCC00',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
};

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const scrollY = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.92);

  useEffect(() => {
    // Initial load - try cache first
    loadExercises(true);
  }, []);

  useEffect(() => {
    // Filter exercises based on search query
    if (searchQuery.trim() === '') {
      setFilteredExercises(exercises);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = exercises.filter(
        (exercise) =>
          exercise &&
          exercise.name &&
          (exercise.name.toLowerCase().includes(query) ||
          (exercise.muscle && exercise.muscle.toLowerCase().includes(query)) ||
          (exercise.notes && exercise.notes.toLowerCase().includes(query)))
      );
      setFilteredExercises(filtered);
    }
  }, [searchQuery, exercises]);

  const loadExercises = async (showCachedFirst: boolean = true) => {
    try {
      if (showCachedFirst) {
        const cachedResponse = await exerciseAPI.getAllExercises(undefined, undefined, true);
        if (cachedResponse.success && cachedResponse.data) {
          const exercisesList = processExercises(cachedResponse.data.exercises || []);
          setExercises(exercisesList);
          setIsLoading(false);
          
          // Fetch fresh data in background
          setTimeout(() => loadExercises(false), 500);
          return;
        }
      }

      setIsLoading(!showCachedFirst);
      setError(null);
      
      const response = await exerciseAPI.getAllExercises(undefined, undefined, !showCachedFirst);

      if (response.success && response.data) {
        const exercisesList = processExercises(response.data.exercises || []);
        setExercises(exercisesList);
        if (filteredExercises.length === 0 || !showCachedFirst) {
            setFilteredExercises(exercisesList);
        }
      } else {
        if (!showCachedFirst && exercises.length === 0) {
            setError(response.error?.message || 'Failed to load exercises');
        }
      }
    } catch (error: any) {
      if (!showCachedFirst && exercises.length === 0) {
        setError(error.message || 'Failed to load exercises');
      }
      console.error('Error loading exercises:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const processExercises = (rawExercises: any[]) => {
    return rawExercises
      .filter((ex: any) => ex && ex.name && typeof ex.name === 'string')
      .map((ex: any) => ({
        name: ex.name || 'Unnamed Exercise',
        sets: typeof ex.sets === 'number' ? ex.sets : 3,
        reps: typeof ex.reps === 'number' ? ex.reps : undefined,
        restSeconds: typeof ex.restSeconds === 'number' ? ex.restSeconds : 60,
        mediaUrl: ex.mediaUrl || null,
        notes: ex.notes || ex.instructions || '',
        muscle: ex.muscle || '',
        type: ex.type || '',
        difficulty: ex.difficulty || '',
        equipment: ex.equipment || '',
        instructions: ex.instructions || '',
        workoutCount: ex.workoutCount,
      }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadExercises(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExercisePress = (exercise: Exercise | null) => {
    if (!exercise) return;
    setSelectedExercise(exercise);
    modalOpacity.value = withTiming(1, { duration: 200 });
    modalScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const closeModal = () => {
    modalOpacity.value = withTiming(0, { duration: 150 });
    modalScale.value = withTiming(0.92, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(setSelectedExercise)(null);
      }
    });
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 40], [1, 0], Extrapolate.CLAMP),
      transform: [
        { translateY: interpolate(scrollY.value, [0, 40], [0, -20], Extrapolate.CLAMP) }
      ],
    };
  });
  
  const stickyHeaderStyle = useAnimatedStyle(() => {
    return {
        opacity: interpolate(scrollY.value, [30, 50], [0, 1], Extrapolate.CLAMP),
        transform: [
            { translateY: interpolate(scrollY.value, [30, 50], [10, 0], Extrapolate.CLAMP) }
        ],
    }
  })

  const modalStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
      transform: [{ scale: modalScale.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
    };
  });

  const renderExerciseCard = ({ item, index }: { item: Exercise; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).springify()}
      style={styles.cardContainer}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleExercisePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {item.muscle ? item.muscle.charAt(0).toUpperCase() + item.muscle.slice(1) : 'General'} 
              {item.equipment ? ` • ${item.equipment}` : ''}
            </Text>
            
            <View style={styles.tagContainer}>
              {item.difficulty && (
                <View style={[styles.tag, styles.difficultyTag]}>
                  <Text style={styles.tagText}>{item.difficulty}</Text>
                </View>
              )}
              {item.type && (
                <View style={[styles.tag, styles.typeTag]}>
                  <Text style={styles.tagText}>{item.type}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.cardImageContainer}>
            {item.mediaUrl ? (
              <Image 
                source={{ uri: item.mediaUrl }} 
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cardImage, styles.placeholderImage]}>
                <Ionicons name="barbell" size={24} color="#C7C7CC" />
              </View>
            )}
          </View>
          
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Sticky Small Header (appears on scroll) */}
      <Animated.View style={[styles.stickyHeader, stickyHeaderStyle]}>
        <View style={styles.stickyHeaderContent}>
            <Text style={styles.stickyHeaderTitle}>Exercises</Text>
      </View>
        <View style={styles.stickyHeaderBorder} />
      </Animated.View>

      <Animated.FlatList
        data={filteredExercises}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={renderExerciseCard}
        contentContainerStyle={styles.listContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            tintColor={THEME.textSecondary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Animated.View style={[styles.largeTitleContainer, headerStyle]}>
              <Text style={styles.largeTitle}>Exercises</Text>
            </Animated.View>
            
      <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
                placeholder="Search exercises, muscles..."
                placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
        />
      </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color={THEME.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
                    )}
                  </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No exercises found</Text>
              <Text style={styles.emptySubtitle}>Try searching for a different muscle group or equipment.</Text>
                </View>
          ) : (
             <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.textSecondary} />
              </View>
          )
        }
      />

      {/* Detail Modal */}
      {selectedExercise && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.modalBackdrop, backdropStyle]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} />
          </Animated.View>

          <Animated.View style={[styles.modalContainer, modalStyle]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close-circle" size={30} color="#E5E5EA" />
              </TouchableOpacity>
            </View>

              <Animated.ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.modalImageContainer}>
                   {selectedExercise.mediaUrl ? (
                      <Image
                        source={{ uri: selectedExercise.mediaUrl }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                   ) : (
                      <View style={styles.modalPlaceholder}>
                         <Ionicons name="fitness" size={64} color={THEME.primary} />
                         <Text style={styles.modalPlaceholderText}>No Image</Text>
                  </View>
                   )}
                </View>

                <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                
                <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Muscle</Text>
                        <Text style={styles.metaValue}>{selectedExercise.muscle || '—'}</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Equipment</Text>
                        <Text style={styles.metaValue}>{selectedExercise.equipment || '—'}</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Level</Text>
                        <Text style={styles.metaValue}>{selectedExercise.difficulty || '—'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Instructions</Text>
                    <Text style={styles.instructionsText}>
                        {selectedExercise.instructions || selectedExercise.notes || 'No instructions available.'}
                    </Text>
                </View>
              </Animated.ScrollView>
          </View>
          </Animated.View>
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
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    backgroundColor: 'rgba(242, 242, 247, 0.95)',
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stickyHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },
  stickyHeaderBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  largeTitleContainer: {
    marginBottom: 16,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 0.37,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E3E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44, // Standard iOS tap target height
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: THEME.text,
    height: '100%',
  },
  listContent: {
    paddingBottom: 100, // Space for tab bar
  },
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    ...THEME.shadow,
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    marginRight: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  difficultyTag: {
    backgroundColor: '#E5F9E7', // Light Green
  },
  typeTag: {
    backgroundColor: '#E8F2FF', // Light Blue
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    textTransform: 'capitalize',
  },
  chevronContainer: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1000,
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: THEME.card,
    borderRadius: 24,
    overflow: 'hidden',
    ...THEME.shadow,
  },
  modalHeader: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
  },
  closeButton: {
    // padding: 8,
  },
  modalScrollContent: {
    padding: 0,
  },
  modalImageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalPlaceholder: {
    alignItems: 'center',
  },
  modalPlaceholderText: {
    marginTop: 12,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    paddingHorizontal: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E5EA',
  },
  metaLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3A3A3C',
  },
  errorContainer: {
      backgroundColor: '#FFE5E5',
      padding: 12,
      borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
      marginTop: 12,
  },
  errorText: {
      color: THEME.danger,
      marginLeft: 8,
      flex: 1,
    fontSize: 14,
  }
});
