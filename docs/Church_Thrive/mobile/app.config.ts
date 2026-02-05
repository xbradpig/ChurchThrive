import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ChurchThrive',
  slug: 'churchthrive',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#228B22',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'kr.churchthrive.app',
    infoPlist: {
      NSCameraUsageDescription: 'QR 코드 스캔을 위해 카메라 접근이 필요합니다.',
      NSMicrophoneUsageDescription: '설교 녹음을 위해 마이크 접근이 필요합니다.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#228B22',
    },
    package: 'kr.churchthrive.app',
    permissions: ['CAMERA', 'RECORD_AUDIO'],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  scheme: 'churchthrive',
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-camera',
      { cameraPermission: 'QR 코드 스캔을 위해 카메라 접근이 필요합니다.' },
    ],
    [
      'expo-av',
      { microphonePermission: '설교 녹음을 위해 마이크 접근이 필요합니다.' },
    ],
    'expo-notifications',
  ],
  extra: {
    eas: { projectId: 'your-eas-project-id' },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
