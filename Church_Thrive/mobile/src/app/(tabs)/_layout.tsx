import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#228B22',
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#1A202C',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarLabel: '홈',
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: '교인',
          tabBarLabel: '교인',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: '말씀노트',
          tabBarLabel: '말씀노트',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: '행정',
          tabBarLabel: '행정',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '더보기',
          tabBarLabel: '더보기',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
