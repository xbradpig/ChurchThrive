import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import '../global.css';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, member } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (member?.status === 'pending') {
        router.replace('/(auth)/pending');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isLoading, isAuthenticated, member, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#228B22" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthGuard>
        <Slot />
      </AuthGuard>
    </SafeAreaProvider>
  );
}
