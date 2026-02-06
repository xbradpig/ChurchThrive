import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../stores/authStore';
import { CTSpinner } from '../../../components/atoms/CTSpinner';
import { CTBadge } from '../../../components/atoms/CTBadge';
import { CTEmptyState } from '../../../components/molecules/CTEmptyState';
import { CTButton } from '../../../components/atoms/CTButton';
import { CTInput } from '../../../components/atoms/CTInput';
import { CTFormField } from '../../../components/molecules/CTFormField';
import { CTBottomSheet } from '../../../components/organisms/CTBottomSheet';

interface Organization {
  id: string;
  church_id: string;
  name: string;
  type: string;
  parent_id: string | null;
  member_count: number;
  depth: number;
  children?: Organization[];
}

const ORG_TYPE_COLORS: Record<string, 'blue' | 'green' | 'yellow' | 'gray'> = {
  department: 'blue',
  team: 'green',
  committee: 'yellow',
  ministry: 'blue',
  group: 'green',
};

const ORG_TYPE_LABELS: Record<string, string> = {
  department: '부서',
  team: '팀',
  committee: '위원회',
  ministry: '사역부',
  group: '그룹',
};

type ExpandedMap = Record<string, boolean>;

export default function OrganizationsScreen() {
  const { member } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedMap>({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Form state for new org
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('department');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!member?.church_id) return;
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('church_id', member.church_id)
        .order('name', { ascending: true });

      if (error) throw error;

      // Build tree structure
      const orgs = (data ?? []) as Organization[];
      const orgMap = new Map<string, Organization>();
      const roots: Organization[] = [];

      // First pass: index all
      orgs.forEach((org) => {
        orgMap.set(org.id, { ...org, depth: 0, children: [] });
      });

      // Second pass: build tree
      orgs.forEach((org) => {
        const node = orgMap.get(org.id)!;
        if (org.parent_id && orgMap.has(org.parent_id)) {
          const parent = orgMap.get(org.parent_id)!;
          node.depth = parent.depth + 1;
          parent.children = parent.children ?? [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      });

      // Flatten tree for FlatList
      const flattened: Organization[] = [];
      function flatten(nodes: Organization[], depth: number) {
        nodes.forEach((node) => {
          flattened.push({ ...node, depth });
          if (expanded[node.id] && node.children && node.children.length > 0) {
            flatten(node.children, depth + 1);
          }
        });
      }
      flatten(roots, 0);

      setOrganizations(flattened);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [member?.church_id, expanded]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleAddOrganization() {
    if (!newName.trim()) {
      Alert.alert('오류', '조직 이름을 입력해주세요.');
      return;
    }
    if (!member?.church_id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('organizations').insert({
        church_id: member.church_id,
        name: newName.trim(),
        type: newType,
        parent_id: newParentId,
      });

      if (error) throw error;

      setNewName('');
      setNewType('department');
      setNewParentId(null);
      setIsSheetOpen(false);
      fetchOrganizations();
    } catch {
      Alert.alert('오류', '조직 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderOrganization = useCallback(
    ({ item }: { item: Organization }) => {
      const hasChildren =
        item.children && item.children.length > 0;
      const isExpanded = expanded[item.id];

      return (
        <TouchableOpacity
          onPress={() => {
            if (hasChildren) toggleExpand(item.id);
          }}
          className="bg-white border-b border-gray-100"
          activeOpacity={hasChildren ? 0.6 : 1}
          style={{ minHeight: 56 }}
        >
          <View
            className="flex-row items-center px-4 py-3"
            style={{ paddingLeft: 16 + item.depth * 24 }}
          >
            {/* Expand/Collapse Arrow */}
            <View className="w-6 items-center mr-2">
              {hasChildren ? (
                <Text className="text-gray-400 text-sm">
                  {isExpanded ? '\u25BC' : '\u25B6'}
                </Text>
              ) : (
                <View className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              )}
            </View>

            {/* Org Info */}
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-medium text-gray-800">
                  {item.name}
                </Text>
                <CTBadge
                  label={ORG_TYPE_LABELS[item.type] ?? item.type}
                  color={ORG_TYPE_COLORS[item.type] ?? 'gray'}
                  size="sm"
                />
              </View>
            </View>

            {/* Member count */}
            <Text className="text-sm text-gray-400">
              {item.member_count ?? 0}명
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [expanded]
  );

  const orgTypeOptions = Object.entries(ORG_TYPE_LABELS);

  return (
    <>
      <Stack.Screen
        options={{
          title: '조직도',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setIsSheetOpen(true)}
              className="mr-2"
            >
              <Text className="text-ct-primary font-semibold text-base">
                + 추가
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-gray-50">
        {isLoading ? (
          <CTSpinner className="flex-1 mt-12" />
        ) : (
          <FlatList
            data={organizations}
            keyExtractor={(item) => item.id}
            renderItem={renderOrganization}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchOrganizations();
                }}
                tintColor="#228B22"
              />
            }
            ListEmptyComponent={
              <CTEmptyState
                title="조직이 없습니다"
                description="교회 조직을 추가해보세요"
                actionLabel="조직 추가"
                onAction={() => setIsSheetOpen(true)}
              />
            }
          />
        )}
      </View>

      {/* Add Organization Bottom Sheet */}
      <CTBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="조직 추가"
      >
        <View className="gap-4">
          <CTFormField label="조직 이름" isRequired>
            <CTInput
              placeholder="예: 청년부, 찬양팀"
              value={newName}
              onChangeText={setNewName}
            />
          </CTFormField>

          <CTFormField label="유형">
            <View className="flex-row flex-wrap gap-2">
              {orgTypeOptions.map(([key, label]) => {
                const isSelected = newType === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setNewType(key)}
                    className={`px-3 py-2 rounded-full border ${
                      isSelected
                        ? 'bg-ct-primary-50 border-ct-primary'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    style={{ minHeight: 44 }}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-ct-primary' : 'text-gray-600'
                      }`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CTFormField>

          <CTButton
            fullWidth
            onPress={handleAddOrganization}
            isLoading={isSubmitting}
          >
            추가하기
          </CTButton>
        </View>
      </CTBottomSheet>
    </>
  );
}
