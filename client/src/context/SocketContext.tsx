import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { Conversation, Message, MessageStatus, GroupMember, MemberRole } from '../types/chat';

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
  sendMessage: (conversationId: string, recipientId: string | undefined, content: string) => void;
  fetchConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  startConversationWithUser: (recipientId: string) => Promise<string>;
  activeConversation: Conversation | null;
  onlineUsers: Record<string, UserPresence>;
  typingUsers: Record<string, boolean>; // conversationId -> isTyping
  typingUsersList: Record<string, string[]>; // conversationId -> array of user names/IDs typing
  sendTypingStart: (conversationId: string, recipientId?: string) => void;
  sendTypingStop: (conversationId: string, recipientId?: string) => void;
  groupMembers: Record<string, GroupMember[]>;
  fetchGroupInfo: (conversationId: string) => Promise<Conversation | null>;
  createGroupChat: (name: string, memberIds: string[], description?: string, avatar?: string) => Promise<string>;
  addGroupMember: (conversationId: string, userId: string) => Promise<void>;
  removeGroupMember: (conversationId: string, userId: string) => Promise<void>;
  updateMemberRole: (conversationId: string, userId: string, role: MemberRole) => Promise<void>;
  updateGroupInfo: (conversationId: string, data: { name?: string; description?: string; avatar?: string }) => Promise<void>;
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
  const [typingUsersList, setTypingUsersList] = useState<Record<string, string[]>>({});
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMember[]>>({});

  const activeConvIdRef = useRef<string | null>(null);
  activeConvIdRef.current = activeConversationId;

  // 1. Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Conversation[]>('/conversations');
      setConversations(data);

      // Fetch initial presence for all 1-on-1 contacts
      const contactIds = data
        .map((c) => c.otherMember?.id)
        .filter((id): id is string => Boolean(id));

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

        // Find other member and emit mark_read over socket (for 1-on-1)
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

  // 3. Start or retrieve a 1-on-1 conversation
  const startConversationWithUser = useCallback(
    async (recipientId: string): Promise<string> => {
      const conv = await api.post<Conversation>('/conversations', { recipientId });
      await fetchConversations();
      return conv.id;
    },
    [fetchConversations]
  );

  // 4. Fetch group details and members
  const fetchGroupInfo = useCallback(async (conversationId: string): Promise<Conversation | null> => {
    try {
      const data = await api.get<Conversation>(`/conversations/${conversationId}`);
      if (data.members) {
        setGroupMembers((prev) => ({ ...prev, [conversationId]: data.members! }));
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch group info:', err);
      return null;
    }
  }, []);

  // 5. Create Group Chat
  const createGroupChat = useCallback(
    async (name: string, memberIds: string[], description?: string, avatar?: string): Promise<string> => {
      const data = await api.post<Conversation>('/conversations/group', {
        name,
        memberIds,
        description,
        avatar,
      });
      await fetchConversations();
      if (socket) {
        socket.emit('join_conversation', { conversationId: data.id });
      }
      return data.id;
    },
    [fetchConversations, socket]
  );

  // 6. Add group member
  const addGroupMember = useCallback(
    async (conversationId: string, targetUserId: string) => {
      const res = await api.post<{ members: GroupMember[] }>(`/conversations/${conversationId}/members`, {
        userId: targetUserId,
      });
      if (res.members) {
        setGroupMembers((prev) => ({ ...prev, [conversationId]: res.members }));
      }
      await fetchConversations();
    },
    [fetchConversations]
  );

  // 7. Remove group member
  const removeGroupMember = useCallback(
    async (conversationId: string, targetUserId: string) => {
      const res = await api.delete<{ ok: boolean; members: GroupMember[] }>(
        `/conversations/${conversationId}/members/${targetUserId}`
      );
      if (res.members) {
        setGroupMembers((prev) => ({ ...prev, [conversationId]: res.members }));
      }
      await fetchConversations();
    },
    [fetchConversations]
  );

  // 8. Update member role
  const updateMemberRole = useCallback(
    async (conversationId: string, targetUserId: string, role: MemberRole) => {
      const res = await api.put<{ ok: boolean; members: GroupMember[] }>(
        `/conversations/${conversationId}/members/${targetUserId}/role`,
        { role }
      );
      if (res.members) {
        setGroupMembers((prev) => ({ ...prev, [conversationId]: res.members }));
      }
    },
    []
  );

  // 9. Update group info
  const updateGroupInfo = useCallback(
    async (conversationId: string, data: { name?: string; description?: string; avatar?: string }) => {
      await api.put(`/conversations/${conversationId}/info`, data);
      await fetchConversations();
    },
    [fetchConversations]
  );

  // 10. Initialize Socket.IO connection
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
      if (data.userId === user.id) return;

      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: data.isTyping,
      }));

      setTypingUsersList((prev) => {
        const current = prev[data.conversationId] || [];
        if (data.isTyping) {
          if (!current.includes(data.userId)) {
            return { ...prev, [data.conversationId]: [...current, data.userId] };
          }
        } else {
          return { ...prev, [data.conversationId]: current.filter((id) => id !== data.userId) };
        }
        return prev;
      });
    });

    // Group member update
    newSocket.on('group_member_update', (payload: { conversationId: string; members: GroupMember[] }) => {
      setGroupMembers((prev) => ({
        ...prev,
        [payload.conversationId]: payload.members,
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.conversationId
            ? {
                ...c,
                groupInfo: c.groupInfo
                  ? { ...c.groupInfo, memberCount: payload.members.length }
                  : null,
              }
            : c
        )
      );
    });

    // Group info update
    newSocket.on(
      'group_info_update',
      (payload: { conversationId: string; name?: string; description?: string; avatar?: string }) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === payload.conversationId
              ? {
                  ...c,
                  name: payload.name ?? c.name,
                  description: payload.description !== undefined ? payload.description : c.description,
                  avatar: payload.avatar !== undefined ? payload.avatar : c.avatar,
                  groupInfo: c.groupInfo
                    ? {
                        ...c.groupInfo,
                        name: payload.name ?? c.groupInfo.name,
                        description:
                          payload.description !== undefined ? payload.description : c.groupInfo.description,
                        avatar: payload.avatar !== undefined ? payload.avatar : c.groupInfo.avatar,
                      }
                    : null,
                }
              : c
          )
        );
      }
    );

    // Group created event (for members invited to a new group)
    newSocket.on('group_created', ({ conversation }: { conversation: any }) => {
      fetchConversations();
      if (conversation?.id) {
        newSocket.emit('join_conversation', { conversationId: conversation.id });
      }
    });

    // Group removed event (when user is kicked from group)
    newSocket.on('group_removed', ({ conversationId }: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConvIdRef.current === conversationId) {
        setActiveConversationId(null);
      }
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

      // Auto-emit mark_delivered back to sender if not self
      if (message.senderId !== user.id) {
        newSocket.emit('mark_delivered', {
          messageId: message.id,
          conversationId,
          senderId: message.senderId,
        });
      }

      // If this conversation is currently open, mark read immediately
      if (activeConvIdRef.current === conversationId && message.senderId !== user.id) {
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
                  id: message.id,
                  content: message.content,
                  type: message.type,
                  createdAt: message.createdAt,
                  senderId: message.senderId,
                  sender: message.sender ? { id: message.sender.id, name: message.sender.name } : undefined,
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
    (conversationId: string, recipientId?: string) => {
      if (socket) {
        socket.emit('typing_start', { conversationId, recipientId });
      }
    },
    [socket]
  );

  const sendTypingStop = useCallback(
    (conversationId: string, recipientId?: string) => {
      if (socket) {
        socket.emit('typing_stop', { conversationId, recipientId });
      }
    },
    [socket]
  );

  // Send message
  const sendMessage = useCallback(
    (conversationId: string, recipientId: string | undefined, content: string) => {
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
        type: 'TEXT',
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
                  id: tempId,
                  content: trimmedContent,
                  type: 'TEXT' as const,
                  createdAt: optimisticMsg.createdAt,
                  senderId: user.id,
                  sender: { id: user.id, name: user.name },
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
        typingUsersList,
        sendTypingStart,
        sendTypingStop,
        groupMembers,
        fetchGroupInfo,
        createGroupChat,
        addGroupMember,
        removeGroupMember,
        updateMemberRole,
        updateGroupInfo,
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
