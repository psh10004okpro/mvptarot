import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { MainTabParamList } from '../types/navigation';
import HomeScreen from '../screens/Home/HomeScreen';
import TarotStack from './TarotStack';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#16213e',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#8b8b8b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
          tabBarLabel: '홈',
        }}
      />
      <Tab.Screen
        name="Tarot"
        component={TarotStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="moon" size={size} color={color} />
          ),
          tabBarLabel: '타로',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
          tabBarLabel: '프로필',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTab;
