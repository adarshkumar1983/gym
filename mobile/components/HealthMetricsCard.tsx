import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

interface HealthMetricsCardProps {
  steps?: number;
  distanceKm?: number;
  heartRate?: number;
  activeCalories?: number;
  onSyncPress?: () => void;
  source?: 'apple-health' | 'google-fit' | 'fitbit' | 'manual';
  isLoading?: boolean;
}

export default function HealthMetricsCard({
  steps,
  distanceKm,
  heartRate,
  activeCalories,
  onSyncPress,
  source,
  isLoading = false,
}: HealthMetricsCardProps) {
  const getSourceIcon = () => {
    switch (source) {
      case 'apple-health':
        return 'logo-apple';
      case 'google-fit':
        return 'logo-google';
      case 'fitbit':
        return 'watch';
      default:
        return 'fitness';
    }
  };

  const getSourceColor = () => {
    switch (source) {
      case 'apple-health':
        return '#000000';
      case 'google-fit':
        return '#4285F4';
      case 'fitbit':
        return '#00B0B9';
      default:
        return THEME.primary;
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(600)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="pulse" size={20} color={THEME.primary} />
          <Text style={styles.title}>Health Metrics</Text>
        </View>
        {source && (
          <View style={[styles.sourceBadge, { backgroundColor: getSourceColor() + '15' }]}>
            <Ionicons name={getSourceIcon() as any} size={14} color={getSourceColor()} />
            <Text style={[styles.sourceText, { color: getSourceColor() }]}>
              {source === 'apple-health' ? 'Apple Health' : source === 'google-fit' ? 'Google Fit' : 'Fitbit'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.metricsGrid}>
        {steps !== undefined && (
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#34C75915' }]}>
              <Ionicons name="walk" size={20} color="#34C759" />
            </View>
            <Text style={styles.metricValue}>{steps.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Steps</Text>
          </View>
        )}

        {distanceKm !== undefined && (
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#007AFF15' }]}>
              <Ionicons name="location" size={20} color="#007AFF" />
            </View>
            <Text style={styles.metricValue}>{distanceKm.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>km</Text>
          </View>
        )}

        {heartRate !== undefined && (
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#FF3B3015' }]}>
              <Ionicons name="heart" size={20} color="#FF3B30" />
            </View>
            <Text style={styles.metricValue}>{heartRate}</Text>
            <Text style={styles.metricLabel}>bpm</Text>
          </View>
        )}

        {activeCalories !== undefined && (
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#FF950015' }]}>
              <Ionicons name="flame" size={20} color="#FF9500" />
            </View>
            <Text style={styles.metricValue}>{activeCalories}</Text>
            <Text style={styles.metricLabel}>kcal</Text>
          </View>
        )}
      </View>

      {onSyncPress && (
        <TouchableOpacity
          style={styles.syncButton}
          onPress={onSyncPress}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLoading ? 'hourglass-outline' : 'sync'}
            size={18}
            color={THEME.primary}
          />
          <Text style={styles.syncButtonText}>
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      )}

      {!steps && !distanceKm && !heartRate && !activeCalories && (
        <View style={styles.emptyState}>
          <Ionicons name="pulse-outline" size={48} color={THEME.textSecondary} />
          <Text style={styles.emptyText}>No health data available</Text>
          <Text style={styles.emptySubtext}>Connect a wearable device to sync</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...THEME.shadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricItem: {
    width: '50%',
    padding: 6,
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: THEME.background,
    borderRadius: 12,
    gap: 8,
  },
  syncButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
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
  },
});

