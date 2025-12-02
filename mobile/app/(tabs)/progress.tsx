import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';
import { healthSyncAPI, HealthData } from '../../lib/health-sync';
import HealthMetricsCard from '../../components/HealthMetricsCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Theme Constants
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

export default function ProgressScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  // Mock data - replace with real API data
  const weeklyStats = {
    workoutsCompleted: 3,
    workoutsGoal: 4,
    totalTime: 4.5,
    personalRecords: 5,
    totalLifted: 1250,
    currentStreak: 12,
    monthlyTime: 18.5,
  };

  // Fetch today's health data
  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    setIsLoadingHealth(true);
    try {
      const response = await healthSyncAPI.getTodayHealthData();
      if (response.success && response.data?.healthData) {
        setHealthData(response.data.healthData as HealthData);
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const handleSyncHealth = async () => {
    setIsLoadingHealth(true);
    try {
      // TODO: Implement actual health data reading from device
      // For now, this is a placeholder
      await loadHealthData();
    } catch (error) {
      console.error('Error syncing health data:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const recentAchievements = [
    { id: 1, title: 'New Personal Record!', subtitle: 'Bench Press: 100kg × 5 reps', date: '2 days ago', icon: 'medal', color: '#FFD700' },
    { id: 2, title: 'Workout Streak', subtitle: '12 days in a row', date: 'Today', icon: 'flame', color: '#FF9500' },
    { id: 3, title: 'Monthly Goal', subtitle: 'Completed 15 workouts', date: '1 week ago', icon: 'trophy', color: '#34C759' },
  ];

  const weeklyProgress = (weeklyStats.workoutsCompleted / weeklyStats.workoutsGoal) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View 
          entering={FadeInDown.duration(600)}
          style={styles.header}
        >
          <View>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
            </Text>
            <Text style={styles.greeting}>Progress</Text>
          </View>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={THEME.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Health Metrics Card */}
        <HealthMetricsCard
          steps={healthData?.steps}
          distanceKm={healthData?.distanceMeters ? healthData.distanceMeters / 1000 : undefined}
          heartRate={healthData?.averageHeartRate}
          activeCalories={healthData?.activeCalories}
          source={healthData?.source}
          onSyncPress={handleSyncHealth}
          isLoading={isLoadingHealth}
        />

        {/* Weekly Goal Progress Card */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleContainer}>
              <Ionicons name="stats-chart" size={20} color={THEME.primary} />
              <Text style={styles.progressTitle}>Weekly Goal</Text>
            </View>
            <Text style={styles.progressPercentage}>{Math.round(weeklyProgress)}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${weeklyProgress}%` }]} />
          </View>
          <Text style={styles.progressSubtext}>
            {weeklyStats.workoutsCompleted} of {weeklyStats.workoutsGoal} workouts completed
          </Text>
        </Animated.View>

        {/* Progress Stats Grid */}
        <Animated.View 
          entering={FadeInDown.delay(150).duration(600)}
          style={styles.statsGrid}
        >
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#34C75915' }]}>
                <Ionicons name="trophy" size={24} color="#34C759" />
              </View>
              <Text style={styles.statValue}>{weeklyStats.personalRecords}</Text>
              <Text style={styles.statLabel}>PRs This Month</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FF950015' }]}>
                <Ionicons name="flame" size={24} color="#FF9500" />
              </View>
              <Text style={styles.statValue}>{weeklyStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#007AFF15' }]}>
                <Ionicons name="barbell" size={24} color="#007AFF" />
              </View>
              <Text style={styles.statValue}>{weeklyStats.totalLifted.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Lifted (kg)</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#5856D615' }]}>
                <Ionicons name="time" size={24} color="#5856D6" />
              </View>
              <Text style={styles.statValue}>{weeklyStats.monthlyTime}h</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Achievements Section */}
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        {recentAchievements.map((achievement, index) => (
          <Animated.View 
            key={achievement.id}
            entering={FadeInDown.delay(200 + (index * 50)).duration(600)}
            style={styles.achievementCard}
          >
            <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '15' }]}>
              <Ionicons name={achievement.icon as any} size={24} color={achievement.color} />
            </View>
            <View style={styles.achievementContent}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementSubtitle}>{achievement.subtitle}</Text>
              <Text style={styles.achievementDate}>{achievement.date}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </Animated.View>
        ))}

        {/* Monthly Overview Card */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.overviewCard}
        >
          <Text style={styles.overviewTitle}>Monthly Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatValue}>15</Text>
              <Text style={styles.overviewStatLabel}>Workouts</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatValue}>18.5h</Text>
              <Text style={styles.overviewStatLabel}>Total Time</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatValue}>5</Text>
              <Text style={styles.overviewStatLabel}>New PRs</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="calendar-outline" size={20} color={THEME.primary} />
            <Text style={styles.quickActionText}>View History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="analytics-outline" size={20} color={THEME.primary} />
            <Text style={styles.quickActionText}>Detailed Stats</Text>
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadow,
  },
  progressCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...THEME.shadow,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.primary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 6,
  },
  progressSubtext: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  statsGrid: {
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...THEME.shadow,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...THEME.shadow,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  achievementSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  overviewCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    marginBottom: 32,
    ...THEME.shadow,
  },
  overviewTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  overviewStatLabel: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  overviewDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    ...THEME.shadow,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.primary,
  },
});

