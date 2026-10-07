import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  ShieldCheck,
  UserMinus,
  UserCheck,
  LogOut,
  Edit2,
  Check,
  UserPlus,
  Loader2,
  MoreVertical,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Conversation, GroupMember, MemberRole, ChatUser } from '../../types/chat';
import { Avatar } from '../ui/Avatar';
import api from '../../services/api';

interface GroupInfoPanelProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupInfoPanel: React.FC<GroupInfoPanelProps> = ({ conversation, isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    groupMembers,
    fetchGroupInfo,
    addGroupMember,
    removeGroupMember,
    updateMemberRole,
    updateGroupInfo,
    setActiveConversation,
  } = useSocket();

  const members = groupMembers[conversation.id] || conversation.members || [];

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(conversation.name || conversation.groupInfo?.name || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState(
    conversation.description || conversation.groupInfo?.description || ''
  );

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

  // Sync state when conversation changes
  useEffect(() => {
    if (conversation.id && isOpen) {
      fetchGroupInfo(conversation.id);
      setEditedName(conversation.name || conversation.groupInfo?.name || '');
      setEditedDesc(conversation.description || conversation.groupInfo?.description || '');
    }
  }, [conversation.id, isOpen, fetchGroupInfo]);

  // Current user's membership and role in this group
  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'ADMIN';

  // Search users to add
  useEffect(() => {
    if (!searchUserQuery.trim() || searchUserQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.get<ChatUser[]>(`/users/search?q=${encodeURIComponent(searchUserQuery.trim())}`);
        // Filter out existing members
        const filtered = data.filter((u) => !members.some((m) => m.userId === u.id));
        setSearchResults(filtered);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchUserQuery, members]);

  if (!isOpen) return null;

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim() === conversation.name) {
      setIsEditingName(false);
      return;
    }
    setActionLoading('save_name');
    try {
      await updateGroupInfo(conversation.id, { name: editedName.trim() });
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update group name:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveDesc = async () => {
    setActionLoading('save_desc');
    try {
      await updateGroupInfo(conversation.id, { description: editedDesc.trim() });
      setIsEditingDesc(false);
    } catch (err) {
      console.error('Failed to update group description:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddUser = async (targetUserId: string) => {
    setActionLoading(`add_${targetUserId}`);
    try {
      await addGroupMember(conversation.id, targetUserId);
      setSearchUserQuery('');
      setSearchResults([]);
      setIsAddingMember(false);
    } catch (err) {
      console.error('Failed to add member:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleToggle = async (targetUserId: string, currentRole: MemberRole) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    setActionLoading(`role_${targetUserId}`);
    setOpenMenuUserId(null);
    try {
      await updateMemberRole(conversation.id, targetUserId, newRole);
    } catch (err) {
      console.error('Failed to change role:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveUser = async (targetUserId: string) => {
    setActionLoading(`remove_${targetUserId}`);
    setOpenMenuUserId(null);
    try {
      await removeGroupMember(conversation.id, targetUserId);
    } catch (err) {
      console.error('Failed to remove member:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    setActionLoading('leave');
    try {
      await removeGroupMember(conversation.id, user.id);
      setActiveConversation(null);
      onClose();
    } catch (err) {
      console.error('Failed to leave group:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const groupName = conversation.groupInfo?.name || conversation.name || 'Group';
  const groupAvatar = conversation.groupInfo?.avatar || conversation.avatar;

  return (
    <div className="absolute inset-y-0 right-0 w-full sm:w-[380px] bg-[#111b21] border-l border-[#222e35] z-30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between border-b border-[#222e35] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-[#e9edef] font-semibold text-base">Group Info</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/70">
        {/* Profile Card */}
        <div className="p-6 flex flex-col items-center text-center bg-[#111b21]">
          <div className="w-24 h-24 rounded-full bg-[#202c33] border-2 border-[#2a3942] flex items-center justify-center text-[#00a884] overflow-hidden mb-4 shadow-lg">
            {groupAvatar ? (
              <img src={groupAvatar} alt={groupName} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-12 h-12 stroke-[1.5]" />
            )}
          </div>

          {/* Group Name */}
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full max-w-xs mb-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 bg-[#202c33] border border-[#00a884] rounded-lg px-3 py-1.5 text-[#e9edef] text-sm focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={actionLoading === 'save_name'}
                className="p-1.5 bg-[#00a884] text-[#111b21] rounded-lg hover:bg-[#02906f] transition"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-[#e9edef] font-bold text-lg">{groupName}</h2>
              {isAdmin && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-[#8696a0] hover:text-[#00a884] transition"
                  title="Edit group name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <span className="text-xs text-[#8696a0]">
            Group · {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Group Description */}
        <div className="p-4 bg-[#111b21]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
              Description
            </span>
            {isAdmin && !isEditingDesc && (
              <button
                onClick={() => setIsEditingDesc(true)}
                className="text-xs text-[#00a884] hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingDesc ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                placeholder="Add a group description..."
                rows={3}
                className="w-full bg-[#202c33] border border-[#00a884] rounded-lg p-2.5 text-[#e9edef] text-xs focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingDesc(false)}
                  className="px-2.5 py-1 text-xs text-[#8696a0] hover:text-[#e9edef]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDesc}
                  disabled={actionLoading === 'save_desc'}
                  className="px-3 py-1 bg-[#00a884] text-[#111b21] rounded text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#d1d7db] whitespace-pre-wrap">
              {conversation.groupInfo?.description || conversation.description || (
                <span className="italic text-[#8696a0]">No description provided</span>
              )}
            </p>
          )}
        </div>

        {/* Member Management Section */}
        <div className="p-4 bg-[#111b21]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
              {members.length} Members
            </span>
            {isAdmin && (
              <button
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#00a884] hover:text-[#02906f] transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Member
              </button>
            )}
          </div>

          {/* Inline Add Member Search */}
          {isAddingMember && (
            <div className="mb-3 p-3 bg-[#202c33] rounded-xl border border-[#2a3942] space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8696a0] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user to add..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="w-3.5 h-3.5 text-[#00a884] animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-36 overflow-y-auto divide-y divide-[#111b21] border border-[#111b21] rounded-lg">
                  {searchResults.map((sr) => (
                    <div
                      key={sr.id}
                      className="p-2 flex items-center justify-between hover:bg-[#111b21] transition"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={sr.name} src={sr.avatar} size="sm" />
                        <span className="text-xs text-[#e9edef] font-medium">{sr.name}</span>
                      </div>
                      <button
                        onClick={() => handleAddUser(sr.id)}
                        disabled={actionLoading === `add_${sr.id}`}
                        className="px-2.5 py-1 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] rounded text-[11px] font-semibold transition"
                      >
                        {actionLoading === `add_${sr.id}` ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Member List */}
          <div className="space-y-1">
            {members.map((member) => {
              const isSelf = member.userId === user?.id;
              const isMemberAdmin = member.role === 'ADMIN';

              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#202c33]/50 transition group relative"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={member.name} src={member.avatar} size="md" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-[#e9edef] truncate max-w-[150px]">
                          {member.name}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] text-[#8696a0] font-normal">(You)</span>
                        )}
                      </div>
                      <span className="text-xs text-[#8696a0] truncate max-w-[150px]">
                        {member.status || 'ChatApp User'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isMemberAdmin && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30">
                        Admin
                      </span>
                    )}

                    {/* Admin Action Menu for other members */}
                    {isAdmin && !isSelf && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuUserId(openMenuUserId === member.userId ? null : member.userId)
                          }
                          className="p-1.5 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] rounded-full transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuUserId === member.userId && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-[#233138] border border-[#2a3942] rounded-xl shadow-2xl py-1 z-40">
                            <button
                              onClick={() => handleRoleToggle(member.userId, member.role)}
                              disabled={actionLoading === `role_${member.userId}`}
                              className="w-full px-3 py-2 text-left text-xs text-[#e9edef] hover:bg-[#111b21] flex items-center gap-2 transition"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
                              {isMemberAdmin ? 'Dismiss as admin' : 'Make group admin'}
                            </button>
                            <button
                              onClick={() => handleRemoveUser(member.userId)}
                              disabled={actionLoading === `remove_${member.userId}`}
                              className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-[#111b21] flex items-center gap-2 transition"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Remove {member.name.split(' ')[0]}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger Zone: Leave Group */}
        <div className="p-4 bg-[#111b21]">
          <button
            onClick={handleLeaveGroup}
            disabled={actionLoading === 'leave'}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 text-sm font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            {actionLoading === 'leave' ? 'Leaving group...' : 'Exit Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoPanel;
