import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { Conversation, Message } from '../types/chat';

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
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  
  const activeConvIdRef = useRef<string | null>(null);
  activeConvIdRef.current = activeConversationId;

  // 1. Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Conversation[]>('/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [token]);

  // 2. Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
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
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [token]);

  // 3. Start or retrieve a conversation with a recipient
  const startConversationWithUser = useCallback(async (recipientId: string): Promise<string> => {
    const conv = await api.post<Conversation>('/conversations', { recipientId });
    await fetchConversations();
    return conv.id;
  }, [fetchConversations]);

  // 4. Initialize Socket.IO connection
  useEffect(() => {
    if (!token || !user) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
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

    // Event: receive_message
    newSocket.on('receive_message', (payload: { message: Message; conversationId: string }) => {
      const { message, conversationId } = payload;

      // Update message list for this conversation
      setMessages((prev) => {
        const list = prev[conversationId] || [];
        // Deduplicate if already exists
        if (list.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          [conversationId]: [...list, message],
        };
      });

      // Update conversation list item
      setConversations((prev) => {
        const isActive = activeConvIdRef.current === conversationId;
        const exists = prev.some((c) => c.id === conversationId);

        if (!exists) {
          // Refresh list to grab new conversation
          fetchConversations();
          return prev;
        }

        return prev.map((c) => {
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
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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

    setSocket(newSocket);
    fetchConversations();

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, fetchConversations]);

  // 5. Send message with optimistic update
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

      // Append optimistic bubble immediately
      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), optimisticMsg],
      }));

      // Update last message in sidebar immediately
      setConversations((prev) =>
        prev.map((c) => {
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
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );

      // Emit to server
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
