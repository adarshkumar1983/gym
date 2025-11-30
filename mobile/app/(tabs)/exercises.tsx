import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { exerciseAPI, Exercise } from '../../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values - start hidden
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);

  useEffect(() => {
    // Wrap in try-catch to prevent crashes
    try {
      loadExercises();
    } catch (err) {
      console.error('Error in useEffect:', err);
      setIsLoading(false);
      setError('Failed to initialize exercises');
    }
  }, []);

  // Debug: Log exercises when they change
  useEffect(() => {
    console.log('📊 Exercises updated:', {
      total: exercises.length,
      filtered: filteredExercises.length,
      isLoading,
      error,
      firstExercise: exercises[0],
    });
  }, [exercises, filteredExercises, isLoading, error]);

  useEffect(() => {
    // Filter exercises based on search query
    if (searchQuery.trim() === '') {
      setFilteredExercises(exercises.filter(ex => ex && ex.name));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = exercises.filter(
        (exercise) =>
          exercise &&
          exercise.name &&
          (exercise.name.toLowerCase().includes(query) ||
          (exercise.notes && exercise.notes.toLowerCase().includes(query)))
      );
      setFilteredExercises(filtered);
    }
  }, [searchQuery, exercises]);

  const loadExercises = async (showCachedFirst: boolean = true) => {
    try {
      // If showing cached first, load immediately without loading state
      if (showCachedFirst) {
        console.log('🔄 Loading exercises (cached first)...');
        const cachedResponse = await exerciseAPI.getAllExercises(undefined, undefined, true);
        if (cachedResponse.success && cachedResponse.data) {
          const rawExercises = cachedResponse.data.exercises || [];
          const exercisesList = rawExercises
            .filter((ex: any) => ex && ex.name && typeof ex.name === 'string')
            .map((ex: any) => ({
              name: ex.name || 'Unnamed Exercise',
              sets: typeof ex.sets === 'number' ? ex.sets : 3,
              reps: typeof ex.reps === 'number' ? ex.reps : undefined,
              restSeconds: typeof ex.restSeconds === 'number' ? ex.restSeconds : 60,
              mediaUrl: ex.mediaUrl || null,
              notes: ex.notes || '',
              muscle: ex.muscle || '',
              type: ex.type || '',
              difficulty: ex.difficulty || '',
              equipment: ex.equipment || '',
              instructions: ex.instructions || '',
            }));
          
          setExercises(exercisesList);
          setIsLoading(false);
          console.log(`✅ Loaded ${exercisesList.length} exercises from cache`);
          
          // Now fetch fresh data in background
          setTimeout(() => {
            loadExercises(false);
          }, 100);
          return;
        }
      }

      // Fresh fetch
      setIsLoading(!showCachedFirst);
      setError(null);
      console.log('🔄 Loading exercises from API...');
      const response = await exerciseAPI.getAllExercises(undefined, undefined, false);
      console.log('📥 Exercise API Response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        const rawExercises = response.data.exercises || [];
        // Normalize and validate exercise data
        const exercisesList = rawExercises
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
        console.log(`✅ Loaded ${exercisesList.length} exercises`);
        console.log('📋 First exercise:', exercisesList[0]);
        console.log('🖼️ First exercise mediaUrl:', exercisesList[0]?.mediaUrl);
        setExercises(exercisesList);
        setFilteredExercises(exercisesList);
      } else {
        // Don't show alert on initial load, just set empty array
        setExercises([]);
        setFilteredExercises([]);
        const errorMsg = response.error?.message || 'Failed to load exercises';
        setError(errorMsg);
        console.warn('❌ Failed to load exercises:', errorMsg);
        console.warn('Response:', response);
      }
    } catch (error: any) {
      // Don't show alert on initial load, just set empty array
      setExercises([]);
      setFilteredExercises([]);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to load exercises';
      setError(errorMessage);
      console.error('❌ Error loading exercises:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Only show alert if user manually refreshes
      if (isRefreshing) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force fresh fetch, bypass cache
      await loadExercises(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExercisePress = (exercise: Exercise | null) => {
    if (!exercise || !exercise.name) return;
    
    try {
      // Set the exercise first
      setSelectedExercise(exercise);
      
      // Reset animation values
      modalOpacity.value = 0;
      modalScale.value = 0.8;
      
      // Animate in after a short delay to ensure render
      setTimeout(() => {
        try {
          modalOpacity.value = withTiming(1, { duration: 300 });
          modalScale.value = withSpring(1, { 
            damping: 20, 
            stiffness: 250
          });
        } catch (err) {
          console.error('Animation error:', err);
          // Fallback: show without animation
          modalOpacity.value = 1;
          modalScale.value = 1;
        }
      }, 10);
    } catch (err) {
      console.error('Error opening modal:', err);
      // Fallback: just show the modal
      setSelectedExercise(exercise);
    }
  };

  const closeDetails = () => {
    try {
      // Animate modal out
      modalOpacity.value = withTiming(0, { duration: 250 });
      modalScale.value = withTiming(0.8, { duration: 250 }, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(setSelectedExercise)(null);
          // Reset values for next open
          modalOpacity.value = 0;
          modalScale.value = 0.8;
        }
      });
    } catch (err) {
      console.error('Error closing modal:', err);
      // Fallback: just close
      setSelectedExercise(null);
      modalOpacity.value = 0;
      modalScale.value = 0.8;
    }
  };

  // Animated styles for modal
  const modalAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: modalOpacity.value,
      transform: [{ scale: modalScale.value }],
    };
  }, []);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: modalOpacity.value * 0.6,
    };
  }, []);


  // Show loading only on initial load
  if (isLoading && exercises.length === 0 && !isRefreshing) {
    return (
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        <Animated.Text 
          entering={FadeIn.delay(100).duration(300)}
          style={styles.loadingText}
        >
          Loading exercises...
        </Animated.Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View 
        entering={FadeIn.duration(400)}
        style={styles.header}
      >
        <Animated.Text 
          entering={FadeIn.delay(100).duration(400)}
          style={styles.headerTitle}
        >
          All Exercises
        </Animated.Text>
        <Animated.Text 
          entering={FadeIn.delay(200).duration(400)}
          style={styles.headerSubtitle}
        >
          {filteredExercises.length} exercises available
        </Animated.Text>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View 
        entering={FadeIn.delay(300).duration(400)}
        style={styles.searchContainer}
      >
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Exercises List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredExercises.length === 0 ? (
          <Animated.View 
            entering={FadeIn.duration(400)}
            style={styles.emptyContainer}
          >
            <Animated.View entering={FadeIn.delay(100).duration(400)}>
              <Ionicons name="barbell-outline" size={64} color="#ccc" />
            </Animated.View>
            <Animated.Text 
              entering={FadeIn.delay(200).duration(400)}
              style={styles.emptyText}
            >
              {searchQuery ? 'No exercises found' : 'No exercises available'}
            </Animated.Text>
            <Animated.Text 
              entering={FadeIn.delay(300).duration(400)}
              style={styles.emptySubtext}
            >
              {searchQuery
                ? 'Try a different search term'
                : error
                ? error
                : 'Exercises will appear here once workouts are created'}
            </Animated.Text>
            {error && !searchQuery && (
              <Animated.View entering={FadeIn.delay(400).duration(400)}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadExercises}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        ) : (
          filteredExercises.map((exercise, index) => {
            // Safety check - skip if exercise is invalid
            if (!exercise || !exercise.name) {
              return null;
            }
            
            return (
              <Animated.View
                key={`exercise-${exercise.name}-${index}`}
                entering={FadeIn.delay(index * 50).duration(300).springify()}
                exiting={FadeOut.duration(200)}
              >
                <TouchableOpacity
                  style={styles.exerciseCard}
                  onPress={() => handleExercisePress(exercise)}
                  activeOpacity={0.8}
                >
                  <View style={styles.exerciseHeader}>
                    <Animated.View 
                      style={styles.exerciseIcon}
                      entering={FadeIn.delay(100).duration(400)}
                    >
                      <Ionicons name="barbell" size={24} color="#007AFF" />
                    </Animated.View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name || 'Unnamed Exercise'}</Text>
                      <View style={styles.exerciseMeta}>
                        <Text style={styles.exerciseMetaText}>
                          {exercise.sets || 3} sets
                          {exercise.reps && ` × ${exercise.reps} reps`}
                        </Text>
                        {(exercise.restSeconds || 0) > 0 && (
                          <Text style={styles.exerciseMetaText}>
                            • {exercise.restSeconds || 60}s rest
                          </Text>
                        )}
                      </View>
                    </View>
                    <Animated.View
                      entering={FadeIn.delay(200).duration(400)}
                    >
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </Animated.View>
                  </View>
                  {exercise.notes && (
                    <Animated.Text 
                      style={styles.exerciseNotes} 
                      numberOfLines={2}
                      entering={FadeIn.delay(150).duration(400)}
                    >
                      {exercise.notes}
                    </Animated.Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          }).filter(Boolean)
        )}
      </ScrollView>

      {/* Exercise Details Modal */}
      {selectedExercise && selectedExercise.name && (
        <>
          <Animated.View 
            style={[styles.modalOverlay, overlayAnimatedStyle]}
          >
            <TouchableOpacity 
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeDetails}
            />
          </Animated.View>
          <Animated.View 
            style={[styles.modalContent, modalAnimatedStyle]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedExercise.name || 'Exercise Details'}</Text>
              <TouchableOpacity onPress={closeDetails} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Exercise GIF/Image */}
              <Animated.View 
                style={styles.exerciseImageContainer}
                entering={FadeIn.delay(100).duration(500)}
              >
                {selectedExercise?.mediaUrl ? (
                  <Image
                    source={{ 
                      uri: selectedExercise.mediaUrl,
                      cache: 'force-cache'
                    }}
                    style={styles.exerciseImage}
                    resizeMode="contain"
                    defaultSource={require('../../assets/icon.png')}
                    onError={(error) => {
                      console.log('❌ Image load error:', error.nativeEvent.error);
                      console.log('❌ Failed URL:', selectedExercise.mediaUrl);
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', selectedExercise.mediaUrl);
                    }}
                  />
                ) : (
                  <View style={styles.exerciseImagePlaceholder}>
                    <Ionicons name="fitness" size={64} color="#007AFF" />
                    <Text style={styles.exerciseImagePlaceholderText}>
                      {selectedExercise?.name || 'Exercise'}
                    </Text>
                    <Text style={styles.exerciseImagePlaceholderSubtext}>
                      No image available
                    </Text>
                  </View>
                )}
              </Animated.View>

              <View style={styles.detailSection}>
                <Animated.View 
                  style={styles.detailRow}
                  entering={FadeIn.delay(200).duration(400)}
                >
                  <Ionicons name="repeat" size={20} color="#007AFF" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Sets</Text>
                    <Text style={styles.detailValue}>{selectedExercise?.sets || 3}</Text>
                  </View>
                </Animated.View>

                {selectedExercise?.reps && (
                  <View style={styles.detailRow}>
                    <Ionicons name="fitness" size={20} color="#007AFF" />
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Reps</Text>
                      <Text style={styles.detailValue}>{selectedExercise.reps}</Text>
                    </View>
                  </View>
                )}

                {(selectedExercise?.restSeconds || 0) > 0 && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={20} color="#007AFF" />
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Rest Time</Text>
                      <Text style={styles.detailValue}>{selectedExercise?.restSeconds || 60} seconds</Text>
                    </View>
                  </View>
                )}

                {selectedExercise?.workoutCount && (
                  <Animated.View 
                    style={styles.detailRow}
                    entering={FadeIn.delay(350).duration(400)}
                  >
                    <Ionicons name="list" size={20} color="#007AFF" />
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Used In</Text>
                      <Text style={styles.detailValue}>
                        {selectedExercise.workoutCount} workout
                        {selectedExercise.workoutCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </View>

              {selectedExercise?.notes && (
                <Animated.View 
                  style={styles.notesSection}
                  entering={FadeIn.delay(400).duration(400)}
                >
                  <Text style={styles.notesTitle}>Instructions</Text>
                  <Text style={styles.notesText}>{selectedExercise.notes}</Text>
                </Animated.View>
              )}
            </ScrollView>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exerciseMetaText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  exerciseNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    alignSelf: 'center',
    top: '10%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailInfo: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  notesSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  exerciseImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exerciseImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
  },
  exerciseImagePlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  exerciseImagePlaceholderSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

