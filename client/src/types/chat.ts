export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ';

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  email?: string;
  phone?: string;
  lastSeen?: string;
}

export interface Message {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  sender?: ChatUser;
  content: string;
  status: MessageStatus;
  createdAt: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  otherMember: ChatUser;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
}
