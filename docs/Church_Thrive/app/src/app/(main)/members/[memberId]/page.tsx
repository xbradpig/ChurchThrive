import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatPhone, formatDate, POSITION_LABELS, ROLE_LABELS, GENDER_LABELS } from '@churchthrive/shared';
import { CTAvatar } from '@/components/atoms/CTAvatar';
import { CTBadge } from '@/components/atoms/CTBadge';
import { CTButton } from '@/components/atoms/CTButton';
import { CTCard } from '@/components/molecules/CTCard';
import { CTTabMenu } from '@/components/molecules/CTTabMenu';
import { PencilIcon, PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { memberId: string } }) {
  return { title: '교인 상세' };
}

export default async function MemberDetailPage({ params }: { params: { memberId: string } }) {
  const supabase = await createServerSupabaseClient();

  const { data: member, error } = await supabase
    .from('members')
    .select(`
      *,
      cell_groups(id, name)
    `)
    .eq('id', params.memberId)
    .single();

  if (error || !member) notFound();

  // Fetch family relationships
  const { data: familyMembers } = await supabase
    .from('family_members')
    .select(`
      *,
      families(id, family_name),
      members:member_id(id, name, phone, photo_url, position, role)
    `)
    .eq('member_id', member.id);

  // Fetch attendance count
  const { count: attendanceCount } = await supabase
    .from('attendances')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', member.id);

  const cellGroup = (member as any).cell_groups;

  return (
    <div className="ct-container py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/members" className="text-gray-400 hover:text-gray-600">
            &larr; 목록
          </Link>
        </div>
        <Link href={`/members/${member.id}/edit`}>
          <CTButton variant="outline" size="sm" leftIcon={<PencilIcon className="w-4 h-4" />}>
            수정
          </CTButton>
        </Link>
      </div>

      {/* Profile Card */}
      <CTCard padding="lg" className="mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <CTAvatar src={member.photo_url} name={member.name} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-ct-2xl font-bold">{member.name}</h1>
              <CTBadge
                label={member.status === 'active' ? '활동' : member.status === 'pending' ? '대기' : member.status}
                color={member.status === 'active' ? 'green' : member.status === 'pending' ? 'yellow' : 'gray'}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 text-ct-sm text-gray-500">
              {member.position && (
                <span>{POSITION_LABELS[member.position as keyof typeof POSITION_LABELS]}</span>
              )}
              <span>&middot;</span>
              <span>{ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}</span>
              {cellGroup && (
                <>
                  <span>&middot;</span>
                  <span>{cellGroup.name}</span>
                </>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 mt-4">
              <a href={`tel:${member.phone}`} className="flex items-center gap-1.5 text-ct-sm text-gray-600 hover:text-ct-primary">
                <PhoneIcon className="w-4 h-4" />
                {formatPhone(member.phone)}
              </a>
              {member.email && (
                <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-ct-sm text-gray-600 hover:text-ct-primary">
                  <EnvelopeIcon className="w-4 h-4" />
                  {member.email}
                </a>
              )}
              {member.address && (
                <span className="flex items-center gap-1.5 text-ct-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4" />
                  {member.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </CTCard>

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <CTCard padding="sm">
          <p className="text-ct-xs text-gray-500">성별</p>
          <p className="text-ct-md font-medium mt-1">
            {member.gender ? GENDER_LABELS[member.gender as keyof typeof GENDER_LABELS] : '-'}
          </p>
        </CTCard>
        <CTCard padding="sm">
          <p className="text-ct-xs text-gray-500">생년월일</p>
          <p className="text-ct-md font-medium mt-1">
            {member.birth_date ? formatDate(member.birth_date) : '-'}
          </p>
        </CTCard>
        <CTCard padding="sm">
          <p className="text-ct-xs text-gray-500">세례일</p>
          <p className="text-ct-md font-medium mt-1">
            {member.baptism_date ? formatDate(member.baptism_date) : '-'}
          </p>
        </CTCard>
        <CTCard padding="sm">
          <p className="text-ct-xs text-gray-500">출석 횟수</p>
          <p className="text-ct-md font-medium mt-1">{attendanceCount || 0}회</p>
        </CTCard>
      </div>

      {/* Family */}
      {familyMembers && familyMembers.length > 0 && (
        <CTCard title="가족 관계" className="mb-6">
          <div className="space-y-3 mt-2">
            {familyMembers.map((fm: any) => (
              <div key={fm.id} className="flex items-center gap-3">
                <CTAvatar name={fm.members?.name} size="sm" />
                <div>
                  <p className="text-ct-sm font-medium">{fm.members?.name}</p>
                  <p className="text-ct-xs text-gray-400">{fm.relationship}</p>
                </div>
              </div>
            ))}
          </div>
        </CTCard>
      )}

      {/* Joined Date */}
      <div className="text-ct-xs text-gray-400 text-center">
        등록일: {member.joined_at ? formatDate(member.joined_at) : formatDate(member.created_at)}
      </div>
    </div>
  );
}
