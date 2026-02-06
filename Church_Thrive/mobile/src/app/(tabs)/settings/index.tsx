import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { CTAvatar } from '../../../components/atoms/CTAvatar';
import { CTBadge } from '../../../components/atoms/CTBadge';
import { CTToggle } from '../../../components/atoms/CTToggle';
import { POSITION_LABELS } from '@churchthrive/shared';

const ROLE_LABELS: Record<string, string> = {
  admin: '관리자',
  staff: '스태프',
  leader: '리더',
  member: '교인',
};

const ROLE_COLORS: Record<string, 'green' | 'blue' | 'yellow' | 'gray'> = {
  admin: 'blue',
  staff: 'green',
  leader: 'yellow',
  member: 'gray',
};

interface SettingsMenuItem {
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

interface SettingsSection {
  title: string;
  items: SettingsMenuItem[];
}

export default function SettingsScreen() {
  const router = useRouter();
  const { member, church, signOut } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [announcementPush, setAnnouncementPush] = useState(true);
  const [notePush, setNotePush] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  function handleSignOut() {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);
  }

  function handleClearCache() {
    Alert.alert(
      '캐시 삭제',
      '로컬에 저장된 캐시 데이터를 삭제합니다.\n앱이 다시 데이터를 다운로드합니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            // In production: clear async storage / cache
            Alert.alert('완료', '캐시가 삭제되었습니다.');
          },
        },
      ]
    );
  }

  function handleAppInfo() {
    Alert.alert(
      'ChurchThrive',
      '버전: 1.0.0\n빌드: 1\n\nMade with love for churches.',
      [{ text: '확인' }]
    );
  }

  const memberRole = (member as any)?.role ?? 'member';
  const memberPosition = member?.position as string | undefined;

  const sections: SettingsSection[] = [
    {
      title: '계정',
      items: [
        {
          label: '내 정보 수정',
          onPress: () => {
            // Navigate to profile edit
          },
          showChevron: true,
        },
        {
          label: '비밀번호 변경',
          onPress: () => {
            // Navigate to password change
          },
          showChevron: true,
        },
      ],
    },
    {
      title: '알림',
      items: [
        {
          label: '푸시 알림',
          onPress: () => setPushEnabled(!pushEnabled),
          rightElement: (
            <CTToggle isOn={pushEnabled} onChange={setPushEnabled} />
          ),
        },
        {
          label: '공지사항 알림',
          onPress: () => setAnnouncementPush(!announcementPush),
          rightElement: (
            <CTToggle
              isOn={announcementPush}
              onChange={setAnnouncementPush}
              disabled={!pushEnabled}
            />
          ),
        },
        {
          label: '노트 리마인더',
          onPress: () => setNotePush(!notePush),
          rightElement: (
            <CTToggle
              isOn={notePush}
              onChange={setNotePush}
              disabled={!pushEnabled}
            />
          ),
        },
      ],
    },
    {
      title: '앱',
      items: [
        {
          label: '오프라인 모드',
          onPress: () => setOfflineMode(!offlineMode),
          rightElement: (
            <CTToggle isOn={offlineMode} onChange={setOfflineMode} />
          ),
        },
        {
          label: '캐시 삭제',
          onPress: handleClearCache,
          showChevron: true,
        },
        {
          label: '앱 정보',
          onPress: handleAppInfo,
          showChevron: true,
        },
      ],
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: '더보기' }} />
      <ScrollView className="flex-1 bg-gray-50">
        {/* Profile Card */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <CTAvatar
              src={member?.photo_url}
              name={member?.name ?? ''}
              size="xl"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-gray-900">
                  {member?.name ?? '사용자'}
                </Text>
                <CTBadge
                  label={ROLE_LABELS[memberRole] ?? memberRole}
                  color={ROLE_COLORS[memberRole] ?? 'gray'}
                  size="sm"
                />
              </View>
              {memberPosition && (
                <Text className="text-sm text-gray-500 mt-0.5">
                  {POSITION_LABELS[
                    memberPosition as keyof typeof POSITION_LABELS
                  ] ?? memberPosition}
                </Text>
              )}
              <Text className="text-sm text-gray-400 mt-0.5">
                {church?.name ?? '교회'}
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                {member?.email || member?.phone}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {sections.map((section) => (
          <View key={section.title} className="mt-4">
            <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 mb-2">
              {section.title}
            </Text>
            <View className="bg-white mx-4 rounded-xl shadow-sm overflow-hidden">
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  className={`flex-row items-center justify-between px-4 ${
                    idx > 0 ? 'border-t border-gray-100' : ''
                  }`}
                  style={{ minHeight: 52 }}
                  activeOpacity={0.6}
                >
                  <Text className="text-base text-gray-700 flex-1">
                    {item.label}
                  </Text>
                  {item.rightElement
                    ? item.rightElement
                    : item.showChevron && (
                        <Text className="text-gray-400">{'>'}</Text>
                      )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <View className="mx-4 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-white rounded-xl py-4 shadow-sm items-center"
            activeOpacity={0.7}
            style={{ minHeight: 52 }}
          >
            <Text className="text-ct-error font-semibold text-base">
              로그아웃
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View className="items-center pb-8">
          <Text className="text-xs text-gray-300">ChurchThrive v1.0.0</Text>
        </View>
      </ScrollView>
    </>
  );
}
