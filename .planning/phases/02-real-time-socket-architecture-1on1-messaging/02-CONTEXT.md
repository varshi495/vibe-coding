# Phase 2: Real-Time Socket Architecture & 1-on-1 Messaging — Context

**Gathered:** 2026-10-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver real-time bidirectional direct text messaging with instant optimistic message bubbles and conversation history over Socket.IO.

In scope: CHAT-01 through CHAT-06 — Conversation model in Prisma, Message model with delivery status, Socket.IO server initialization, authenticated socket handshake via JWT, direct 1-on-1 message events, message persistence to PostgreSQL, SocketContext client provider, ChatList sidebar, ActiveChat bubble feed with optimistic updates, unread message count badges, formatted timestamps.

Out of scope: Typing indicators and read receipts (Phase 3), Group conversations (Phase 4), Media uploads (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Database Schema
- D-01: Add Conversation model (id, isGroup=false, createdAt, updatedAt) with a ConversationMember join table (userId, conversationId, joinedAt, lastReadAt) and a Message model (id, conversationId, senderId, content, status[SENT|DELIVERED|READ], createdAt).
- D-02: lastReadAt on ConversationMember drives unread count: count messages where createdAt > lastReadAt AND senderId != self.

### Socket.IO Transport
- D-03: Socket.IO v4.7 initialized on the same HTTP server as Express. Authenticated via JWT in auth.token handshake.
- D-04: Each authenticated socket joins personal room keyed by userId.
- D-05: Direct message targeting: server emits to recipient's personal room io.to(recipientId).emit('receive_message', payload).

### Message Events
- D-06: Event schema:
  - Client to Server: send_message { conversationId, recipientId, content }
  - Server to Sender: message_ack { tempId, message }
  - Server to Recipient: receive_message { message, conversationId }

### Optimistic Updates
- D-07: Client assigns tempId (UUID) to each outgoing message immediately and renders PENDING bubble. On message_ack replaced with confirmed message.

### Conversation Discovery
- D-08: REST GET /api/conversations returns conversation list with last message preview and unread count. POST /api/conversations creates/finds 1-on-1 by recipientId.
- D-09: REST GET /api/conversations/:id/messages?before=<cursor>&limit=50 returns paginated history.
- D-10: GET /api/users/search?q=<query> returns matching users for New Chat panel.

### Design System
- Stitch Obsidian Whisper design system. Project ID: 1052634907099569663.
- Canvas #0b141a, Panel #111b21, Elevated #202c33, Active #2a3942, Divider #222e35, Emerald #00a884, Sent bubble #005c4b, Text #e9edef, Muted #8696a0.

</decisions>

<canonical_refs>
## Canonical References

- .planning/PROJECT.md
- .planning/REQUIREMENTS.md (CHAT-01 through CHAT-06)
- server/src/server.ts — Express app export
- server/src/middleware/authMiddleware.ts — JWT verification to reuse in socket handshake
- server/src/config/jwt.ts — verifyToken() utility
- server/prisma/schema.prisma — PostgreSQL; add Conversation/Message models
- client/src/context/AuthContext.tsx — token in localStorage
- client/src/services/api.ts — REST client wrapper

</canonical_refs>

<code_context>
## Existing Code Insights

- Server: controllers/ + routes/ + middleware/. New: sockets/, services/
- Client: Context providers in context/. New: SocketContext.tsx. Components in components/chat/
- Prisma: UUID PKs, @updatedAt, createdAt @default(now())
- Socket auth: io({ auth: { token: localStorage.getItem('chat_token') } })

</code_context>

*Phase: 02-real-time-socket-architecture-1on1-messaging*
*Context gathered: 2026-10-07*
