/**
 * NutritionCard Component
 * Production-ready card with expandable nutrition text
 * 
 * Features:
 * - 2-line truncation with ellipsis
 * - Smooth expand/collapse animation
 * - Full accessibility support
 * - Apple-inspired design
 * - Performance optimized with memoization
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Types
export interface NutritionCardProps {
  title: string;
  servingSize?: string;
  calories: number;
  time?: string; // e.g., "2 hours ago"
  nutritionText: string; // e.g., "Protein 25g · Carbs 10g · Fat 8g · Fiber 3g"
  onPress?: () => void;
  style?: object;
  testID?: string;
}

// Animation configuration
const layoutAnimationConfig = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
    springDamping: 0.7,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

/**
 * NutritionCard Component
 */
export const NutritionCard: React.FC<NutritionCardProps> = React.memo(({
  title,
  servingSize,
  calories,
  time,
  nutritionText,
  onPress,
  style,
  testID = 'nutrition-card',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);

  // Check if text needs expansion (more than 2 lines)
  const onTextLayout = useCallback((event: any) => {
    const { height, width } = event.nativeEvent.layout;
    const lineHeight = 20; // Approximate line height for fontSize 15
    const maxHeight = lineHeight * 2; // 2 lines
    
    if (height > maxHeight && !needsExpansion) {
      setNeedsExpansion(true);
    }
  }, [needsExpansion]);

  // Toggle expansion with animation
  const toggleExpansion = useCallback(() => {
    LayoutAnimation.configureNext(layoutAnimationConfig);
    setIsExpanded(prev => !prev);
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(
      isExpanded ? 'Nutrition details collapsed' : 'Nutrition details expanded'
    );
  }, [isExpanded]);

  // Format nutrition text with proper spacing
  const formattedNutritionText = useMemo(() => {
    return nutritionText.trim();
  }, [nutritionText]);

  // Format calories with proper spacing
  const formattedCalories = useMemo(() => {
    return `${Math.round(calories)} kcal`;
  }, [calories]);

  // Format metadata row
  const metadataRow = useMemo(() => {
    const parts: string[] = [];
    if (servingSize) parts.push(servingSize);
    parts.push(formattedCalories);
    if (time) parts.push(time);
    return parts.join(' · ');
  }, [servingSize, formattedCalories, time]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, style]}
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${metadataRow}, ${formattedNutritionText}`}
    >
      {/* Title */}
      <Text
        style={styles.title}
        numberOfLines={2}
        testID={`${testID}-title`}
        accessible={true}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Metadata Row */}
      <Text
        style={styles.metadata}
        numberOfLines={1}
        testID={`${testID}-metadata`}
        accessible={true}
      >
        {metadataRow}
      </Text>

      {/* Nutrition Text Block */}
      <View style={styles.nutritionContainer}>
        <Text
          style={styles.nutritionText}
          numberOfLines={isExpanded ? undefined : 2}
          onLayout={onTextLayout}
          testID={`${testID}-nutrition`}
          accessible={true}
          accessibilityLiveRegion="polite"
        >
          {formattedNutritionText}
        </Text>

        {/* Show More/Less Button */}
        {needsExpansion && (
          <TouchableOpacity
            onPress={toggleExpansion}
            style={styles.expandButton}
            testID={`${testID}-expand-button`}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Show less nutrition details' : 'Show more nutrition details'}
            accessibilityHint={isExpanded ? 'Collapses the nutrition information' : 'Expands to show full nutrition information'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Show less' : 'Show more'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={styles.expandButtonText.color}
              style={styles.expandIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.title === nextProps.title &&
    prevProps.servingSize === nextProps.servingSize &&
    prevProps.calories === nextProps.calories &&
    prevProps.time === nextProps.time &&
    prevProps.nutritionText === nextProps.nutritionText
  );
});

NutritionCard.displayName = 'NutritionCard';

// Styles - Apple-inspired minimal design
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2, // Android shadow
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  metadata: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  nutritionContainer: {
    marginTop: 4,
  },
  nutritionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
    letterSpacing: -0.1,
    marginRight: 4,
  },
  expandIcon: {
    marginLeft: 2,
  },
});

// Export default
export default NutritionCard;

