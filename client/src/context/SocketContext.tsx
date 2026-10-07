import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { Conversation, Message, MessageStatus } from '../types/chat';

export interface UserPresence {
  isOnline: boolean;
  lastSeen?: string;
}

interface SocketContextType {
  connected: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, recipientId: string, content: string) => void;
  fetchConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  startConversationWithUser: (recipientId: string) => Promise<string>;
  activeConversation: Conversation | null;
  onlineUsers: Record<string, UserPresence>;
  typingUsers: Record<string, boolean>; // conversationId -> isTyping
  sendTypingStart: (conversationId: string, recipientId: string) => void;
  sendTypingStop: (conversationId: string, recipientId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const activeConvIdRef = useRef<string | null>(null);
  activeConvIdRef.current = activeConversationId;

  // 1. Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Conversation[]>('/conversations');
      setConversations(data);

      // Fetch initial presence for all member contacts
      const contactIds = data.map((c) => c.otherMember?.id).filter(Boolean);
      if (contactIds.length > 0) {
        const presenceList = await api.get<{ id: string; isOnline: boolean; lastSeen?: string }[]>(
          `/users/presence?ids=${contactIds.join(',')}`
        );
        const presenceMap: Record<string, UserPresence> = {};
        presenceList.forEach((p) => {
          presenceMap[p.id] = { isOnline: p.isOnline, lastSeen: p.lastSeen };
        });
        setOnlineUsers((prev) => ({ ...prev, ...presenceMap }));
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [token]);

  // 2. Load messages for a conversation & send read receipt
  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!token) return;
      try {
        const data = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
        setMessages((prev) => ({
          ...prev,
          [conversationId]: data,
        }));
        // Mark as read in backend & reset unread count locally
        await api.put(`/conversations/${conversationId}/read`);
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );

        // Find other member and emit mark_read over socket
        const conv = conversations.find((c) => c.id === conversationId);
        if (conv?.otherMember?.id && socket) {
          socket.emit('mark_read', { conversationId, senderId: conv.otherMember.id });
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    },
    [token, socket, conversations]
  );

  // 3. Start or retrieve a conversation with a recipient
  const startConversationWithUser = useCallback(
    async (recipientId: string): Promise<string> => {
      const conv = await api.post<Conversation>('/conversations', { recipientId });
      await fetchConversations();
      return conv.id;
    },
    [fetchConversations]
  );

  // 4. Initialize Socket.IO connection
  useEffect(() => {
    if (!token || !user) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const socketUrl =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin;

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[SocketContext] Connected to socket server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[SocketContext] Disconnected from socket server');
      setConnected(false);
    });

    // Presence update
    newSocket.on('user_presence', (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.userId]: { isOnline: data.isOnline, lastSeen: data.lastSeen },
      }));
    });

    // Typing update
    newSocket.on('user_typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: data.isTyping,
      }));
    });

    // Event: receive_message
    newSocket.on('receive_message', (payload: { message: Message; conversationId: string }) => {
      const { message, conversationId } = payload;

      // Update message list
      setMessages((prev) => {
        const list = prev[conversationId] || [];
        if (list.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          [conversationId]: [...list, message],
        };
      });

      // Auto-emit mark_delivered back to sender
      newSocket.emit('mark_delivered', {
        messageId: message.id,
        conversationId,
        senderId: message.senderId,
      });

      // If this conversation is currently open, mark read immediately
      if (activeConvIdRef.current === conversationId) {
        newSocket.emit('mark_read', {
          conversationId,
          senderId: message.senderId,
        });
      }

      // Update conversation list item
      setConversations((prev) => {
        const isActive = activeConvIdRef.current === conversationId;
        const exists = prev.some((c) => c.id === conversationId);

        if (!exists) {
          fetchConversations();
          return prev;
        }

        return prev
          .map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                lastMessage: {
                  content: message.content,
                  createdAt: message.createdAt,
                  senderId: message.senderId,
                },
                unreadCount: isActive ? 0 : c.unreadCount + 1,
                updatedAt: message.createdAt,
              };
            }
            return c;
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    });

    // Event: message_ack
    newSocket.on('message_ack', (payload: { tempId: string; message: Message }) => {
      const { tempId, message } = payload;
      const convId = message.conversationId;

      setMessages((prev) => {
        const list = prev[convId] || [];
        const updated = list.map((m) => (m.tempId === tempId ? message : m));
        return { ...prev, [convId]: updated };
      });
    });

    // Event: message_status_update (DELIVERED or READ)
    newSocket.on(
      'message_status_update',
      (payload: { messageId?: string; conversationId: string; status: 'DELIVERED' | 'READ'; readerId?: string }) => {
        const { messageId, conversationId, status } = payload;

        setMessages((prev) => {
          const list = prev[conversationId] || [];
          const updated: Message[] = list.map((m) => {
            if (messageId && m.id === messageId) {
              return { ...m, status: status as MessageStatus };
            }
            if (!messageId && status === 'READ' && m.senderId === user.id) {
              return { ...m, status: 'READ' as MessageStatus };
            }
            return m;
          });
          return { ...prev, [conversationId]: updated };
        });
      }
    );

    setSocket(newSocket);
    fetchConversations();

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, fetchConversations]);

  // Typing helper emitters
  const sendTypingStart = useCallback(
    (conversationId: string, recipientId: string) => {
      if (socket) {
        socket.emit('typing_start', { conversationId, recipientId });
      }
    },
    [socket]
  );

  const sendTypingStop = useCallback(
    (conversationId: string, recipientId: string) => {
      if (socket) {
        socket.emit('typing_stop', { conversationId, recipientId });
      }
    },
    [socket]
  );

  // Send message
  const sendMessage = useCallback(
    (conversationId: string, recipientId: string, content: string) => {
      if (!socket || !user || !content.trim()) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const trimmedContent = content.trim();

      const optimisticMsg: Message = {
        id: tempId,
        tempId,
        conversationId,
        senderId: user.id,
        sender: { id: user.id, name: user.name, avatar: user.avatar || undefined },
        content: trimmedContent,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), optimisticMsg],
      }));

      setConversations((prev) =>
        prev
          .map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                lastMessage: {
                  content: trimmedContent,
                  createdAt: optimisticMsg.createdAt,
                  senderId: user.id,
                },
                updatedAt: optimisticMsg.createdAt,
              };
            }
            return c;
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );

      socket.emit('send_message', {
        tempId,
        conversationId,
        recipientId,
        content: trimmedContent,
      });
    },
    [socket, user]
  );

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <SocketContext.Provider
      value={{
        connected,
        conversations,
        activeConversationId,
        setActiveConversation: setActiveConversationId,
        messages,
        sendMessage,
        fetchConversations,
        loadMessages,
        startConversationWithUser,
        activeConversation,
        onlineUsers,
        typingUsers,
        sendTypingStart,
        sendTypingStop,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
