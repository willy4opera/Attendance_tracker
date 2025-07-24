import React from 'react';
import MemberCard from './MemberCard';
import type { GroupMember } from '../../types';

interface MemberGridProps {
  members: GroupMember[];
  onMemberClick?: (member: GroupMember) => void;
  showActions?: boolean;
  onRemoveMember?: (memberId: string) => void;
  onUpdateRole?: (memberId: string, role: string) => void;
}

const MemberGrid: React.FC<MemberGridProps> = ({
  members,
  onMemberClick,
  showActions = false,
  onRemoveMember,
  onUpdateRole
}) => {
  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Members</h3>
        <p className="text-gray-600">This group doesn't have any members yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          onClick={onMemberClick ? () => onMemberClick(member) : undefined}
          showActions={showActions}
          onRemove={onRemoveMember ? () => onRemoveMember(member.userId) : undefined}
          onUpdateRole={onUpdateRole ? (role) => onUpdateRole(member.userId, role) : undefined}
        />
      ))}
    </div>
  );
};

export default MemberGrid;
