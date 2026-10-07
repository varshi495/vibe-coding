# Pitfalls Research

**Domain:** Full-Stack Real-Time Messaging Application
**Researched:** 2026-10-07
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Message Duplication & Out-of-Order Delivery

**What goes wrong:**
During reconnects or concurrent sends, messages can be duplicated in the database or rendered out of chronological sequence in the client.

**Why it happens:**
Clients re-emitting on network drops without client-generated idempotent message IDs (`tempId` / `clientMessageId`), or timestamps relying solely on client clocks rather than server creation timestamps.

**How to avoid:**
1. Generate unique client message IDs for optimistic rendering and server deduplication.
2. Order messages strictly by server `createdAt` timestamp (or auto-incrementing/ULID keys).
3. Client deduplicates by ID upon receiving broadcasts.

**Warning signs:**
Duplicate message bubbles appearing when toggling WiFi or on rapid message submissions.

**Phase to address:**
Phase 2 (Core Messaging & Real-Time Socket Architecture).

---

### Pitfall 2: Memory Leaks from Hanging Socket Listeners & Reconnection Storms

**What goes wrong:**
In React, re-mounting chat components without removing `.on('event')` listeners multiplies handlers, causing multiple sound chimes, duplicate state updates, and memory leaks.

**Why it happens:**
Failing to clean up event listeners in `useEffect` return functions or creating a new socket connection on every render.

**How to avoid:**
1. Maintain a single singleton socket instance managed via a top-level `SocketContext`.
2. Always clean up listeners in `useEffect` cleanup blocks (`socket.off('event', handler)`).

**Warning signs:**
React console warnings regarding memory leaks or event handlers firing 5-10 times for a single event.

**Phase to address:**
Phase 2 & Phase 3.

---

### Pitfall 3: Database Overload from High-Frequency Typing & Read Status Updates

**What goes wrong:**
Emitting database writes on every keystroke or every pixel scrolled overwhelms the DB connection pool.

**Why it happens:**
Developers mistakenly persisting transient events (typing state, cursor movement) into database tables instead of keeping them purely in-memory in Socket.IO broadcasts.

**How to avoid:**
1. Typing indicators should NEVER hit the database — only broadcast transiently across socket rooms with a 3-second debounce.
2. Read receipts should be batched or triggered when the chat window gains active focus, not on every individual message scroll.

**Warning signs:**
High DB CPU usage during simple conversations.

**Phase to address:**
Phase 3 (Presence, Typing & Status Receipts).

---

### Pitfall 4: Broken Mobile Responsiveness in Chat Panes

**What goes wrong:**
Attempting to force both sidebar (chats list) and main conversation pane into a small mobile viewport (< 768px), making both panels unreadable and cramped.

**Why it happens:**
Designing desktop-first and using simple responsive flex without conditional view routing or stateful drill-down.

**How to avoid:**
Implement view-swapping on mobile: when an active conversation is selected on mobile, hide the sidebar and render a full-screen chat with a Back button to return to the chat list.

**Warning signs:**
Chat input bar gets clipped by on-screen keyboard, or message bubbles are squished into thin columns on phone screens.

**Phase to address:**
Phase 5 (Responsive Layout & Polishing).

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing uploads on local disk | No cloud config needed | Fails in multi-instance/ephemeral hosting | Acceptable as local development fallback only |
| Skipping DB indexes on `conversationId` and `createdAt` | Saves 2 minutes of schema design | Slow queries on threads with > 500 messages | Never — index these foreign keys and timestamps from day one |
| Sending full user objects inside every message socket event | Avoids join queries | High network payload overhead | Never — send concise author summary (id, name, avatar) |

## "Looks Done But Isn't" Checklist

- [ ] **Socket Disconnect/Reconnect:** Does the client automatically rejoin conversation rooms after a brief disconnection?
- [ ] **Scroll Anchor:** Does sending or receiving a message automatically scroll to the bottom, without jumping when an older history page is loaded?
- [ ] **Audio Permissions:** Does the voice recorder handle microphone permission denial gracefully?
- [ ] **File Size Bounds:** Does the client reject files > 25MB before attempting network upload?
- [ ] **Empty Input:** Are messages with only spaces or empty strings prevented from sending?

---
*Pitfalls research for: Full-Stack Real-Time Messaging Application*
*Researched: 2026-10-07*
