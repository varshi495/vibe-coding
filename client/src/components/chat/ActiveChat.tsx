import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../ui/Avatar';
import { SendHorizonal, ArrowLeft, Phone, Search, MoreVertical, Check, CheckCheck, Clock, Smile, Paperclip } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message } from '../../types/chat';

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
    sendTypingStart,
    sendTypingStop,
  } = useSocket();

  const [inputContent, setInputContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMessages: Message[] = activeConversationId ? messages[activeConversationId] || [] : [];
  const otherMember = activeConversation?.otherMember;

  const isContactTyping = activeConversationId ? !!typingUsers[activeConversationId] : false;
  const presenceInfo = otherMember ? onlineUsers[otherMember.id] : undefined;

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputContent(val);

    if (activeConversationId && otherMember) {
      sendTypingStart(activeConversationId, otherMember.id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStop(activeConversationId, otherMember.id);
      }, 3000);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputContent.trim() || !activeConversationId || !otherMember) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStop(activeConversationId, otherMember.id);

    sendMessage(activeConversationId, otherMember.id, inputContent.trim());
    setInputContent('');
  };

  if (!activeConversation || !otherMember) {
    return null;
  }

  // Render header status text
  const renderPresenceSubtitle = () => {
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

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0b141a] relative overflow-hidden">
      {/* Header */}
      <header className="h-[60px] bg-[#111b21]/90 backdrop-blur-md px-4 flex items-center justify-between border-b border-[#222e35] z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-1.5 rounded-full hover:bg-[#202c33] text-[#aebac1]"
          >
            <ArrowLeft size={20} />
          </button>
          <Avatar
            name={otherMember.name}
            src={otherMember.avatar}
            size="md"
            showOnline={presenceInfo?.isOnline}
          />
          <div className="flex flex-col leading-tight">
            <h2 className="text-[#e9edef] font-semibold text-sm">{otherMember.name}</h2>
            {renderPresenceSubtitle()}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#aebac1]">
          <button className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#e9edef] transition">
            <Search size={19} />
          </button>
          <button className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#e9edef] transition">
            <Phone size={19} />
          </button>
          <button className="p-2 rounded-full hover:bg-[#202c33] hover:text-[#e9edef] transition">
            <MoreVertical size={19} />
          </button>
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
              No messages yet. Say hello to start the conversation!
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
    </main>
  );
};
