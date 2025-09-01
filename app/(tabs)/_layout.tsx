import { Tabs, router } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
        headerRight: () => (
          <TouchableOpacity onPress={handleSignOut} style={{ marginRight: 15 }}>
            <IconSymbol size={24} name="rectangle.portrait.and.arrow.right" color={Colors[colorScheme ?? 'light'].tint} />
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'New Chat',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.badge.plus" color={color} />,
        }}
      />
    </Tabs>
  );
}