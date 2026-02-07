import * as Linking from 'expo-linking';
import { getPathFromState, getStateFromPath } from '@react-navigation/native';

/**
 * Deep linking configuration for ChurchThrive mobile app
 *
 * Supports:
 * - churchthrive:// custom scheme
 * - https://churchthrive.kr/ universal links (iOS)
 * - https://churchthrive.kr/ app links (Android)
 */

export const linkingConfig = {
  prefixes: [
    'churchthrive://',
    'https://churchthrive.kr',
    'https://www.churchthrive.kr',
  ],
  config: {
    screens: {
      // Auth screens
      '(auth)': {
        screens: {
          login: 'auth/login',
          register: 'auth/register',
          'forgot-password': 'auth/forgot-password',
          'reset-password': 'auth/reset-password',
          onboarding: 'auth/onboarding',
        },
      },

      // Main tabs
      '(tabs)': {
        screens: {
          // Dashboard
          index: '',

          // Members
          members: {
            path: 'members',
            screens: {
              index: '',
              '[id]': ':id',
              new: 'new',
            },
          },

          // Notes
          notes: {
            path: 'notes',
            screens: {
              index: '',
              '[id]': ':id',
              new: 'new',
            },
          },

          // Admin section
          admin: {
            path: 'admin',
            screens: {
              // Sermons
              sermons: {
                path: 'sermons',
                screens: {
                  index: '',
                  '[id]': ':id',
                  new: 'new',
                },
              },

              // Announcements
              announcements: {
                path: 'announcements',
                screens: {
                  index: '',
                  '[id]': ':id',
                  new: 'new',
                },
              },

              // Attendance
              attendance: {
                path: 'attendance',
                screens: {
                  index: '',
                  '[id]': ':id',
                  take: 'take',
                  'qr-scan': 'qr-scan',
                },
              },

              // Groups
              groups: {
                path: 'groups',
                screens: {
                  index: '',
                  '[id]': ':id',
                  new: 'new',
                },
              },

              // Reports
              reports: {
                path: 'reports',
                screens: {
                  index: '',
                  attendance: 'attendance',
                  growth: 'growth',
                  engagement: 'engagement',
                },
              },
            },
          },

          // Settings
          settings: {
            path: 'settings',
            screens: {
              index: '',
              profile: 'profile',
              'edit-profile': 'edit-profile',
              church: 'church',
              notifications: 'notifications',
              privacy: 'privacy',
              about: 'about',
            },
          },
        },
      },

      // Modal screens (outside tabs)
      'qr-display': 'qr/:memberId',
      'sermon-player': 'sermon/:sermonId/player',
      'note-share': 'notes/:noteId/share',

      // Fallback
      '+not-found': '*',
    },
  },
};

/**
 * Parse a deep link URL
 */
export function parseDeepLink(url: string): { screen?: string; params?: Record<string, any> } | null {
  try {
    const { hostname, path, queryParams } = Linking.parse(url);

    // Handle custom scheme (churchthrive://)
    if (!hostname && path) {
      return parseCustomScheme(path, queryParams);
    }

    // Handle universal links (https://churchthrive.kr/...)
    if (hostname === 'churchthrive.kr' || hostname === 'www.churchthrive.kr') {
      return parseUniversalLink(path || '', queryParams);
    }

    return null;
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
}

/**
 * Parse custom scheme URLs (churchthrive://...)
 */
function parseCustomScheme(
  path: string,
  queryParams: Record<string, string> | undefined
): { screen: string; params?: Record<string, any> } | null {
  // Remove leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Examples:
  // churchthrive://members/123
  // churchthrive://notes/new
  // churchthrive://admin/sermons/456

  return {
    screen: cleanPath,
    params: queryParams,
  };
}

/**
 * Parse universal links (https://churchthrive.kr/...)
 */
function parseUniversalLink(
  path: string,
  queryParams: Record<string, string> | undefined
): { screen: string; params?: Record<string, any> } | null {
  // Remove leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Handle special routes
  if (cleanPath.startsWith('qr/')) {
    const memberId = cleanPath.split('/')[1];
    return {
      screen: 'qr-display',
      params: { memberId, ...queryParams },
    };
  }

  if (cleanPath.startsWith('notes/') && cleanPath.endsWith('/share')) {
    const noteId = cleanPath.split('/')[1];
    return {
      screen: 'note-share',
      params: { noteId, ...queryParams },
    };
  }

  return {
    screen: cleanPath || '',
    params: queryParams,
  };
}

/**
 * Create a deep link URL for sharing
 */
export function createDeepLink(screen: string, params?: Record<string, any>): string {
  // Build path from screen name
  let path = screen;

  if (params) {
    // Replace route params (e.g., [id] -> 123)
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`[${key}]`, String(value));
      path = path.replace(`:${key}`, String(value));
    });

    // Add query params
    const queryString = Object.entries(params)
      .filter(([key]) => !path.includes(key))
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    if (queryString) {
      path = `${path}?${queryString}`;
    }
  }

  // Use universal link for sharing
  return `https://churchthrive.kr/${path}`;
}

/**
 * Create a QR code deep link for member check-in
 */
export function createQRLink(memberId: string): string {
  return `https://churchthrive.kr/qr/${memberId}`;
}

/**
 * Create a note sharing link
 */
export function createNoteShareLink(noteId: string): string {
  return `https://churchthrive.kr/notes/${noteId}/share`;
}

/**
 * Create a sermon link
 */
export function createSermonLink(sermonId: string): string {
  return `https://churchthrive.kr/admin/sermons/${sermonId}`;
}

/**
 * Create an announcement link
 */
export function createAnnouncementLink(announcementId: string): string {
  return `https://churchthrive.kr/admin/announcements/${announcementId}`;
}

/**
 * Open a deep link in the app
 */
export async function openDeepLink(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      console.warn('Cannot open URL:', url);
      return false;
    }
  } catch (error) {
    console.error('Failed to open deep link:', error);
    return false;
  }
}

/**
 * Get the initial URL when app is opened from a link
 */
export async function getInitialURL(): Promise<string | null> {
  try {
    return await Linking.getInitialURL();
  } catch (error) {
    console.error('Failed to get initial URL:', error);
    return null;
  }
}

/**
 * Listen for deep link events
 */
export function addLinkingListener(
  callback: (event: { url: string }) => void
): { remove: () => void } {
  return Linking.addEventListener('url', callback);
}
