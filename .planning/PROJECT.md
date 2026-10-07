# Real-Time Messaging Application (WhatsApp Inspired)

## What This Is

A modern, full-stack real-time messaging application inspired by WhatsApp featuring a responsive, clean interface. It enables seamless one-to-one and group communication with real-time text, rich media sharing, delivery/read receipts, typing indicators, user presence, and modern interactive chat features.

## Core Value

Instant, reliable real-time communication with zero latency perception and fluid responsive messaging experience across desktop and mobile.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Authentication**: User registration, login (email/phone), profile management (name, avatar, status bio), secure bcrypt password hashing, JWT sessions, and logout.
- [ ] **1-on-1 Real-Time Chat**: Direct instant messaging powered by WebSockets/Socket.IO with message timestamps, real-time message bubbles, and unread badges.
- [ ] **Group Chat**: Group creation, admin controls, member management (add/remove/leave), group name, avatar, and description.
- [ ] **Presence & Indicators**: Real-time online/offline presence, last seen status, live typing indicators, and message delivery/read checkmarks (sent, delivered, read).
- [ ] **Media & File Sharing**: Upload and direct in-chat display for images, videos, audio/voice notes, and documents/files with size and type validation.
- [ ] **Interactive Messaging Features**: Message replies (quote reply), editing and deleting messages, emoji picker, reactions (👍 ❤️ 😂 😮 😢), message forwarding, and unread separator.
- [ ] **Conversation Management**: Pin chats, archive chats, mute notifications, block users, clear chat history, and delete conversations.
- [ ] **Search System**: Global and in-conversation search for messages, contacts, and groups.
- [ ] **Notifications**: In-app sounds, desktop/browser notifications, unread counters, and @mention alerts in groups.
- [ ] **Responsive & Modern UI**: WhatsApp-inspired dual-panel desktop layout, dedicated mobile view switching (chat list vs active conversation), dark/light mode, smooth animations, and empty/loading states.

### Out of Scope

- End-to-end encryption (E2EE) with Signal protocol — Deferred to a future security-focused milestone to prioritize real-time core architecture.
- WebRTC video/voice calls — Deferred to post-v1 roadmap to maintain tight focus on messaging and media sharing.
- WhatsApp proprietary branding/logos — Explicitly excluded to maintain an original, custom modern design identity.

## Context

- Full-stack TypeScript architecture with React client and Node/Express server.
- High-concurrency real-time WebSocket communication managed via Socket.IO.
- Structured relational or document database model separating Users, Conversations, Members, Messages, and Delivery Statuses.
- Object storage integration (e.g. Cloudinary / S3-compatible) for resilient media delivery.

## Constraints

- **Tech Stack**: React + TypeScript + Tailwind CSS on the frontend; Node.js + Express + TypeScript + Socket.IO on the backend.
- **Security**: JWT authentication, bcrypt password hashing, input validation, rate limiting, and sanitization against XSS/injection.
- **Responsiveness**: Strict mobile-first responsiveness (conditional view switching on small viewports rather than cramped dual panes).
- **Design Independence**: Original aesthetic avoiding proprietary WhatsApp trademarks while retaining intuitive UX familiarity.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + TypeScript + Tailwind CSS | Type safety, rapid UI development, clean modular components | — Pending |
| Node.js + Express + TypeScript + Socket.IO | High real-time throughput, event-driven architecture, shared TypeScript types | — Pending |
| PostgreSQL / MongoDB with explicit relational schemas | Clean tracking of conversation memberships and per-user message delivery statuses | — Pending |
| Cloudinary / Object Storage for attachments | Fast CDN delivery and optimized image/media handling without overloading API server | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-07 after initialization*
