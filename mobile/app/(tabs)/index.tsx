import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Image, Modal, Pressable } from 'react-native';
import { useAuthStore } from '../../lib/auth-store';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useState } from 'react';

// Theme Constants
const THEME = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  primary: '#007AFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  danger: '#FF3B30',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
};

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const router = useRouter();
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  // Animation values
  const menuScale = useSharedValue(0.9);
  const menuOpacity = useSharedValue(0);

  const openProfileMenu = () => {
    setProfileMenuVisible(true);
    menuScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    menuOpacity.value = withTiming(1, { duration: 200 });
  };

  const closeProfileMenu = () => {
    menuScale.value = withTiming(0.9, { duration: 150 });
    menuOpacity.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(setProfileMenuVisible)(false);
      }
    });
  };

  const handleSignOut = async () => {
    closeProfileMenu();
    // Small delay to allow menu to close
    setTimeout(async () => {
        await signOut();
        router.replace('/login');
    }, 200);
  };

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [{ scale: menuScale.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
  }));

  const quickActions = [
    { icon: 'barbell', label: 'Start Workout', color: '#007AFF', route: '/workouts' },
    { icon: 'calendar', label: 'Calendar', color: '#FF3B30', route: '/calendar' },
    { icon: 'stats-chart', label: 'Progress', color: '#34C759', route: '/progress' },
    { icon: 'nutrition', label: 'Nutrition', color: '#FF9500', route: '/nutrition' },
  ];

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
            <Text style={styles.greeting}>Summary</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={openProfileMenu}
            activeOpacity={0.8}
          >
            {user?.image ? (
                <Image source={{ uri: user.image }} style={styles.profileImage} />
            ) : (
                <View style={styles.profilePlaceholder}>
                    <Text style={styles.profileInitials}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Weekly Summary Card */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Weekly Activity</Text>
            <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.5h</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Records</Text>
            </View>
          </View>
        </Animated.View>


        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.gridContainer}>
          {quickActions.map((action, index) => (
            <Animated.View 
              key={action.label}
              entering={FadeInDown.delay(200 + (index * 50)).duration(600)}
              style={styles.gridItemContainer}
            >
              <TouchableOpacity 
                style={styles.gridItem}
                activeOpacity={0.7}
                onPress={() => {
                    // Navigate to appropriate screens
                    if (action.route === '/workouts') {
                        router.push('/(tabs)/exercises');
                    } else if (action.route === '/calendar') {
                        router.push('/(tabs)/calendar');
                    } else if (action.route === '/progress') {
                        router.push('/(tabs)/progress');
                    } else if (action.route === '/nutrition') {
                        router.push('/(tabs)/nutrition');
                    }
                }}
              >
                <View style={[styles.iconContainer, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={28} color={action.color} />
                </View>
                <Text style={styles.gridLabel}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Recent Activity / Suggestions */}
        <Text style={styles.sectionTitle}>Suggested for You</Text>
        <Animated.View 
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.card}
        >
             <View style={styles.suggestionContent}>
                <View style={styles.suggestionIcon}>
                    <Ionicons name="flame" size={24} color="#FF2D55" />
                </View>
                <View style={styles.suggestionText}>
                    <Text style={styles.suggestionTitle}>Full Body HIIT</Text>
                    <Text style={styles.suggestionSubtitle}>30 min • High Intensity</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
             </View>
        </Animated.View>
         <Animated.View 
            entering={FadeInDown.delay(500).duration(600)}
            style={[styles.card, { marginTop: 12 }]}
        >
             <View style={styles.suggestionContent}>
                <View style={[styles.suggestionIcon, { backgroundColor: '#5856D615' }]}>
                    <Ionicons name="body" size={24} color="#5856D6" />
                </View>
                <View style={styles.suggestionText}>
                    <Text style={styles.suggestionTitle}>Upper Body Power</Text>
                    <Text style={styles.suggestionSubtitle}>45 min • Strength</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
             </View>
        </Animated.View>

      </ScrollView>

      {/* Profile Menu Modal */}
      <Modal
        visible={profileMenuVisible}
        transparent
        animationType="none"
        onRequestClose={closeProfileMenu}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[styles.modalBackdrop, overlayAnimatedStyle]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeProfileMenu} />
          </Animated.View>
          
          <Animated.View style={[styles.menuContainer, menuAnimatedStyle]}>
            <View style={styles.menuHeader}>
                {user?.image ? (
                    <Image source={{ uri: user.image }} style={styles.menuProfileImage} />
                ) : (
                    <View style={styles.menuProfilePlaceholder}>
                        <Text style={styles.menuProfileInitials}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                )}
                <View style={styles.menuUserInfo}>
                    <Text style={styles.menuUserName} numberOfLines={1} ellipsizeMode="tail">
                        {user?.name || 'User'}
                    </Text>
                    <Text style={styles.menuUserEmail} numberOfLines={1} ellipsizeMode="tail">
                        {user?.email}
                    </Text>
                </View>
            </View>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={closeProfileMenu}>
                <Ionicons name="person-outline" size={22} color={THEME.text} />
                <Text style={styles.menuItemText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={closeProfileMenu}>
                <Ionicons name="settings-outline" size={22} color={THEME.text} />
                <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={closeProfileMenu}>
                <Ionicons name="notifications-outline" size={22} color={THEME.text} />
                <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={22} color={THEME.danger} />
                <Text style={[styles.menuItemText, { color: THEME.danger }]}>Sign Out</Text>
            </TouchableOpacity>
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
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...THEME.shadow,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1E1E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#636366',
  },
  summaryCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    ...THEME.shadow,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },
  seeAllText: {
    fontSize: 15,
    color: THEME.primary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 32,
  },
  gridItemContainer: {
    width: '50%',
    padding: 8,
  },
  gridItem: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    ...THEME.shadow,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    ...THEME.shadow,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF2D5515',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingRight: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  menuProfilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1E1E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuProfileInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636366',
  },
  menuUserInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  menuUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  menuUserEmail: {
    fontSize: 12,
    color: '#8E8E93',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
});
