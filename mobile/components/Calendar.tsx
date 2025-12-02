import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = SCREEN_WIDTH / 7;

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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
};

interface CalendarEvent {
  date: string;
  workouts: Array<{
    id: string;
    templateName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  }>;
}

interface CalendarProps {
  events?: CalendarEvent[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
}

export default function Calendar({ events = [], selectedDate, onDateSelect, onMonthChange }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = useMemo(() => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    return date;
  }, [currentMonth]);

  const monthEnd = useMemo(() => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return date;
  }, [currentMonth]);

  const startDate = useMemo(() => {
    const start = new Date(monthStart);
    const day = start.getDay();
    start.setDate(start.getDate() - day); // Start from Sunday
    return start;
  }, [monthStart]);

  const days = useMemo(() => {
    const daysArray: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(monthEnd);
    end.setDate(end.getDate() + (6 - end.getDay())); // End on Saturday

    while (current <= end) {
      daysArray.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return daysArray;
  }, [startDate, monthEnd]);

  const eventsMap = useMemo(() => {
    const map = new Map<string, CalendarEvent['workouts']>();
    events.forEach((event) => {
      map.set(event.date, event.workouts);
    });
    return map;
  }, [events]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
    onMonthChange?.(newDate);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const getWorkoutsForDate = (date: Date): CalendarEvent['workouts'] => {
    const dateKey = date.toISOString().split('T')[0];
    return eventsMap.get(dateKey) || [];
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

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthName}</Text>
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={THEME.text} />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((date, index) => {
          const workouts = getWorkoutsForDate(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          const isCurrentMonthDate = isCurrentMonth(date);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                !isCurrentMonthDate && styles.dayCellOtherMonth,
                isTodayDate && styles.dayCellToday,
                isSelectedDate && styles.dayCellSelected,
              ]}
              onPress={() => onDateSelect?.(date)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  !isCurrentMonthDate && styles.dayTextOtherMonth,
                  isTodayDate && styles.dayTextToday,
                  isSelectedDate && styles.dayTextSelected,
                ]}
              >
                {date.getDate()}
              </Text>
              {workouts.length > 0 && (
                <View style={styles.workoutIndicators}>
                  {workouts.slice(0, 3).map((workout, idx) => (
                    <View
                      key={idx}
                      style={[styles.workoutDot, { backgroundColor: getStatusColor(workout.status) }]}
                    />
                  ))}
                  {workouts.length > 3 && (
                    <Text style={styles.moreWorkoutsText}>+{workouts.length - 3}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...THEME.shadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    width: DAY_WIDTH - 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH - 16,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: THEME.primary + '15',
  },
  dayCellSelected: {
    backgroundColor: THEME.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
  },
  dayTextOtherMonth: {
    color: THEME.textSecondary,
  },
  dayTextToday: {
    color: THEME.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  workoutIndicators: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  workoutDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moreWorkoutsText: {
    fontSize: 8,
    color: THEME.textSecondary,
    marginLeft: 2,
  },
});

