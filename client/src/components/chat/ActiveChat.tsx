import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../ui/Avatar';
import {
  SendHorizonal,
  ArrowLeft,
  Phone,
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Smile,
  Paperclip,
  Users,
  Info,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message } from '../../types/chat';
import { GroupInfoPanel } from './GroupInfoPanel';

export const ActiveChat: React.FC = () => {
  const { user } = useAuth();
  const {
    activeConversation,
    activeConversationId,
    setActiveConversation,
    messages,
    sendMessage,
    onlineUsers,
    typingUsers,
    typingUsersList,
    sendTypingStart,
    sendTypingStop,
    groupMembers,
  } = useSocket();

  const [inputContent, setInputContent] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMessages: Message[] = activeConversationId ? messages[activeConversationId] || [] : [];
  const isGroup = !!activeConversation?.isGroup;
  const otherMember = activeConversation?.otherMember;

  const groupMemberList = activeConversationId ? groupMembers[activeConversationId] || [] : [];
  const memberCount = activeConversation?.groupInfo?.memberCount || groupMemberList.length || 0;

  const isContactTyping = activeConversationId ? !!typingUsers[activeConversationId] : false;
  const typingUserIds = activeConversationId ? typingUsersList[activeConversationId] || [] : [];

  const presenceInfo = otherMember ? onlineUsers[otherMember.id] : undefined;

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Close info panel when changing active conversation
  useEffect(() => {
    setShowGroupInfo(false);
  }, [activeConversationId]);

  if (!activeConversation) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputContent(val);

    if (activeConversationId) {
      const recipientId = isGroup ? undefined : otherMember?.id;
      sendTypingStart(activeConversationId, recipientId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStop(activeConversationId, recipientId);
      }, 3000);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputContent.trim() || !activeConversationId) return;

    const recipientId = isGroup ? undefined : otherMember?.id;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStop(activeConversationId, recipientId);

    sendMessage(activeConversationId, recipientId, inputContent.trim());
    setInputContent('');
  };

  // Render header status/presence text
  const renderSubtitle = () => {
    if (isGroup) {
      if (typingUserIds.length > 0) {
        // Resolve names of typing members
        const names = typingUserIds.map((id) => {
          const m = groupMemberList.find((member) => member.userId === id);
          return m ? m.name.split(' ')[0] : 'Someone';
        });
        const label =
          names.length === 1
            ? `${names[0]} is typing...`
            : `${names.slice(0, 2).join(', ')} are typing...`;
        return <span className="text-[#00a884] text-xs font-medium animate-pulse">{label}</span>;
      }
      return (
        <span className="text-[#8696a0] text-xs">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
      );
    }

    if (isContactTyping) {
      return <span className="text-[#00a884] text-xs font-medium animate-pulse">typing...</span>;
    }
    if (presenceInfo?.isOnline) {
      return <span className="text-[#00a884] text-xs">online</span>;
    }
    if (presenceInfo?.lastSeen) {
      const d = new Date(presenceInfo.lastSeen);
      const timeStr = isToday(d) ? format(d, 'h:mm a') : format(d, 'dd/MM/yyyy h:mm a');
      return <span className="text-[#8696a0] text-xs">last seen today at {timeStr}</span>;
    }
    return <span className="text-[#8696a0] text-xs">offline</span>;
  };

  // Render status checkmarks
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={12} className="text-[#8696a0] animate-pulse" />;
      case 'SENT':
        return <Check size={14} className="text-[#8696a0]" />;
      case 'DELIVERED':
        return <CheckCheck size={14} className="text-[#8696a0]" />;
      case 'READ':
        return <CheckCheck size={14} className="text-[#53bdeb]" />; // WhatsApp Blue Double Check
      default:
        return <Check size={14} className="text-[#8696a0]" />;
    }
  };

  // Group messages by Date for separator pills
  const renderMessagesWithDateSeparators = () => {
    const elements: React.ReactNode[] = [];
    let lastDateStr = '';

    currentMessages.forEach((msg, idx) => {
      const msgDate = new Date(msg.createdAt);
      let dateLabel = format(msgDate, 'MMMM d, yyyy');

      if (isToday(msgDate)) {
        dateLabel = 'Today';
      } else if (isYesterday(msgDate)) {
        dateLabel = 'Yesterday';
      }

      if (dateLabel !== lastDateStr) {
        lastDateStr = dateLabel;
        elements.push(
          <div key={`date-${dateLabel}-${idx}`} className="flex justify-center my-3">
            <span className="bg-[#182229]/90 backdrop-blur-md text-[#8696a0] text-[11px] px-3 py-1 rounded-md border border-[#222e35]/60 shadow-sm uppercase tracking-wider font-semibold">
              {dateLabel}
            </span>
          </div>
        );
      }

      // Render SYSTEM messages as centered pills
      if (msg.type === 'SYSTEM') {
        elements.push(
          <div key={msg.id || msg.tempId || idx} className="flex justify-center my-2">
            <span className="text-xs text-gray-300 bg-[#182229]/90 border border-[#222e35] px-3.5 py-1 rounded-full shadow-sm text-center max-w-[85%]">
              {msg.content}
            </span>
          </div>
        );
        return;
      }

      const isMe = msg.senderId === user?.id;

      elements.push(
        <div
          key={msg.id || msg.tempId || idx}
          className={`flex mb-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`relative max-w-[75%] sm:max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-sm leading-relaxed ${
              isMe
                ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
            }`}
          >
            {/* Sender name for group messages from others */}
            {!isMe && isGroup && msg.sender?.name && (
              <div className="text-[11px] font-semibold text-[#00a884] mb-0.5">
                {msg.sender.name}
              </div>
            )}

            <div className="whitespace-pre-wrap break-words pr-14">{msg.content}</div>

            {/* Timestamp & Checkmarks */}
            <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-[#8696a0]">
              <span>{format(msgDate, 'h:mm a')}</span>
              {isMe && <span>{renderStatusIcon(msg.status)}</span>}
            </div>
          </div>
        </div>
      );
    });

    return elements;
  };

  const headerTitle = isGroup
    ? activeConversation.groupInfo?.name || activeConversation.name || 'Group'
    : otherMember?.name || 'User';

  const headerAvatar = isGroup
    ? activeConversation.groupInfo?.avatar || activeConversation.avatar
    : otherMember?.avatar;

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0b141a] relative overflow-hidden">
      {/* Header */}
      <header className="h-[60px] bg-[#111b21]/90 backdrop-blur-md px-4 flex items-center justify-between border-b border-[#222e35] z-10 flex-shrink-0">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => isGroup && setShowGroupInfo(true)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveConversation(null);
            }}
            className="md:hidden p-1.5 rounded-full hover:bg-[#202c33] text-[#aebac1]"
          >
            <ArrowLeft size={20} />
          </button>

          {isGroup ? (
            <div className="w-10 h-10 rounded-full bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-[#00a884] overflow-hidden">
              {headerAvatar ? (
                <img src={headerAvatar} alt={headerTitle} className="w-full h-full object-cover" />
              ) : (
                <Users size={20} />
              )}
            </div>
          ) : (
            <Avatar
              name={headerTitle}
              src={headerAvatar}
              size="md"
              showOnline={presenceInfo?.isOnline}
            />
          )}

          <div className="flex flex-col leading-tight">
            <h2 className="text-[#e9edef] font-semibold text-sm truncate max-w-[200px] sm:max-w-xs">
              {headerTitle}
            </h2>
            {renderSubtitle()}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#aebac1]">
          {isGroup ? (
            <button
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#00a884] transition"
              title="Group Info"
            >
              <Info size={20} />
            </button>
          ) : (
            <>
              <button className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#e9edef] transition">
                <Search size={19} />
              </button>
              <button className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#e9edef] transition">
                <Phone size={19} />
              </button>
              <button className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#e9edef] transition">
                <MoreVertical size={19} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Message Area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar relative"
        style={{
          backgroundImage: `radial-gradient(#182229 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      >
        {currentMessages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="bg-[#182229]/80 backdrop-blur-md text-[#8696a0] text-xs px-4 py-2 rounded-lg border border-[#222e35]">
              {isGroup
                ? 'Welcome to the group! Send a message to start chatting.'
                : 'No messages yet. Say hello to start the conversation!'}
            </div>
          </div>
        ) : (
          renderMessagesWithDateSeparators()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose Bar */}
      <form
        onSubmit={handleSend}
        className="h-[62px] bg-[#111b21] px-4 flex items-center gap-3 border-t border-[#222e35] flex-shrink-0"
      >
        <button
          type="button"
          className="p-2 text-[#aebac1] hover:text-[#e9edef] rounded-full hover:bg-[#202c33] transition"
        >
          <Smile size={22} />
        </button>
        <button
          type="button"
          className="p-2 text-[#aebac1] hover:text-[#e9edef] rounded-full hover:bg-[#202c33] transition"
        >
          <Paperclip size={22} />
        </button>

        <input
          type="text"
          value={inputContent}
          onChange={handleInputChange}
          placeholder="Type a message"
          className="flex-1 bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] text-sm px-4 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#00a884]/60"
        />

        <button
          type="submit"
          disabled={!inputContent.trim()}
          className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008069] disabled:opacity-40 disabled:hover:bg-[#00a884] text-[#111b21] flex items-center justify-center transition shadow-md flex-shrink-0"
        >
          <SendHorizonal size={20} className="translate-x-[1px]" />
        </button>
      </form>

      {/* Group Info Slide-over Panel */}
      {isGroup && (
        <GroupInfoPanel
          conversation={activeConversation}
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
        />
      )}
    </main>
  );
};
