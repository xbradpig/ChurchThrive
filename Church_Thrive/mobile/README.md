# ChurchThrive Mobile App

React Native mobile application for ChurchThrive, built with Expo 52 and Expo Router 4.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## 📱 Features

- **Offline-First**: Full offline support with WatermelonDB local database
- **Bidirectional Sync**: Automatic sync when online with conflict resolution
- **Audio Recording**: High-quality sermon note audio recording with cloud storage
- **Push Notifications**: Real-time notifications with deep link navigation
- **Deep Linking**: Universal links and custom URL scheme support
- **QR Code Support**: Member check-in via QR codes
- **Theme Support**: Light/dark/auto theme modes
- **Atomic Design**: Reusable component library (atoms, molecules, organisms)

## 🏗️ Architecture

### Tech Stack
- **Framework**: Expo 52 (React Native 0.76)
- **Navigation**: Expo Router 4 (file-based routing)
- **Styling**: NativeWind 4 (Tailwind CSS for React Native)
- **State**: Zustand (lightweight state management)
- **Database**: WatermelonDB (reactive local-first database)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Forms**: React Hook Form + Zod validation
- **Types**: TypeScript strict mode

### Directory Structure

```
mobile/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (auth)/            # Auth flow (login, register, onboarding)
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx     # Dashboard
│   │   ├── members/      # Member management
│   │   ├── notes/        # Sermon notes
│   │   ├── admin/        # Admin features
│   │   └── settings/     # Settings
│   └── _layout.tsx       # Root layout with providers
├── src/
│   ├── components/        # UI components (Atomic Design)
│   │   ├── atoms/        # Basic building blocks
│   │   ├── molecules/    # Simple component combinations
│   │   └── organisms/    # Complex UI sections
│   ├── stores/           # Zustand stores
│   │   ├── authStore.ts  # Authentication state
│   │   ├── uiStore.ts    # UI state (theme, loading, toasts)
│   │   └── offlineStore.ts # Sync state
│   ├── lib/              # Core functionality
│   │   ├── supabase/     # Supabase client
│   │   ├── offline/      # WatermelonDB & sync
│   │   ├── audio/        # Audio recording
│   │   ├── notifications/ # Push notifications
│   │   └── linking/      # Deep linking
│   └── hooks/            # Custom React hooks
├── assets/               # Images, fonts, etc.
├── app.config.ts         # Expo configuration
├── eas.json             # EAS Build configuration
├── package.json         # Dependencies
└── tailwind.config.js   # NativeWind configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the mobile directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### EAS Project Setup

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to EAS:
   ```bash
   eas login
   ```

3. Configure project:
   ```bash
   eas init
   ```

4. Update `app.config.ts` with your EAS project ID

5. Update `src/lib/notifications/setup.ts` with your EAS project ID

## 📦 Building

### Development Build

```bash
# iOS
npm run build:dev -- --platform ios

# Android
npm run build:dev -- --platform android

