import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../lib/auth-store';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#007AFF" />
        </View>
      </View>

      {/* Date Card */}
      <View style={styles.dateCard}>
        <Ionicons name="calendar-outline" size={20} color="#007AFF" />
        <Text style={styles.dateText}>{dayName}, {dateStr}</Text>
      </View>

      {/* Today's Workout Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Workout</Text>
        <View style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <Ionicons name="barbell-outline" size={24} color="#007AFF" />
            <Text style={styles.workoutTitle}>No workout scheduled</Text>
          </View>
          <Text style={styles.workoutSubtext}>
            Check with your trainer or browse available workouts
          </Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Workouts</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={24} color="#FF6B6B" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Workouts</Text>
            <Text style={styles.statPeriod}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#4ECDC4" />
            <Text style={styles.statValue}>0h</Text>
            <Text style={styles.statLabel}>Total Time</Text>
            <Text style={styles.statPeriod}>This Week</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="barbell" size={28} color="#007AFF" />
            <Text style={styles.actionText}>Log Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="stats-chart" size={28} color="#007AFF" />
            <Text style={styles.actionText}>View Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="calendar" size={28} color="#007AFF" />
            <Text style={styles.actionText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="person-outline" size={28} color="#007AFF" />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info */}
      {user && (
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{user.email}</Text>
            </View>
            {user.role && (
              <View style={styles.infoRow}>
                <Ionicons name="shield-outline" size={20} color="#666" />
                <Text style={styles.infoText}>Role: {user.role}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  workoutSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    marginLeft: 36,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statPeriod: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
});

