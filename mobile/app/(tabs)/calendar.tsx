import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';
import { calendarAPI, CalendarEvent, Workout } from '../../lib/calendar-api';
import { workoutAPI, WorkoutTemplate } from '../../lib/api';
import Calendar from '../../components/Calendar';

const THEME = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  primary: '#007AFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
};

export default function CalendarScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [availableWorkouts, setAvailableWorkouts] = useState<WorkoutTemplate[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [scheduleTime, setScheduleTime] = useState(new Date());

  useEffect(() => {
    loadCalendarData();
  }, []);

  useEffect(() => {
    loadWorkoutsForDate(selectedDate);
  }, [selectedDate]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);

      const response = await calendarAPI.getCalendarEvents(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (response.success && response.data?.events) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkoutsForDate = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await calendarAPI.getWorkoutsForDate(dateStr);

      if (response.success && response.data?.workouts) {
        setWorkouts(response.data.workouts);
      } else {
        setWorkouts([]);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      setWorkouts([]);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (date: Date) => {
    loadCalendarData();
  };

  const handleScheduleWorkout = async () => {
    if (!selectedWorkout) {
      Alert.alert('Error', 'Please select a workout');
      return;
    }

    setIsLoading(true);
    try {
      const response = await calendarAPI.scheduleWorkout({
        templateId: selectedWorkout,
        scheduledAt: scheduleTime.toISOString(),
      });

      if (response.success) {
        Alert.alert('Success', 'Workout scheduled successfully');
        setShowScheduleModal(false);
        setSelectedWorkout(null);
        loadCalendarData();
        loadWorkoutsForDate(selectedDate);
      } else {
        Alert.alert('Error', response.error?.message || 'Failed to schedule workout');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to schedule workout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (workoutId: string, status: 'completed' | 'skipped') => {
    try {
      const response = await calendarAPI.updateWorkoutStatus(workoutId, status);
      if (response.success) {
        loadCalendarData();
        loadWorkoutsForDate(selectedDate);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this scheduled workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await calendarAPI.deleteWorkout(workoutId);
              if (response.success) {
                loadCalendarData();
                loadWorkoutsForDate(selectedDate);
              }
            } catch (error) {
              console.error('Error deleting workout:', error);
            }
          },
        },
      ]
    );
  };

  const openScheduleModal = async () => {
    setShowScheduleModal(true);
    try {
      const response = await workoutAPI.getAllWorkouts();
      if (response.success && response.data?.workouts) {
        setAvailableWorkouts(response.data.workouts);
      } else {
        // If no workout templates exist, show empty state
        setAvailableWorkouts([]);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      setAvailableWorkouts([]);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return THEME.success;
      case 'in_progress':
        return THEME.primary;
      case 'skipped':
        return THEME.danger;
      default:
        return THEME.warning;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'in_progress':
        return 'play-circle';
      case 'skipped':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
            </Text>
            <Text style={styles.greeting}>Calendar</Text>
          </View>
          <TouchableOpacity style={styles.scheduleButton} onPress={openScheduleModal} activeOpacity={0.8}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Calendar */}
        <Calendar
          events={events}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
        />

        {/* Selected Date Workouts */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.workoutsSection}>
          <Text style={styles.sectionTitle}>{formatDate(selectedDate)}</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME.primary} />
            </View>
          ) : workouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={THEME.textSecondary} />
              <Text style={styles.emptyText}>No workouts scheduled</Text>
              <Text style={styles.emptySubtext}>Tap the + button to schedule a workout</Text>
            </View>
          ) : (
            workouts.map((workout, index) => {
              const template = typeof workout.templateId === 'object' ? workout.templateId : null;
              const workoutName = template?.name || 'Workout';
              const scheduledTime = new Date(workout.scheduledAt);

              return (
                <Animated.View
                  key={workout._id}
                  entering={FadeInDown.delay(150 + index * 50).duration(600)}
                  style={styles.workoutCard}
                >
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutInfo}>
                      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(workout.status) }]} />
                      <View style={styles.workoutDetails}>
                        <Text style={styles.workoutName}>{workoutName}</Text>
                        <Text style={styles.workoutTime}>{formatTime(scheduledTime)}</Text>
                      </View>
                    </View>
                    <View style={styles.workoutActions}>
                      {workout.status === 'pending' && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(workout._id, 'completed')}
                            style={styles.actionButton}
                          >
                            <Ionicons name="checkmark" size={20} color={THEME.success} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(workout._id, 'skipped')}
                            style={styles.actionButton}
                          >
                            <Ionicons name="close" size={20} color={THEME.danger} />
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeleteWorkout(workout._id)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="trash-outline" size={20} color={THEME.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.workoutStatus}>
                    <Ionicons name={getStatusIcon(workout.status) as any} size={16} color={getStatusColor(workout.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(workout.status) }]}>
                      {workout.status.charAt(0).toUpperCase() + workout.status.slice(1)}
                    </Text>
                  </View>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>

      {/* Schedule Workout Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Workout</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Select Workout</Text>
              {availableWorkouts.length === 0 ? (
                <View style={styles.emptyWorkoutsState}>
                  <Ionicons name="barbell-outline" size={48} color={THEME.textSecondary} />
                  <Text style={styles.emptyWorkoutsText}>No workout templates available</Text>
                  <Text style={styles.emptyWorkoutsSubtext}>
                    Create workout templates in the app to schedule them
                  </Text>
                </View>
              ) : (
                availableWorkouts.map((workout) => (
                  <TouchableOpacity
                    key={workout._id}
                    style={[
                      styles.workoutOption,
                      selectedWorkout === workout._id && styles.workoutOptionSelected,
                    ]}
                    onPress={() => setSelectedWorkout(workout._id)}
                  >
                    <View style={styles.workoutOptionContent}>
                      <Text style={styles.workoutOptionText}>{workout.name}</Text>
                      {workout.description && (
                        <Text style={styles.workoutOptionDescription} numberOfLines={1}>
                          {workout.description}
                        </Text>
                      )}
                      <Text style={styles.workoutOptionExercises}>
                        {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
                      </Text>
                    </View>
                    {selectedWorkout === workout._id && (
                      <Ionicons name="checkmark" size={20} color={THEME.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}

              <Text style={styles.modalLabel}>Date & Time</Text>
              <View style={styles.dateTimeContainer}>
                <Text style={styles.dateTimeText}>
                  {formatDate(scheduleTime)} at {formatTime(scheduleTime)}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleScheduleWorkout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Schedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 0.3,
  },
  scheduleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadow,
  },
  workoutsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...THEME.shadow,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  workoutTime: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.background,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 12,
    marginTop: 8,
  },
  workoutOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: THEME.background,
    marginBottom: 8,
  },
  workoutOptionSelected: {
    backgroundColor: THEME.primary + '15',
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  workoutOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
  },
  dateTimeContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: THEME.background,
  },
  dateTimeText: {
    fontSize: 16,
    color: THEME.text,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: THEME.background,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: THEME.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workoutOptionContent: {
    flex: 1,
  },
  workoutOptionDescription: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  workoutOptionExercises: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  emptyWorkoutsState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyWorkoutsText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyWorkoutsSubtext: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
});

