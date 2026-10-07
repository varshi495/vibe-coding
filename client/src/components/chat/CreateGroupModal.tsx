import React, { useState, useEffect } from 'react';
import { X, Users, Search, Check, Loader2, ImagePlus } from 'lucide-react';
import api from '../../services/api';
import { ChatUser } from '../../types/chat';
import { Avatar } from '../ui/Avatar';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, memberIds: string[], description?: string, avatar?: string) => Promise<string>;
  onSelectConversation: (conversationId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  onSelectConversation,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.get<ChatUser[]>(`/users/search?q=${encodeURIComponent(searchTerm.trim())}`);
        setSearchResults(data);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setAvatar('');
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUsers([]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleUser = (user: ChatUser) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please add at least one member');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const convId = await onCreateGroup(
        name.trim(),
        selectedUsers.map((u) => u.id),
        description.trim() || undefined,
        avatar.trim() || undefined
      );
      onSelectConversation(convId);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="h-16 px-6 bg-[#202c33] flex items-center justify-between border-b border-[#222e35] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-[#e9edef] font-semibold text-lg">New Group Chat</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden p-6 gap-5">
          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Group Details */}
          <div className="flex items-start gap-4">
            {/* Avatar preview */}
            <div className="w-16 h-16 rounded-full bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-[#8696a0] overflow-hidden flex-shrink-0 relative group">
              {avatar ? (
                <img src={avatar} alt="Group preview" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-7 h-7 text-[#00a884]" />
              )}
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Group Subject / Name *"
                value={name}
                maxLength={50}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-3.5 py-2 text-[#e9edef] placeholder-[#8696a0] text-sm focus:outline-none focus:border-[#00a884] transition"
                required
              />
              <input
                type="text"
                placeholder="Group Description (optional)"
                value={description}
                maxLength={150}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-3.5 py-2 text-[#e9edef] placeholder-[#8696a0] text-sm focus:outline-none focus:border-[#00a884] transition"
              />
              <input
                type="url"
                placeholder="Avatar Image URL (optional)"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-3.5 py-2 text-[#e9edef] placeholder-[#8696a0] text-xs focus:outline-none focus:border-[#00a884] transition"
              />
            </div>
          </div>

          {/* Selected members chip list */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-[#8696a0] font-medium uppercase tracking-wider">
                Selected ({selectedUsers.length})
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#202c33] border border-[#00a884]/40 text-[#e9edef] text-xs"
                  >
                    <Avatar name={u.name} src={u.avatar} size="sm" className="w-4 h-4 text-[9px]" />
                    <span className="truncate max-w-[120px]">{u.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(u.id)}
                      className="text-[#8696a0] hover:text-red-400 p-0.5 rounded-full transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* User Search & Selection */}
          <div className="flex flex-col flex-1 min-h-0 gap-2">
            <div className="text-xs text-[#8696a0] font-medium uppercase tracking-wider">
              Add Members
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search people by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg pl-9 pr-3.5 py-2 text-[#e9edef] placeholder-[#8696a0] text-sm focus:outline-none focus:border-[#00a884] transition"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-[#00a884] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/50 border border-[#202c33] rounded-lg mt-1 min-h-[160px] max-h-[220px]">
              {searchResults.length === 0 ? (
                <div className="h-full flex items-center justify-center p-6 text-center text-xs text-[#8696a0]">
                  {searchTerm.trim().length >= 2
                    ? 'No users found matching query'
                    : 'Type at least 2 characters to search users'}
                </div>
              ) : (
                searchResults.map((user) => {
                  const isSelected = selectedUsers.some((u) => u.id === user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleToggleUser(user)}
                      className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition ${
                        isSelected ? 'bg-[#00a884]/10' : 'hover:bg-[#202c33]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} src={user.avatar} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-[#e9edef] text-sm font-medium">{user.name}</span>
                          <span className="text-[#8696a0] text-xs truncate max-w-[200px]">
                            {user.email || user.phone || user.status || 'ChatApp User'}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-[#00a884] border-[#00a884] text-[#111b21]'
                            : 'border-[#8696a0]/40'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222e35] flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || selectedUsers.length === 0}
              className="px-5 py-2 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
