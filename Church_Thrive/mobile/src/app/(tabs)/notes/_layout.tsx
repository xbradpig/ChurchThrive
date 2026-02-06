import { Stack } from 'expo-router';

export default function NotesLayout() {
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
      <Stack.Screen name="new" />
      <Stack.Screen name="[noteId]" />
      <Stack.Screen name="sermons" />
      <Stack.Screen name="sermon-detail/[sermonId]" />
    </Stack>
  );
}
