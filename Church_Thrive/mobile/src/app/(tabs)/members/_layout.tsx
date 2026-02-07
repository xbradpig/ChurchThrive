import { Stack } from 'expo-router';

export default function MembersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        headerShadowVisible: false,
        headerBackTitle: '뒤로',
      }}
    />
  );
}
