# Phase 4: Group Conversations & Member Management — Context

**Gathered:** 2026-10-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver end-to-end group chat creation, role-based member administration (add/remove/leave/promote), and group-room Socket.IO broadcasting so messages reach all active members.

## Core Requirements

- **GRP-01**: User can create a group conversation with a name, optional description/avatar, and initial member selection.
- **GRP-02**: Group admin can add new members to an existing group.
- **GRP-03**: Group admin can remove members; regular members can leave voluntarily.
- **GRP-04**: Group admin can promote/demote other members.
- **GRP-05**: Messages sent in a group are broadcast to all connected member rooms.
- **GRP-06**: Group info panel shows member list with admin badges and entry/exit system messages.

## Schema Changes Required

### Extend `Conversation` model
```prisma
name        String?      // group name
description String?      // optional tagline
avatar      String?      // group avatar (URL or SVG data URI)
createdBy   String?      // userId of creator
```

### Extend `ConversationMember` model
```prisma
role        MemberRole   @default(MEMBER)  // ADMIN | MEMBER
```

### New enum
```prisma
enum MemberRole {
  ADMIN
  MEMBER
}
```

### Message model — add optional `type` field for system messages
```prisma
type        MessageType  @default(TEXT)
// MessageType: TEXT | SYSTEM (system messages like "Alice added Bob")
```

## Architectural Decisions

1. **Socket Room**: Group members join `conv:<conversationId>` on connection. `send_message` already broadcasts to this room — no new event needed for delivery; groups use the same `receive_message` event.
2. **Admin Authorization**: Server validates `ConversationMember.role === 'ADMIN'` before allowing add/remove/promote operations.
3. **System Messages**: Add/remove/leave/promote actions generate a `type: SYSTEM` message stored in DB and broadcast so all members see activity notifications inline.
4. **Group vs 1-on-1**: `Conversation.isGroup` flag distinguishes group from direct chats. The `otherMember` field in REST responses is omitted for groups; instead a `groupInfo` object is returned.
5. **Auto-join rooms**: On socket connection, user must join all conversation rooms. Currently only done on `join_conversation` event — server should auto-join all active conversations on connect to ensure group messages are received.

## API Surface

### REST Endpoints
- `POST /api/conversations/group` — create group (name, memberIds[], optional avatar/description)
- `GET /api/conversations/:id` — full conversation detail (members, group info)
- `POST /api/conversations/:id/members` — add member (admin only)
- `DELETE /api/conversations/:id/members/:userId` — remove/kick member (admin or self)
- `PUT /api/conversations/:id/members/:userId/role` — promote/demote (admin only)
- `PUT /api/conversations/:id/info` — edit group name/description/avatar (admin only)

### Socket Events
- `join_all_conversations` — client emits on connect; server joins all user's conversation rooms
</domain>
