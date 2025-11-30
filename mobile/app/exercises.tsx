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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exerciseAPI, Exercise } from '../lib/api';

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    // Filter exercises based on search query
    if (searchQuery.trim() === '') {
      setFilteredExercises(exercises);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = exercises.filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(query) ||
          (exercise.notes && exercise.notes.toLowerCase().includes(query))
      );
      setFilteredExercises(filtered);
    }
  }, [searchQuery, exercises]);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const response = await exerciseAPI.getAllExercises();

      if (response.success && response.data) {
        setExercises(response.data.exercises);
        setFilteredExercises(response.data.exercises);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to load exercises');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load exercises');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadExercises();
  };

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const closeDetails = () => {
    setSelectedExercise(null);
  };

  if (isLoading && exercises.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading exercises...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Exercises</Text>
        <Text style={styles.headerSubtitle}>{filteredExercises.length} exercises available</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
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
      </View>

      {/* Exercises List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredExercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No exercises found' : 'No exercises available'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Exercises will appear here once workouts are created'}
            </Text>
          </View>
        ) : (
          filteredExercises.map((exercise, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exerciseCard}
              onPress={() => handleExercisePress(exercise)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIcon}>
                  <Ionicons name="barbell" size={24} color="#007AFF" />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseMetaText}>
                      {exercise.sets} sets
                      {exercise.reps && ` × ${exercise.reps} reps`}
                    </Text>
                    {exercise.restSeconds > 0 && (
                      <Text style={styles.exerciseMetaText}>
                        • {exercise.restSeconds}s rest
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
              {exercise.notes && (
                <Text style={styles.exerciseNotes} numberOfLines={2}>
                  {exercise.notes}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Exercise Details Modal */}
      {selectedExercise && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
              <TouchableOpacity onPress={closeDetails} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Ionicons name="repeat" size={20} color="#007AFF" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Sets</Text>
                    <Text style={styles.detailValue}>{selectedExercise.sets}</Text>
                  </View>
                </View>

                {selectedExercise.reps && (
                  <View style={styles.detailRow}>
                    <Ionicons name="fitness" size={20} color="#007AFF" />
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Reps</Text>
                      <Text style={styles.detailValue}>{selectedExercise.reps}</Text>
                    </View>
                  </View>
                )}

                {selectedExercise.restSeconds > 0 && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={20} color="#007AFF" />
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Rest Time</Text>
                      <Text style={styles.detailValue}>{selectedExercise.restSeconds} seconds</Text>
                    </View>
                  </View>
                )}

                {selectedExercise.workoutCount && (
                  <View style={styles.detailRow}>
                    <Ionicons name="list" size={20} color="#007AFF" />
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Used In</Text>
                      <Text style={styles.detailValue}>
                        {selectedExercise.workoutCount} workout
                        {selectedExercise.workoutCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {selectedExercise.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Notes</Text>
                  <Text style={styles.notesText}>{selectedExercise.notes}</Text>
                </View>
              )}

              {selectedExercise.mediaUrl && (
                <View style={styles.mediaSection}>
                  <Text style={styles.mediaText}>Media available</Text>
                  <Ionicons name="videocam" size={20} color="#007AFF" />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
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
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  mediaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  mediaText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
});

