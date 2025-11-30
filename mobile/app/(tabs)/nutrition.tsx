/**
 * Nutrition Tracking Screen
 * Premium Apple-inspired design with refined UI/UX
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  FlatList,
  Dimensions,
  Keyboard,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { nutritionAPI, FoodItem, Meal, NutritionLog, NutritionGoal } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import Reanimated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  FadeInDown,
} from 'react-native-reanimated';
import NutritionCard from '../../components/NutritionCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEME = {
  primary: '#007AFF', // iOS Blue
  background: '#F2F2F7', // iOS System Background
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93', // iOS System Gray
  textTertiary: '#C7C7CC', // iOS System Gray 2
  success: '#34C759', // iOS Green
  warning: '#FF9500', // iOS Orange
  danger: '#FF3B30', // iOS Red
  divider: '#C6C6C8',
  indigo: '#5856D6',
  purple: '#AF52DE',
  pink: '#FF2D55',
  teal: '#5AC8FA',
};

const AnimatedFlatList = Reanimated.createAnimatedComponent(FlatList<Meal>);

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, checkSession } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [nutritionLog, setNutritionLog] = useState<NutritionLog | null>(null);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [remaining, setRemaining] = useState<any>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [error, setError] = useState<string | null>(null);

  const scrollY = useSharedValue(0);
  const HEADER_MAX_HEIGHT = 120;
  const HEADER_MIN_HEIGHT = 90;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 40],
      [1, 0],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
        scrollY.value,
        [0, 40],
        [0, -20],
        Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [40, 60],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
    };
  });

  const loadTodayNutrition = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await checkSession();
      const authState = useAuthStore.getState();
      
      if (!authState.isAuthenticated) {
        setError('Please log in to track nutrition');
        setLoading(false);
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
        return;
      }
      
      const response = await nutritionAPI.getTodayNutrition();
      if (response.success && response.data) {
        setNutritionLog(response.data.nutritionLog || null);
        setGoal(response.data.goal || null);
        setRemaining(response.data.remaining || null);
      } else {
        setError(response.error?.message || 'Failed to load nutrition data');
      }
    } catch (error: any) {
      console.error('Error loading nutrition:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        useAuthStore.getState().signOut();
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      } else {
        setError(error.message || 'Failed to load nutrition data');
      }
    } finally {
      setLoading(false);
    }
  }, [checkSession, router]);

  useEffect(() => {
    loadTodayNutrition();
  }, [loadTodayNutrition]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await nutritionAPI.searchFood(query);
      if (response.success && response.data?.foods) {
        setSearchResults(response.data.foods);
      }
    } catch (error) {
      console.error('Error searching food:', error);
    } finally {
      setSearching(false);
    }
  };

  const addFoodToMeal = async (food: FoodItem) => {
    setSearching(true);
    try {
      // Extract unit from serving size label (e.g., "100g" -> "g", "1 cup" -> "cup")
      const parseUnit = (label?: string): string => {
        if (!label) return 'g';
        // Match common units: g, ml, piece, cup, tbsp, tsp, oz, lb
        const unitMatch = label.match(/\b(g|ml|piece|cup|tbsp|tsp|oz|lb)\b/i);
        if (unitMatch) {
          const unit = unitMatch[1].toLowerCase();
          // Normalize variations
          if (unit === 'tbsp' || unit === 'tablespoon') return 'tbsp';
          if (unit === 'tsp' || unit === 'teaspoon') return 'tsp';
          return unit;
        }
        return 'g'; // Default to grams
      };

      const foodItem = {
        name: food.label,
        foodId: food.foodId,
        brand: food.brand,
        quantity: 100,
        unit: parseUnit(food.servingSizes?.[0]?.label),
        calories: food.nutrients.calories || 0,
        protein: food.nutrients.protein || 0,
        carbs: food.nutrients.carbs || 0,
        fats: food.nutrients.fat || 0,
        fiber: food.nutrients.fiber || 0,
        sugar: food.nutrients.sugar || 0,
      };

      const response = await nutritionAPI.addMeal({
        mealType: selectedMealType,
        foodItems: [foodItem],
        consumedAt: new Date().toISOString(),
      });

      if (response.success && response.data) {
        setNutritionLog(response.data.nutritionLog || null);
        setGoal(response.data.goal || null);
        setRemaining(response.data.remaining || null);
        setSearchQuery('');
        setSearchResults([]);
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('Error adding meal:', error);
    } finally {
      setSearching(false);
    }
  };

  const mealTypes = useMemo(() => [
    { key: 'breakfast' as const, label: 'Breakfast', color: THEME.warning, icon: 'sunny' },
    { key: 'lunch' as const, label: 'Lunch', color: THEME.success, icon: 'restaurant' },
    { key: 'dinner' as const, label: 'Dinner', color: THEME.indigo, icon: 'moon' },
    { key: 'snack' as const, label: 'Snack', color: THEME.teal, icon: 'cafe' },
  ], []);

  // Formatting helpers for NutritionCard
  const getMealTitle = (mealType: string) => {
    return mealTypes.find(t => t.key === mealType)?.label || mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const getMealTime = (dateStr?: Date) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNutritionSummary = (meal: Meal) => {
    // FoodItems in Meal model use 'name' and direct properties, not 'label' and 'nutrients'
    const items = meal.foodItems.map(f => {
      const foodName = (f as any).name || (f as any).label || 'Unknown';
      const calories = (f as any).calories || ((f as any).nutrients?.calories) || 0;
      return `${foodName} (${Math.round(calories)})`;
    }).join(' · ');
    const macros = `P: ${Math.round(meal.totalProtein)}g · C: ${Math.round(meal.totalCarbs)}g · F: ${Math.round(meal.totalFats)}g`;
    return `${macros}\n${items}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Syncing nutrition data...</Text>
      </View>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="lock-closed" size={48} color={THEME.textTertiary} style={{ marginBottom: 16 }} />
        <Text style={styles.errorTitle}>Sign In Required</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const caloriesConsumed = nutritionLog?.totalCalories || 0;
  const caloriesTarget = goal?.targetCalories || 2000;
  const caloriesRemaining = Math.max(0, caloriesTarget - caloriesConsumed);
  const caloriesPercentage = Math.min((caloriesConsumed / caloriesTarget) * 100, 100);
  const caloriesColor = caloriesPercentage > 100 ? THEME.danger : THEME.primary;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Sticky Header (Compact) - Only visible when scrolled up */}
      <Reanimated.View style={[styles.stickyHeader, stickyHeaderStyle, { paddingTop: insets.top }]}>
        <Text style={styles.stickyHeaderTitle}>Nutrition</Text>
      </Reanimated.View>

      {/* Search Results Dropdown - Keep absolute but only show when needed */}
      {searchResults.length > 0 && (
        <>
          {/* Backdrop to close search on tap outside */}
          <TouchableOpacity 
            style={styles.searchBackdrop}
            activeOpacity={1}
            onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
              Keyboard.dismiss();
            }}
          />
          <View style={[styles.searchResultsContainer, { top: insets.top + 120 }]}>
            {/* Search Results Header */}
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  Keyboard.dismiss();
                }}
                style={styles.closeSearchButton}
              >
                <Ionicons name="close" size={22} color={THEME.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.foodId}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => addFoodToMeal(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.searchResultContent}>
                    <Text style={styles.searchResultLabel}>{item.label}</Text>
                    {item.brand && (
                      <Text style={styles.searchResultBrand}>{item.brand}</Text>
                    )}
                    <Text style={styles.searchResultNutrients}>
                      {Math.round(item.nutrients.calories)} cal · P: {Math.round(item.nutrients.protein)}g · C: {Math.round(item.nutrients.carbs)}g · F: {Math.round(item.nutrients.fat)}g
                    </Text>
                  </View>
                  <View style={styles.addButtonContainer}>
                    <Ionicons name="add-circle" size={28} color={THEME.primary} />
                  </View>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="always"
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </>
      )}

      <AnimatedFlatList
        data={nutritionLog?.meals || []}
        keyExtractor={(item: unknown, index) => (item as Meal)._id || `meal-${index}`}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        // Padding added via header component top margin, no top padding on container to prevent clip
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.contentContainer, { paddingTop: Math.max(insets.top, 47) + 20 }]}>
            {/* Large Title Area */}
            <Reanimated.View style={[styles.largeTitleContainer, headerAnimatedStyle]}>
              <Text style={styles.largeTitle}>Today</Text>
              <Text style={styles.dateSubtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </Reanimated.View>

            {/* Integrated Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={THEME.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search food (e.g., 'Oatmeal', 'Banana')"
                placeholderTextColor={THEME.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchResults.length > 0) {
                    Keyboard.dismiss();
                  }
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => { 
                    setSearchQuery(''); 
                    setSearchResults([]);
                    Keyboard.dismiss();
                  }}
                  style={styles.clearSearchButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={THEME.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Summary Card - Calories */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Calories</Text>
                <Text style={styles.summaryTarget}>{Math.round(caloriesConsumed)} / {Math.round(caloriesTarget)} kcal</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${caloriesPercentage}%`, backgroundColor: caloriesColor }]} />
              </View>
              <Text style={styles.summarySubtitle}>{Math.round(caloriesRemaining)} kcal remaining</Text>
            </View>

            {/* Macros Row */}
            {goal && (
              <View style={styles.macrosRow}>
                <View style={styles.macroCard}>
                  <Text style={[styles.macroValue, { color: THEME.success }]}>{Math.round(nutritionLog?.totalProtein || 0)}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <View style={styles.miniProgressBg}>
                    <View style={[styles.miniProgressFill, { backgroundColor: THEME.success, width: `${Math.min(((nutritionLog?.totalProtein || 0) / goal.targetProtein) * 100, 100)}%` }]} />
                  </View>
                </View>

                <View style={styles.macroCard}>
                  <Text style={[styles.macroValue, { color: THEME.warning }]}>{Math.round(nutritionLog?.totalCarbs || 0)}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <View style={styles.miniProgressBg}>
                    <View style={[styles.miniProgressFill, { backgroundColor: THEME.warning, width: `${Math.min(((nutritionLog?.totalCarbs || 0) / goal.targetCarbs) * 100, 100)}%` }]} />
                  </View>
                </View>

                <View style={styles.macroCard}>
                  <Text style={[styles.macroValue, { color: THEME.pink }]}>{Math.round(nutritionLog?.totalFats || 0)}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <View style={styles.miniProgressBg}>
                    <View style={[styles.miniProgressFill, { backgroundColor: THEME.pink, width: `${Math.min(((nutritionLog?.totalFats || 0) / goal.targetFats) * 100, 100)}%` }]} />
                  </View>
                </View>
              </View>
            )}

            {/* Meal Type Selector (Quick Add) */}
            <Text style={styles.sectionHeader}>Log Meal</Text>
            <View style={styles.mealSelector}>
               {mealTypes.map((type) => (
                 <TouchableOpacity
                   key={type.key}
                   style={[
                     styles.mealChip,
                     selectedMealType === type.key && styles.mealChipSelected,
                     selectedMealType === type.key && { backgroundColor: type.color }
                   ]}
                   onPress={() => setSelectedMealType(type.key)}
                 >
                   <Ionicons 
                     name={type.icon as any} 
                     size={18} 
                     color={selectedMealType === type.key ? '#FFF' : type.color} 
                   />
                   <Text style={[
                     styles.mealChipText,
                     selectedMealType === type.key && { color: '#FFF' }
                   ]}>{type.label}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <Text style={styles.sectionHeader}>History</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Reanimated.View entering={FadeInDown.delay(index * 100).duration(400)}>
            <NutritionCard
              title={getMealTitle((item as Meal).mealType)}
              calories={(item as Meal).totalCalories}
              servingSize={`${(item as Meal).foodItems.length} items`}
              time={getMealTime((item as Meal).consumedAt)}
              nutritionText={getNutritionSummary(item as Meal)}
            />
          </Reanimated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No meals tracked today.</Text>
            <Text style={styles.emptyStateSubtext}>Use the search bar to add your first meal.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: THEME.textSecondary,
  },
  
  // Header
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(242, 242, 247, 0.95)', // Translucent
    zIndex: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  stickyHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },
  largeTitleContainer: {
    marginBottom: 16,
    marginTop: 12,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 0.3,
  },
  dateSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: THEME.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 24, // Space below search bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    marginLeft: 8,
    color: THEME.text,
    height: '100%',
  },
  
  // Search Results
  searchBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 199,
  },
  searchResultsContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: 450,
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
    backgroundColor: '#FAFAFA',
  },
  searchResultsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  closeSearchButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  searchResultsList: {
    maxHeight: 380,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
    backgroundColor: '#FFFFFF',
  },
  searchResultContent: {
    flex: 1,
    marginRight: 12,
  },
  searchResultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 2,
  },
  searchResultBrand: {
    fontSize: 12,
    color: THEME.textTertiary,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  searchResultNutrients: {
    fontSize: 13,
    color: THEME.textSecondary,
    lineHeight: 18,
  },
  addButtonContainer: {
    padding: 4,
  },
  clearSearchButton: {
    padding: 4,
  },

  // Dashboard Cards
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  summaryTarget: {
    fontSize: 15,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 14,
    backgroundColor: '#F2F2F7',
    borderRadius: 7,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  summarySubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontWeight: '500',
    textAlign: 'right',
  },

  // Macros
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500',
    marginBottom: 10,
  },
  miniProgressBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Section Header
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: -0.5,
  },

  // Meal Selector
  mealSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 10,
  },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.divider,
    gap: 6,
  },
  mealChipSelected: {
    borderColor: 'transparent',
  },
  mealChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: THEME.textSecondary,
  },

  // Error
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  scrollContent: {
    paddingBottom: 40,
  },
});