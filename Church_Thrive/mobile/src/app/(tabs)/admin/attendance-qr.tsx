import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Vibration,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../stores/authStore';
import { CTButton } from '../../../components/atoms/CTButton';
import { CTSearchBar } from '../../../components/molecules/CTSearchBar';
import { CTSpinner } from '../../../components/atoms/CTSpinner';
import { cn } from '../../../lib/cn';

// ─── Types ────────────────────────────────────────────────────────────
interface AttendedMember {
  id: string;
  name: string;
  position: string | null;
  checkedAt: string;
}

interface SearchResult {
  id: string;
  name: string;
  phone: string;
  position: string | null;
}

const POSITION_LABELS: Record<string, string> = {
  elder: '장로',
  ordained_deacon: '안수집사',
  deacon: '집사',
  saint: '성도',
};

// ─── Helpers ──────────────────────────────────────────────────────────
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Component ────────────────────────────────────────────────────────
export default function AttendanceQRScreen() {
  const { member } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [attendedMembers, setAttendedMembers] = useState<AttendedMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const today = toDateString(new Date());
  const churchId = member?.church_id;

  // ─── Load existing attendance ───────────────────────────────────────
  useEffect(() => {
    async function loadExisting() {
      if (!churchId) return;

      const { data: existing } = await supabase
        .from('attendances')
        .select('member_id, checked_in_at')
        .eq('church_id', churchId)
        .eq('event_date', today)
        .eq('event_type', 'worship');

      if (existing && existing.length > 0) {
        const memberIds = existing.map((e) => e.member_id);
        const { data: memberData } = await supabase
          .from('members')
          .select('id, name, position')
          .in('id', memberIds);

        const attended: AttendedMember[] = (existing || []).map((e) => {
          const m = (memberData || []).find((md) => md.id === e.member_id);
          return {
            id: e.member_id,
            name: m?.name || '알 수 없음',
            position: m?.position || null,
            checkedAt: e.checked_in_at,
          };
        });
        setAttendedMembers(attended);
      }
    }

    loadExisting();
  }, [churchId, today]);

  // ─── Handle QR Scan ─────────────────────────────────────────────────
  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || !churchId) return;
      setScanned(true);

      try {
        // Parse QR data
        let qrData: any;
        try {
          qrData = JSON.parse(data);
        } catch {
          Alert.alert('오류', '유효하지 않은 QR 코드입니다.');
          setTimeout(() => setScanned(false), 2000);
          return;
        }

        // Validate QR data
        if (!qrData.churchId || !qrData.eventType || !qrData.date) {
          Alert.alert('오류', '유효하지 않은 출석 QR 코드입니다.');
          setTimeout(() => setScanned(false), 2000);
          return;
        }

        if (qrData.churchId !== churchId) {
          Alert.alert('오류', '다른 교회의 QR 코드입니다.');
          setTimeout(() => setScanned(false), 2000);
          return;
        }

        // If the QR contains a member ID, mark that member's attendance
        if (qrData.memberId) {
          await markAttendanceById(qrData.memberId, qrData.eventType);
        } else {
          // This QR is a session QR - mark current user's attendance
          if (member?.id) {
            await markAttendanceById(member.id, qrData.eventType);
          }
        }
      } catch (error) {
        console.error('QR scan error:', error);
        Alert.alert('오류', '출석 처리 중 오류가 발생했습니다.');
      }

      setTimeout(() => setScanned(false), 3000);
    },
    [scanned, churchId, member?.id]
  );

  // ─── Mark attendance ────────────────────────────────────────────────
  async function markAttendanceById(memberId: string, eventType: string = 'worship') {
    if (!churchId) return;

    // Check if already attended
    const alreadyAttended = attendedMembers.some((m) => m.id === memberId);
    if (alreadyAttended) {
      const memberName = attendedMembers.find((m) => m.id === memberId)?.name;
      Alert.alert('알림', `${memberName}님은 이미 출석 처리되었습니다.`);
      return;
    }

    try {
      // Get member name
      const { data: memberData } = await supabase
        .from('members')
        .select('id, name, position')
        .eq('id', memberId)
        .single();

      if (!memberData) {
        Alert.alert('오류', '교인을 찾을 수 없습니다.');
        return;
      }

      // Insert attendance record
      const { error } = await supabase.from('attendances').insert({
        church_id: churchId,
        member_id: memberId,
        event_date: today,
        event_type: eventType,
        check_method: 'qr' as const,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('알림', `${memberData.name}님은 이미 출석 처리되었습니다.`);
          return;
        }
        throw error;
      }

      // Success feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate(200);
      }

      setLastScannedName(memberData.name);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);

      setAttendedMembers((prev) => [
        {
          id: memberId,
          name: memberData.name,
          position: memberData.position,
          checkedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      Alert.alert('오류', '출석 등록에 실패했습니다.');
    }
  }

  // ─── Manual Search ──────────────────────────────────────────────────
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim() || !churchId) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await supabase
          .from('members')
          .select('id, name, phone, position')
          .eq('church_id', churchId)
          .eq('status', 'active')
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(10);

        const attendedIds = new Set(attendedMembers.map((m) => m.id));
        setSearchResults(
          (data || []).filter((m) => !attendedIds.has(m.id))
        );
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [churchId, attendedMembers]
  );

  const addManualAttendance = useCallback(
    async (result: SearchResult) => {
      await markAttendanceById(result.id);
      setSearchQuery('');
      setSearchResults([]);
    },
    [churchId, today]
  );

  // ─── Permission Check ──────────────────────────────────────────────
  if (!permission) {
    return (
      <>
        <Stack.Screen options={{ title: 'QR 출석' }} />
        <View className="flex-1 items-center justify-center">
          <CTSpinner />
        </View>
      </>
    );
  }

  if (!permission.granted) {
    return (
      <>
        <Stack.Screen options={{ title: 'QR 출석' }} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl mb-4">{'\uD83D\uDCF7'}</Text>
          <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
            카메라 권한이 필요합니다
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            QR 코드를 스캔하려면 카메라 접근 권한을 허용해주세요.
          </Text>
          <CTButton onPress={requestPermission}>
            카메라 권한 허용
          </CTButton>
        </View>
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ title: 'QR 출석' }} />
      <View className="flex-1 bg-gray-50">
        {/* Scanner / Manual Toggle */}
        <View className="flex-row bg-white border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setShowScanner(true)}
            className={cn(
              'flex-1 py-3 items-center border-b-2',
              showScanner ? 'border-ct-primary' : 'border-transparent'
            )}
            style={{ minHeight: 48 }}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                showScanner ? 'text-ct-primary' : 'text-gray-500'
              )}
            >
              QR 스캔
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowScanner(false)}
            className={cn(
              'flex-1 py-3 items-center border-b-2',
              !showScanner ? 'border-ct-primary' : 'border-transparent'
            )}
            style={{ minHeight: 48 }}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                !showScanner ? 'text-ct-primary' : 'text-gray-500'
              )}
            >
              수동 검색
            </Text>
          </TouchableOpacity>
        </View>

        {/* Camera Scanner */}
        {showScanner && (
          <View className="items-center bg-black" style={{ height: 300 }}>
            <CameraView
              style={{ width: '100%', height: '100%' }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Scan Overlay */}
            <View
              className="absolute inset-0 items-center justify-center"
              pointerEvents="none"
            >
              <View
                className="border-2 border-white rounded-lg"
                style={{ width: 200, height: 200, opacity: 0.7 }}
              />
            </View>

            {/* Success Overlay */}
            {showSuccess && (
              <View className="absolute inset-0 bg-green-500/80 items-center justify-center">
                <Text className="text-white text-4xl mb-2">{'\u2713'}</Text>
                <Text className="text-white text-lg font-bold">
                  {lastScannedName}
                </Text>
                <Text className="text-white text-sm mt-1">출석 완료!</Text>
              </View>
            )}
          </View>
        )}

        {/* Manual Search */}
        {!showScanner && (
          <View className="px-4 pt-4">
            <CTSearchBar
              placeholder="이름 또는 전화번호 검색"
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              debounceMs={200}
            />

            {/* Search Results */}
            {isSearching && (
              <View className="items-center py-4">
                <CTSpinner />
              </View>
            )}

            {!isSearching && searchResults.length > 0 && (
              <View className="mt-3 bg-white rounded-lg overflow-hidden border border-gray-200">
                {searchResults.map((result, idx) => (
                  <TouchableOpacity
                    key={result.id}
                    onPress={() => addManualAttendance(result)}
                    className={cn(
                      'flex-row items-center justify-between px-4 py-3',
                      idx < searchResults.length - 1 && 'border-b border-gray-100'
                    )}
                    style={{ minHeight: 48 }}
                    activeOpacity={0.6}
                  >
                    <View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-medium text-gray-800">
                          {result.name}
                        </Text>
                        {result.position && (
                          <Text className="text-xs text-gray-400">
                            {POSITION_LABELS[result.position] || ''}
                          </Text>
                        )}
                      </View>
                      <Text className="text-xs text-gray-400 mt-0.5">
                        {result.phone}
                      </Text>
                    </View>
                    <View className="bg-ct-primary rounded-full px-3 py-1">
                      <Text className="text-white text-xs font-medium">출석</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <Text className="text-sm text-gray-400 text-center py-4">
                검색 결과가 없습니다
              </Text>
            )}
          </View>
        )}

        {/* Attendance Counter */}
        <View className="mx-4 mt-4 bg-white rounded-lg p-4 flex-row items-center justify-between border border-gray-100">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
              <Text className="text-lg">{'\u2705'}</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500">오늘 출석 인원</Text>
              <Text className="text-xl font-bold text-ct-primary">
                {attendedMembers.length}명
              </Text>
            </View>
          </View>
          <View className="bg-green-50 rounded-full px-3 py-1">
            <Text className="text-xs font-medium text-green-700">주일오전</Text>
          </View>
        </View>

        {/* Attended Members List */}
        <ScrollView className="flex-1 px-4 mt-4">
          <Text className="text-sm font-semibold text-gray-600 mb-2">
            출석 현황
          </Text>
          {attendedMembers.length === 0 ? (
            <View className="bg-white rounded-lg p-6 items-center">
              <Text className="text-sm text-gray-400">
                아직 출석한 교인이 없습니다
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-lg overflow-hidden border border-gray-100 mb-6">
              {attendedMembers.map((attended, idx) => (
                <View
                  key={attended.id}
                  className={cn(
                    'flex-row items-center px-4 py-3 gap-3',
                    idx < attendedMembers.length - 1 && 'border-b border-gray-100'
                  )}
                >
                  <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center">
                    <Text className="text-xs text-green-700">{'\u2713'}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-medium text-gray-800">
                        {attended.name}
                      </Text>
                      {attended.position && (
                        <Text className="text-xs text-gray-400">
                          {POSITION_LABELS[attended.position] || ''}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {new Date(attended.checkedAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
