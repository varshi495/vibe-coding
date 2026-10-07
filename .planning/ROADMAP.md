# Roadmap: Real-Time Messaging Application (WhatsApp Inspired)

## Overview

Build a modern, full-stack real-time messaging application inspired by WhatsApp through an iterative Vertical MVP slice approach. Beginning with foundational authentication and secure data models, each phase delivers an end-to-end working capability: 1-on-1 real-time messaging, presence and delivery receipts, group conversations, media attachments and voice notes, interactive message actions (reactions, replies, edits), organization and notifications, and concluding with responsive mobile layout polish and dark/light theming.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Core Foundation & User Authentication** - Full-stack project setup, Prisma database models, JWT authentication, and user profile management.
- [ ] **Phase 2: Real-Time Socket Architecture & 1-on-1 Messaging** - Socket.IO real-time transport, direct chat rooms, optimistic message rendering, and message history.
- [ ] **Phase 3: Presence, Typing Indicators & Delivery/Read Status** - Live online/offline presence, last seen timestamps, debounced typing feedback, and checkmark read receipts.
- [ ] **Phase 4: Group Conversations & Member Management** - Group chat creation, group admin management, member add/remove, and group room broadcasting.
- [ ] **Phase 5: Media Sharing, File Attachments & Voice Notes** - Media upload pipeline, in-chat image/doc previews, Web MediaRecorder voice note recording and audio playback.
- [ ] **Phase 6: Interactive Message Controls** - Emoji reactions, quote-replies, message editing, deletion tombstones, and message forwarding.
- [ ] **Phase 7: Search, Organization & Notifications** - Pinned/archived chats, mute, user blocking, contact & message search, sound chimes, and browser notifications.
- [ ] **Phase 8: Responsive Layout, Dark/Light Mode & Polishing** - Desktop dual-pane vs mobile view-swapping layout, dark/light theme, skeleton loaders, and verification.

## Phase Details

### Phase 1: Core Foundation & User Authentication
**Goal:** Deliver a functional, secure end-to-end user registration, login, JWT session persistence, and profile management slice with React client and Node/Express server.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can register with email/phone, display name, and password, with password securely hashed via bcrypt.
  2. User can log in, receive a valid JWT token, and remain authenticated across page refreshes.
  3. User can view and update their profile avatar, display name, and status bio.
  4. User can log out, clearing their stored session and returning to the login screen.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Express + TypeScript backend scaffold, Prisma relational models, bcrypt hashing, JWT auth routes, and profile API.
- [ ] 01-02: React + Vite + Tailwind client scaffold, AuthContext, login/registration views, profile editor, and protected route wrapper.

### Phase 2: Real-Time Socket Architecture & 1-on-1 Messaging
**Goal:** Deliver real-time bidirectional direct text messaging with instant optimistic message bubbles and conversation history over Socket.IO.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06
**Success Criteria** (what must be TRUE):
  1. User can start a 1-on-1 conversation with another registered user.
  2. Sending a message displays an optimistic message bubble immediately before server round-trip.
  3. Recipient receives new messages in real time without refreshing the page.
  4. Conversation list displays the latest message preview, formatted timestamp, and unread count badge.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Socket.IO server initialization, JWT socket handshake middleware, direct message events, and database persistence.
- [ ] 02-02: SocketContext client integration, ChatList sidebar, ActiveChat bubble feed, and optimistic message dispatch.

### Phase 3: Presence, Typing Indicators & Delivery/Read Status
**Goal:** Deliver live user presence (online/last seen), debounced typing indicators, and sent/delivered/read receipt checkmarks.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04, STAT-05
**Success Criteria** (what must be TRUE):
  1. User sees real-time green/online indicator when a contact connects, and "Last seen at [time]" when disconnected.
  2. When a contact types in the active chat, a debounced "Typing..." indicator appears and dismisses within 3 seconds of inactivity.
  3. Sent messages show a single checkmark on server acknowledgment.
  4. Delivered messages show a double checkmark, turning into blue double checkmarks once the recipient views the conversation.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Socket.IO presence tracker, disconnect lastSeen recorder, transient typing broadcaster, and MessageStatus receipt updates.
- [ ] 03-02: Client presence hooks, typing bubble indicator, and checkmark receipt status components (single, double, blue double).

### Phase 4: Group Conversations & Member Management
**Goal:** Deliver end-to-end group chat creation, role-based member administration (add/remove/leave), and group broadcast messaging.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: GRP-01, GRP-02, GRP-03, GRP-04, GRP-05, GRP-06
**Success Criteria** (what must be TRUE):
  1. User can create a group with a custom title, description, avatar, and selected participants.
  2. Group administrator can add members, remove members, and edit group info.
  3. Regular members can view member list with admin badges and leave the group.
  4. Messages sent to the group room broadcast to all active members with sender display name and avatar chip.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Group conversation API endpoints, admin authorization middleware, group membership mutators, and group room socket events.
