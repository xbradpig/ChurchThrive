'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CTButton } from '@/components/atoms/CTButton';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTSpinner } from '@/components/atoms/CTSpinner';
import { CTEmptyState } from '@/components/molecules/CTEmptyState';
import { ORG_TYPE_LABELS } from '@churchthrive/shared';
import type { Organization, OrgRole } from '@churchthrive/shared';
import {
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BuildingOffice2Icon,
  UsersIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

interface OrgTreeNode extends Organization {
  children: OrgTreeNode[];
  memberCount: number;
}

const ORG_TYPE_COLORS: Record<string, 'blue' | 'green' | 'yellow' | 'gray'> = {
  committee: 'blue',
  department: 'green',
  group: 'yellow',
  team: 'gray',
};

function buildTree(orgs: Organization[], orgRoleCounts: Record<string, number>, parentId: string | null = null): OrgTreeNode[] {
  return orgs
    .filter(o => o.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(org => ({
      ...org,
      children: buildTree(orgs, orgRoleCounts, org.id),
      memberCount: orgRoleCounts[org.id] || 0,
    }));
}

function TreeNode({
  node,
  depth,
  expandedIds,
  onToggle,
  onSelect,
}: {
  node: OrgTreeNode;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);

  return (
    <div>
      <button
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          className="w-6 h-6 flex items-center justify-center shrink-0"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            )
          ) : (
            <div className="w-4" />
          )}
        </button>

        {/* Drag handle (visual) */}
        <Bars3Icon className="w-4 h-4 text-gray-300 shrink-0 cursor-grab" />

        {/* Org info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-ct-md font-medium text-[var(--ct-color-text-primary)] truncate">
              {node.name}
            </span>
            <CTBadge
              label={ORG_TYPE_LABELS[node.type]}
              color={ORG_TYPE_COLORS[node.type] || 'gray'}
              size="sm"
            />
          </div>
          {node.description && (
            <p className="text-ct-xs text-gray-400 truncate mt-0.5">
              {node.description}
            </p>
          )}
        </div>

        {/* Member count */}
        <div className="flex items-center gap-1 text-ct-xs text-gray-400 shrink-0">
          <UsersIcon className="w-4 h-4" />
          <span>{node.memberCount}명</span>
        </div>
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tree, setTree] = useState<OrgTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!member) return;

      // Fetch all organizations
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('church_id', member.church_id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Fetch member counts per org
      const { data: roles } = await supabase
        .from('org_roles')
        .select('organization_id');

      const orgRoleCounts: Record<string, number> = {};
      (roles || []).forEach((r) => {
        orgRoleCounts[r.organization_id] = (orgRoleCounts[r.organization_id] || 0) + 1;
      });

      const treeData = buildTree(orgs || [], orgRoleCounts);
      setTree(treeData);

      // Expand all root nodes by default
      const rootIds = new Set((orgs || []).filter(o => !o.parent_id).map(o => o.id));
      setExpandedIds(rootIds);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function expandAll() {
    const allIds = new Set<string>();
    function collect(nodes: OrgTreeNode[]) {
      nodes.forEach(n => {
        allIds.add(n.id);
        collect(n.children);
      });
    }
    collect(tree);
    setExpandedIds(allIds);
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-ct-2xl font-bold text-[var(--ct-color-text-heading)]">
          조직도
        </h1>
        <div className="flex items-center gap-2">
          <CTButton variant="ghost" size="sm" onClick={expandAll}>
            전체 펼치기
          </CTButton>
          <CTButton variant="ghost" size="sm" onClick={collapseAll}>
            전체 접기
          </CTButton>
          <CTButton
            variant="primary"
            size="md"
            leftIcon={<PlusIcon />}
            onClick={() => router.push('/admin/organizations/new')}
          >
            조직 추가
          </CTButton>
        </div>
      </div>

      {/* Tree View */}
      <div className="bg-white rounded-ct-lg shadow-ct-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <CTSpinner size="lg" />
          </div>
        ) : tree.length === 0 ? (
          <CTEmptyState
            icon={<BuildingOffice2Icon className="w-16 h-16" />}
            title="등록된 조직이 없습니다"
            description="교회 조직을 추가하여 조직도를 구성해보세요."
            actionLabel="조직 추가"
            onAction={() => router.push('/admin/organizations/new')}
          />
        ) : (
          <div>
            {/* Table header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-ct-xs font-medium text-gray-500 uppercase">
              <span className="flex-1">조직명</span>
              <span className="w-16 text-right">인원</span>
            </div>
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
                onSelect={(id) => router.push(`/admin/organizations/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
