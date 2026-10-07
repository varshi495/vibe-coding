export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ';
export type MemberRole = 'ADMIN' | 'MEMBER';
export type MessageType = 'TEXT' | 'SYSTEM';

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  email?: string;
  phone?: string;
  lastSeen?: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  avatar?: string;
  status?: string;
  lastSeen?: string;
  role: MemberRole;
  joinedAt: string;
}

export interface GroupInfo {
  name: string;
  description?: string | null;
  avatar?: string | null;
  memberCount: number;
}

export interface Message {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  sender?: ChatUser;
  content: string;
  type?: MessageType;
  status: MessageStatus;
  createdAt: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string | null;
  description?: string | null;
  avatar?: string | null;
  createdBy?: string | null;
  otherMember?: ChatUser | null;
  groupInfo?: GroupInfo | null;
  members?: GroupMember[];
  lastMessage?: {
    id?: string;
    content: string;
    type?: MessageType;
    createdAt: string;
    senderId: string;
    sender?: { id: string; name: string };
  } | null;
  unreadCount: number;
  updatedAt: string;
}