- [ ] 04-02: New Group modal, Group Info drawer with member list management, and group message bubble rendering with sender avatars.

### Phase 5: Media Sharing, File Attachments & Voice Notes
**Goal:** Deliver rich media messaging including in-chat image/video/document previews, file size validation, and Web MediaRecorder voice note recording & playback.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: MED-01, MED-02, MED-03, MED-04, MED-05, MED-06
**Success Criteria** (what must be TRUE):
  1. User can attach and upload images, rendered with image preview and full-screen lightbox modal.
  2. User can attach and play inline video files.
  3. User can upload documents and files with file-type icon, size tag, and one-click download.
  4. User can record voice notes directly in the browser and send them with a playable audio waveform widget.
  5. Uploads exceeding 25MB or disallowed MIME types are rejected with descriptive error notifications.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Multer upload middleware, Cloudinary/local media service, attachment validation, and media message DB persistence.
- [ ] 05-02: Client attachment picker, image/video/doc preview components, and Web Audio MediaRecorder voice note recording UI.

### Phase 6: Interactive Message Controls
**Goal:** Deliver interactive message operations: emoji reactions with counters, quoted replies, edit with timestamps, deletion tombstones, and message forwarding.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06
**Success Criteria** (what must be TRUE):
  1. User can hover/tap a message to react with emojis (👍 ❤️ 😂 😮 😢), updating reaction badge counters in real time.
  2. User can quote-reply to a message, displaying parent message author and text preview above the draft and sent bubble.
  3. User can edit their sent messages, displaying an "(edited)" label on the updated bubble.
  4. User can delete a message, replacing content with "This message was deleted" tombstone.
  5. User can open an emoji keyboard to insert emojis into the draft text.
  6. User can forward a message to another active conversation.
**Plans**: 2 plans

Plans:
- [ ] 06-01: Message reactions, edits, soft-delete tombstones, and forwarding endpoints + Socket.IO broadcast handlers.
- [ ] 06-02: Bubble action dropdown (reply, edit, delete, forward), EmojiMart reaction bar, and quoted reply preview banner.

### Phase 7: Search, Organization & Notifications
**Goal:** Deliver conversation pinning, archiving, mute alerts, user blocking, contact & message search, sound chimes, and browser notifications.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04
**Success Criteria** (what must be TRUE):
  1. User can pin chats to remain pinned at the top of the sidebar.
  2. User can archive conversations and access them via an "Archived" section.
  3. User can search contacts and conversation titles in the sidebar, and search message history in the active chat.
  4. User can mute conversations and block/unblock users.
  5. Incoming messages play an audio chime and trigger a browser push notification when the app is in the background.
**Plans**: 2 plans

Plans:
- [ ] 07-01: User conversation preferences (pin, archive, mute, block), text search API, and notification sound assets.
- [ ] 07-02: Sidebar pin/archive filter tabs, in-chat keyword search bar, and Web Notification API integration.

### Phase 8: Responsive Layout, Dark/Light Mode & Polishing
**Goal:** Deliver WhatsApp-inspired dual-panel desktop view, mobile view-swapping navigation with back button, dark/light theme, skeleton loaders, and verification.
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. On viewports >= 768px, layout displays a clean dual-panel WhatsApp-inspired sidebar and active conversation area.
  2. On mobile screens (< 768px), view cleanly toggles between full-screen chat list and full-screen active chat with a Back button.
  3. Dark mode and light mode toggle smoothly with harmonious slate/emerald palettes.
  4. Skeleton loaders and clean empty states appear during initial fetch.
  5. Full end-to-end user workflows operate smoothly without console errors or race conditions.
**Plans**: 2 plans

Plans:
- [ ] 08-01: Responsive container & mobile navigation state manager, ThemeContext dark/light switcher, and loading skeleton states.
- [ ] 08-02: Full end-to-end validation, sound & animation polish, build optimization, and comprehensive README documentation.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Foundation & User Authentication | 0/2 | Not started | - |
| 2. Real-Time Socket Architecture & 1-on-1 Messaging | 0/2 | Not started | - |
| 3. Presence, Typing Indicators & Delivery/Read Status | 0/2 | Not started | - |
| 4. Group Conversations & Member Management | 0/2 | Not started | - |
| 5. Media Sharing, File Attachments & Voice Notes | 0/2 | Not started | - |
| 6. Interactive Message Controls | 0/2 | Not started | - |
| 7. Search, Organization & Notifications | 0/2 | Not started | - |
| 8. Responsive Layout, Dark/Light Mode & Polishing | 0/2 | Not started | - |
