import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';

export default function TabsLayout() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // We'll use custom headers in screens for the "Large Title" look
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.9)' : '#fff',
          borderTopWidth: 0,
          elevation: 0, // Android shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: '#007AFF', // Apple Blue
        tabBarInactiveTintColor: '#8E8E93', // Apple Gray
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "barbell" : "barbell-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "nutrition" : "nutrition-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "people" : "people-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

