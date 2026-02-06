import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        headerShadowVisible: false,
        headerBackTitle: '뒤로',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="announcements/index" />
      <Stack.Screen name="announcements/new" />
      <Stack.Screen name="announcements/[id]" />
      <Stack.Screen name="organizations" />
      <Stack.Screen name="cell-groups/index" />
      <Stack.Screen name="cell-groups/[groupId]" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="attendance-qr" />
    </Stack>
  );
}
