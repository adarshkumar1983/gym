/**
 * Nutrition Tracking Screen
 * Premium Apple-inspired design with refined UI/UX
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  withSpring,
  withTiming,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEME = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  divider: '#E5E5EA',
  indigo: '#5856D6',
  purple: '#AF52DE',
  pink: '#FF2D55',
  teal: '#5AC8FA',
};

const AnimatedFlatList = Reanimated.createAnimatedComponent(FlatList<Meal>);

// Helper component for the circular progress (simulated with views since no SVG)
const MacroRing = ({ color, percentage, size = 60 }: { color: string; percentage: number; size?: number }) => {
  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <View style={[styles.ringBackground, { borderColor: color + '20' }]} />
      {/* Simple visual representation - full rings need SVG */}
      <View style={[styles.ringInner, { backgroundColor: color + '10' }]}>
         <Text style={[styles.ringText, { color: color }]}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
};

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
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollY = useSharedValue(0);
  const HEADER_MAX_HEIGHT = 120;
  const HEADER_MIN_HEIGHT = 60;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, 60],
      [1, 0],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolate.CLAMP
    );

    return {
      height,
      opacity,
      transform: [{ scale }],
    };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [60, 100],
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
      
      // Always verify session first to ensure cookies are valid
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
        // Clear auth state and redirect to login
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
      // Format food item for the API
      const foodItem = {
        ...food,
        quantity: 100, // Default to 100g or 1 serving
        unit: food.servingSizes[0]?.label || 'g',
        // Ensure all nutrient fields are present
        nutrients: {
          calories: food.nutrients.calories || 0,
          protein: food.nutrients.protein || 0,
          carbs: food.nutrients.carbs || 0,
          fat: food.nutrients.fat || 0,
          fiber: food.nutrients.fiber || 0,
          sugar: food.nutrients.sugar || 0,
        }
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

  const mealTypes = [
    { key: 'breakfast' as const, label: 'Breakfast', color: THEME.warning, icon: 'sunny' },
    { key: 'lunch' as const, label: 'Lunch', color: THEME.success, icon: 'restaurant' },
    { key: 'dinner' as const, label: 'Dinner', color: THEME.indigo, icon: 'moon' },
    { key: 'snack' as const, label: 'Snack', color: THEME.teal, icon: 'cafe' },
  ];

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
        <View style={styles.errorIconContainer}>
          <Ionicons name="lock-closed" size={40} color={THEME.primary} />
        </View>
        <Text style={styles.errorTitle}>Authentication Required</Text>
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
      {/* Sticky Compact Header */}
      <Reanimated.View style={[styles.stickyHeader, stickyHeaderStyle, { paddingTop: insets.top }]}>
        <Text style={styles.stickyHeaderTitle}>Nutrition</Text>
      </Reanimated.View>

      {/* Search Bar */}
      <View style={[styles.searchWrapper, { paddingTop: insets.top + 60 }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={THEME.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search generic foods (e.g., 'Apple', 'Rice')"
            placeholderTextColor={THEME.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
               <Ionicons name="close-circle-sharp" size={18} color={THEME.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results Overlay */}
      {searchResults.length > 0 && (
        <View style={[styles.searchResultsContainer, { top: insets.top + 110 }]}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.foodId}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.searchResultItem}
                onPress={() => addFoodToMeal(item)}
              >
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultLabel}>{item.label}</Text>
                  <Text style={styles.searchResultNutrients}>
                    {Math.round(item.nutrients.calories)} cal • {Math.round(item.nutrients.protein)}g P •{' '}
                    {Math.round(item.nutrients.carbs)}g C • {Math.round(item.nutrients.fat)}g F
                  </Text>
                </View>
                <View style={styles.addButton}>
                   <Ionicons name="add" size={20} color={THEME.primary} />
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
            style={styles.searchResultsList}
          />
        </View>
      )}

      <AnimatedFlatList
        data={nutritionLog?.meals || []}
        keyExtractor={(item: unknown, index) => (item as Meal)._id || `meal-${index}`}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Large Title */}
            <Reanimated.View style={[styles.largeTitleContainer, headerAnimatedStyle]}>
              <Text style={styles.largeTitle}>Nutrition</Text>
              <Text style={styles.dateSubtitle}>Today</Text>
            </Reanimated.View>

            {/* Summary Dashboard */}
            <View style={styles.dashboardContainer}>
              <View style={styles.mainStatsRow}>
                <View style={styles.caloriesContainer}>
                   <Text style={styles.caloriesValue}>{Math.round(caloriesConsumed)}</Text>
                   <Text style={styles.caloriesLabel}>Calories Eaten</Text>
                   
                   <View style={styles.progressBarBg}>
                     <View style={[styles.progressBarFill, { width: `${caloriesPercentage}%`, backgroundColor: caloriesColor }]} />
                   </View>
                   
                   <View style={styles.calorieDetailsRow}>
                     <Text style={styles.calorieDetailText}>{Math.round(caloriesRemaining)} remaining</Text>
                     <Text style={styles.calorieDetailText}>Goal: {Math.round(caloriesTarget)}</Text>
                   </View>
                </View>
              </View>

              {/* Macros Grid */}
              {goal && (
                <View style={styles.macrosGrid}>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: THEME.success }]}>{Math.round(nutritionLog?.totalProtein || 0)}g</Text>
                    <Text style={styles.macroName}>Protein</Text>
                    <View style={[styles.miniProgress, { backgroundColor: THEME.success + '30' }]}>
                       <View style={[styles.miniProgressFill, { backgroundColor: THEME.success, width: `${Math.min(((nutritionLog?.totalProtein || 0) / goal.targetProtein) * 100, 100)}%` }]} />
                    </View>
                  </View>
                  
                  <View style={styles.divider} />

                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: THEME.warning }]}>{Math.round(nutritionLog?.totalCarbs || 0)}g</Text>
                    <Text style={styles.macroName}>Carbs</Text>
                    <View style={[styles.miniProgress, { backgroundColor: THEME.warning + '30' }]}>
                       <View style={[styles.miniProgressFill, { backgroundColor: THEME.warning, width: `${Math.min(((nutritionLog?.totalCarbs || 0) / goal.targetCarbs) * 100, 100)}%` }]} />
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: THEME.pink }]}>{Math.round(nutritionLog?.totalFats || 0)}g</Text>
                    <Text style={styles.macroName}>Fats</Text>
                    <View style={[styles.miniProgress, { backgroundColor: THEME.pink + '30' }]}>
                       <View style={[styles.miniProgressFill, { backgroundColor: THEME.pink, width: `${Math.min(((nutritionLog?.totalFats || 0) / goal.targetFats) * 100, 100)}%` }]} />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Meal Type Selector */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Add to Meal</Text>
            </View>
            
            <View style={styles.mealTypeSelector}>
               {mealTypes.map((type) => (
                 <TouchableOpacity
                   key={type.key}
                   style={[
                     styles.mealTypeChip,
                     selectedMealType === type.key && { backgroundColor: type.color, borderColor: type.color }
                   ]}
                   onPress={() => setSelectedMealType(type.key)}
                 >
                   <Ionicons 
                     name={selectedMealType === type.key ? type.icon as any : `${type.icon}-outline` as any} 
                     size={16} 
                     color={selectedMealType === type.key ? '#FFF' : type.color} 
                   />
                   <Text style={[
                     styles.mealTypeChipText,
                     selectedMealType === type.key && { color: '#FFF' }
                   ]}>{type.label}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Logged Meals</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }: { item: unknown, index: number }) => {
          const meal = item as Meal;
          const mealType = mealTypes.find(t => t.key === meal.mealType);
          return (
            <Reanimated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.mealCard}>
              <View style={styles.mealCardHeader}>
                <View style={styles.mealIconContainer}>
                   <View style={[styles.iconBg, { backgroundColor: (mealType?.color || THEME.primary) + '20' }]}>
                     <Ionicons name={mealType?.icon as any || 'restaurant'} size={18} color={mealType?.color || THEME.primary} />
                   </View>
                   <Text style={styles.mealCardTitle}>{mealType?.label || meal.mealType}</Text>
                </View>
                <Text style={styles.mealCardCalories}>{Math.round(meal.totalCalories)} kcal</Text>
              </View>
              
              <View style={styles.foodList}>
                {meal.foodItems.map((food, i) => (
                  <View key={i} style={styles.foodRow}>
                    <Text style={styles.foodName}>{food.label}</Text>
                    <Text style={styles.foodPortion}>{Math.round(food.nutrients.calories)} kcal</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.mealMacrosFooter}>
                <Text style={styles.miniMacro}>P: {Math.round(meal.totalProtein)}g</Text>
                <Text style={styles.miniMacro}>C: {Math.round(meal.totalCarbs)}g</Text>
                <Text style={styles.miniMacro}>F: {Math.round(meal.totalFats)}g</Text>
              </View>
            </Reanimated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="nutrition-outline" size={32} color={THEME.textTertiary} />
            </View>
            <Text style={styles.emptyStateText}>No meals tracked today</Text>
            <Text style={styles.emptyStateSubtext}>Search for food above to start tracking</Text>
          </View>
        }
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  
  // Header
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(242, 242, 247, 0.95)',
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
  
  // Search
  searchWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 90,
    paddingHorizontal: 16,
    backgroundColor: THEME.background,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E3E8',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
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
  
  // Search Results
  searchResultsContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: THEME.card,
    borderRadius: 14,
    maxHeight: 300,
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  searchResultsList: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
    marginBottom: 2,
  },
  searchResultNutrients: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  addButton: {
    padding: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
  },
  
  // Main Scroll
  scrollContent: {
    paddingTop: 120, // Space for header + search
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  largeTitleContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  dateSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginTop: 4,
  },
  
  // Dashboard
  dashboardContainer: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  mainStatsRow: {
    marginBottom: 20,
  },
  caloriesContainer: {
    width: '100%',
  },
  caloriesLabel: {
    fontSize: 15,
    color: THEME.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -1,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  calorieDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calorieDetailText: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  
  // Macros
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.divider,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: THEME.divider,
    height: '80%',
    alignSelf: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  macroName: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  miniProgress: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Meal Selectors
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  mealTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  mealTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.divider,
    gap: 6,
  },
  mealTypeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },
  
  // Meal Card
  mealCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
    textTransform: 'capitalize',
  },
  mealCardCalories: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  foodList: {
    paddingLeft: 42,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  foodName: {
    fontSize: 14,
    color: THEME.text,
    flex: 1,
  },
  foodPortion: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginLeft: 12,
  },
  mealMacrosFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F2F2F7',
  },
  miniMacro: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  
  // States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    opacity: 0.6,
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 6,
    opacity: 0.2,
  },
  ringInner: {
    width: '80%',
    height: '80%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringText: {
    fontSize: 12,
    fontWeight: '700',
  }
});