# Both
npm run build:dev -- --platform all
```

### Preview Build (for testing)

```bash
npm run build:preview -- --platform all
```

### Production Build (for stores)

```bash
npm run build:prod -- --platform all
```

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] Email/password login
- [ ] Phone OTP login
- [ ] Kakao OAuth login
- [ ] Registration flow
- [ ] Password reset
- [ ] Logout

#### Offline Mode
- [ ] Enable airplane mode
- [ ] Create sermon note offline
- [ ] Mark attendance offline
- [ ] Browse cached data
- [ ] Re-enable network
- [ ] Verify auto-sync

#### Audio Recording
- [ ] Start recording
- [ ] Pause/resume recording
- [ ] Stop and save
- [ ] Upload to cloud
- [ ] Playback recording

#### Push Notifications
- [ ] Receive notification (foreground)
- [ ] Receive notification (background)
- [ ] Tap notification
- [ ] Deep link navigation
- [ ] Badge count updates

#### Deep Linking
- [ ] Open churchthrive:// URL
- [ ] Open https://churchthrive.kr/ URL
- [ ] QR code scanning
- [ ] Share links work
- [ ] Cold start from link
- [ ] Warm start from link

#### Sync
- [ ] Manual sync trigger
- [ ] Background sync
- [ ] Conflict resolution
- [ ] Error handling
- [ ] Sync status display

#### UI/UX
- [ ] Light/dark theme
- [ ] Toast notifications
- [ ] Loading states
- [ ] Pull to refresh
- [ ] Tab bar navigation
- [ ] Modal dialogs

## 📚 Documentation

- [Mobile Features Guide](./MOBILE_FEATURES_GUIDE.md) - Developer usage guide
- [Stage 10 Summary](../../../dev-agent/10_mobile.md) - Implementation details

## 🔐 Security

- **Auth Tokens**: Stored in Expo SecureStore (iOS Keychain / Android Keystore)
- **Local Database**: Encrypted by OS
- **Push Tokens**: Deactivated on logout
- **Deep Links**: Validated and sanitized
- **API Keys**: Never hardcoded, only in environment variables

## 🚨 Troubleshooting

### Build Errors

**Issue**: "Metro bundler can't resolve module"
```bash
# Clear cache
npx expo start -c
```

**Issue**: "Native module not found"
```bash
# Rebuild native modules
npm run android/ios
```

### Runtime Errors

**Issue**: "WatermelonDB database not found"
```bash
# Clear app data and reinstall
```

**Issue**: "Push notifications not working"
- Verify running on physical device (not simulator)
- Check permissions granted
- Verify EAS project ID configured
- Test with Expo push notification tool

**Issue**: "Deep links not opening"
- Verify URL scheme in app.config.ts
- Check iOS Associated Domains entitlement
- Verify Android intent filters
- Test with `npx uri-scheme open churchthrive://members`

## 📊 Performance

### Optimization Tips

1. **Images**: Use Expo Image component for auto-optimization
2. **Lists**: Use FlashList instead of FlatList for large lists
3. **Database**: Index frequently queried columns
4. **Sync**: Batch operations in single write transaction
5. **Network**: Cache responses with React Query or SWR
6. **Navigation**: Use `React.lazy()` for heavy screens
7. **Animations**: Use react-native-reanimated for 60fps

### Bundle Size

Current bundle sizes (estimated):
- iOS: ~45 MB (universal binary)
- Android: ~35 MB (arm64-v8a)

Ways to reduce:
- Remove unused dependencies
- Use Hermes engine (already enabled)
- Enable ProGuard (Android)
- Split APKs by architecture

## 🔄 Update Workflow

### OTA Updates (Expo Updates)

```bash
# Publish update
eas update --branch production --message "Bug fixes"

# Users receive update on next app launch
```

### App Store Updates

Required for:
- Native module changes
- Permission changes
- Binary changes
- Major version updates

## 🛠️ Development Tips

### Recommended VS Code Extensions

- React Native Tools
- Expo Tools
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### Useful Commands

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Clear all caches
npx expo start -c
rm -rf node_modules
npm install

# Reset Metro bundler
npx expo start --clear

# View logs
npx react-native log-ios
npx react-native log-android
```

### Debugging

1. **React DevTools**: Press `Shift + M` in terminal
2. **Network Inspector**: Use Reactotron or Flipper
3. **Database Inspector**: Use WatermelonDB browser tool
4. **Supabase Logs**: Check Supabase dashboard

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Update documentation if needed
4. Submit pull request

### Code Style

- Use TypeScript strict mode
- Follow React hooks best practices
- Use functional components only
- Write self-documenting code
- Add comments for complex logic
- Keep components small and focused

## 📞 Support

- **Issues**: Create issue on GitHub
- **Questions**: Check existing documentation first
- **Slack**: #churchthrive-mobile channel

## 📄 License

Copyright (c) 2024 ChurchThrive. All rights reserved.

---

**Version**: 0.1.0
**Last Updated**: 2026-02-05
**Expo SDK**: 52.0.0
**React Native**: 0.76.0
