import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../ui/Avatar';
import { Search, SquarePen, X, UserPlus, LogOut, Loader2, MessageSquare, Users } from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import api from '../../services/api';
import { ChatUser } from '../../types/chat';
import { CreateGroupModal } from './CreateGroupModal';

export const ChatList: React.FC<{ onOpenProfile?: () => void }> = ({ onOpenProfile }) => {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    loadMessages,
    startConversationWithUser,
    createGroupChat,
    typingUsers,
    onlineUsers,
  } = useSocket();

  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatPanel, setShowNewChatPanel] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);

  // Debounced user search in NewChat panel
  useEffect(() => {
    if (!userSearchTerm.trim() || userSearchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const data = await api.get<ChatUser[]>(`/users/search?q=${encodeURIComponent(userSearchTerm.trim())}`);
        setSearchResults(data);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  // Handle starting a new 1-on-1 conversation
  const handleSelectUser = async (targetUser: ChatUser) => {
    setIsStartingChat(targetUser.id);
    try {
      const convId = await startConversationWithUser(targetUser.id);
      setActiveConversation(convId);
      await loadMessages(convId);
      setShowNewChatPanel(false);
      setUserSearchTerm('');
    } catch (err) {
      console.error('Error starting conversation:', err);
    } finally {
      setIsStartingChat(null);
    }
  };

  // Filter existing conversations by name (1-on-1 name or group name)
  const filteredConversations = conversations.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    if (c.isGroup) {
      const gName = (c.groupInfo?.name || c.name || 'Group').toLowerCase();
      return gName.includes(term);
    }
    return c.otherMember?.name?.toLowerCase().includes(term);
  });

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isToday(d)) {
      return format(d, 'h:mm a');
    }
    if (isYesterday(d)) {
      return 'Yesterday';
    }
    return format(d, 'dd/MM/yyyy');
  };

  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] h-full bg-[#111b21] border-r border-[#222e35] flex flex-col flex-shrink-0 relative select-none">
      {/* Header */}
      <header className="h-[60px] bg-[#202c33]/70 backdrop-blur-md px-4 flex items-center justify-between border-b border-[#222e35] flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenProfile}>
          <Avatar name={user?.name || ''} src={user?.avatar} size="md" showOnline />
          <div className="flex flex-col leading-tight">
            <span className="text-[#e9edef] font-semibold text-sm truncate max-w-[130px]">{user?.name}</span>
            <span className="text-[#8696a0] text-xs">My Profile</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#aebac1]">
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#00a884] transition"
            title="New Group Chat"
          >
            <Users size={20} />
          </button>
          <button
            onClick={() => setShowNewChatPanel(true)}
            className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#e9edef] transition"
            title="New Chat"
          >
            <SquarePen size={20} />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#ef4444] transition"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-2.5 bg-[#111b21] border-b border-[#222e35]/60 flex-shrink-0">
        <div className="relative flex items-center bg-[#202c33] rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00a884]">
          <Search size={17} className="text-[#8696a0] mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full bg-transparent text-[#e9edef] placeholder-[#8696a0] text-sm outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-[#8696a0] hover:text-[#e9edef]">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]/30 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-[#8696a0] text-sm">
            {searchTerm ? 'No chats found' : 'No conversations yet'}
            {!searchTerm && (
              <div className="flex flex-col gap-2 mt-4 items-center">
                <button
                  onClick={() => setShowNewChatPanel(true)}
                  className="text-[#00a884] font-medium hover:underline text-xs"
                >
                  Start a 1-on-1 chat
                </button>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="text-[#00a884] font-medium hover:underline text-xs"
                >
                  Create a new group
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isGroup = conv.isGroup;
            const title = isGroup
              ? conv.groupInfo?.name || conv.name || 'Group'
              : conv.otherMember?.name || 'Unknown User';
            const avatar = isGroup
              ? conv.groupInfo?.avatar || conv.avatar
              : conv.otherMember?.avatar;
            const isOnline = !isGroup && conv.otherMember?.id
              ? onlineUsers[conv.otherMember.id]?.isOnline
              : false;

            // Last message display text
            const lastMsg = conv.lastMessage;
            let previewText: React.ReactNode = <span className="italic">No messages yet</span>;
            if (lastMsg) {
              if (lastMsg.type === 'SYSTEM') {
                previewText = <span className="italic text-gray-400">{lastMsg.content}</span>;
              } else {
                let mediaLabel: string = lastMsg.content;
                if (lastMsg.type === 'IMAGE') {
                  mediaLabel = '📷 Photo' + (lastMsg.content ? `: ${lastMsg.content}` : '');
                } else if (lastMsg.type === 'VIDEO') {
                  mediaLabel = '🎥 Video' + (lastMsg.content ? `: ${lastMsg.content}` : '');
                } else if (lastMsg.type === 'AUDIO') {
                  mediaLabel = '🎙️ Voice message';
                } else if (lastMsg.type === 'DOCUMENT') {
                  mediaLabel = `📄 ${lastMsg.content || 'Document'}`;
                }

                if (isGroup && lastMsg.sender?.name) {
                  const senderFirstName = lastMsg.sender.name.split(' ')[0];
                  previewText = (
                    <span>
                      <span className="text-[#d1d7db] font-medium">{senderFirstName}: </span>
                      {mediaLabel}
                    </span>
                  );
                } else {
                  previewText = mediaLabel;
                }
              }
            }

            return (
              <div
                key={conv.id}
                onClick={async () => {
                  setActiveConversation(conv.id);
                  await loadMessages(conv.id);
                }}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition hover:bg-[#202c33]/60 ${
                  isActive ? 'bg-[#2a3942]' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {isGroup ? (
                    <div className="w-11 h-11 rounded-full bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-[#00a884] overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5" />
                      )}
                    </div>
                  ) : (
                    <Avatar
                      name={title}
                      src={avatar}
                      size="md"
                      showOnline={isOnline}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[#e9edef] font-medium text-sm truncate">{title}</span>
                      {isGroup && conv.groupInfo?.memberCount && (
                        <span className="text-[10px] text-[#8696a0] font-normal px-1.5 py-0.5 bg-[#202c33] rounded-full flex-shrink-0">
                          {conv.groupInfo.memberCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#8696a0] flex-shrink-0">
                      {formatTimestamp(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8696a0] truncate max-w-[210px]">
                      {typingUsers[conv.id] ? (
                        <span className="text-[#00a884] font-medium animate-pulse">typing...</span>
                      ) : (
                        previewText
                      )}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-[#00a884] text-[#111b21] font-bold text-[11px] h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide-in New Chat Overlay Panel */}
      {showNewChatPanel && (
        <div className="absolute inset-0 bg-[#111b21] z-30 flex flex-col animate-in slide-in-from-left duration-200">
          {/* New Chat Header */}
          <div className="h-[60px] bg-[#202c33] px-4 flex items-center gap-4 text-[#e9edef]">
            <button
              onClick={() => setShowNewChatPanel(false)}
              className="p-1 rounded-full hover:bg-[#2a3942] transition"
            >
              <X size={20} />
            </button>
            <h3 className="font-semibold text-base">New Chat</h3>
          </div>

          {/* User Search Input */}
          <div className="p-3 border-b border-[#222e35]">
            <div className="relative flex items-center bg-[#202c33] rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-[#00a884]">
              <Search size={18} className="text-[#8696a0] mr-2" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search by name, email, or phone"
                className="w-full bg-transparent text-[#e9edef] placeholder-[#8696a0] text-sm outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto p-2">
            {isSearchingUsers ? (
              <div className="flex items-center justify-center p-8 text-[#8696a0] gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Searching users...</span>
              </div>
            ) : userSearchTerm.length > 0 && searchResults.length === 0 ? (
              <div className="p-8 text-center text-[#8696a0] text-sm">No users found matching "{userSearchTerm}"</div>
            ) : userSearchTerm.length === 0 ? (
              <div className="p-6 text-center text-[#8696a0] text-xs">
                Type at least 2 characters to search for registered users.
              </div>
            ) : (
              searchResults.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#202c33] cursor-pointer transition"
                >
                  <Avatar name={u.name} src={u.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[#e9edef] font-medium text-sm truncate">{u.name}</h4>
                    <p className="text-[#8696a0] text-xs truncate">{u.status || u.email || u.phone}</p>
                  </div>
                  {isStartingChat === u.id ? (
                    <Loader2 size={18} className="animate-spin text-[#00a884]" />
                  ) : (
                    <MessageSquare size={18} className="text-[#8696a0]" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreateGroup={createGroupChat}
        onSelectConversation={(id) => {
          setActiveConversation(id);
          loadMessages(id);
        }}
      />
    </aside>
  );
};
