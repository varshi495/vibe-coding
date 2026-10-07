# Walking Skeleton — Real-Time Messaging Application (WhatsApp Inspired)

**Phase:** 1
**Generated:** 2026-10-07

## Capability Proven End-to-End

A user can register an account with email/phone, receive a secure JWT session, persist authentication across browser refresh, update their profile (name, avatar, status bio), and securely log out on a responsive React interface powered by an Express and Prisma backend.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend Framework | React 18 + Vite + TypeScript | Modern, high-performance SPA foundation ideal for real-time chat state management |
| Styling | Tailwind CSS (v3.4) | Flexible utility tokens implementing WhatsApp-inspired dark/light palettes without CSS bloat |
| Backend Server | Node.js + Express + TypeScript | Fast event-driven server runtime, type-safe API contracts shared with client |
| Database & ORM | Prisma ORM + SQLite (dev) / PostgreSQL (prod) | Type-safe schema migrations, structured relational data models for users & chat memberships |
| Auth & Security | JWT (7-day Bearer token in localStorage) + bcryptjs (10 rounds) | Stateless auth easily shared across REST requests and Socket.IO connection handshakes |
| Monorepo Structure | `server/` and `client/` folders with root dev scripts | Clean separation of concerns with unified root development and build commands |

## Stack Touched in Phase 1

- [x] Project scaffold (server with tsx/prisma, client with vite/react/tailwind)
- [x] Routing — Express REST API (`/api/auth/*`) and React client state views
- [x] Database — Real SQLite database read & write via Prisma models
- [x] UI — Interactive WhatsApp-inspired glassmorphic auth cards and profile drawer
- [x] Local Full-Stack Run — Concurrent execution of client (5173) and server (5000)

## Out of Scope (Deferred to Later Slices)

- WebSockets and Socket.IO real-time event loops (Phase 2)
- Presence indicators, typing status, and read checkmarks (Phase 3)
- Group conversation models and room dispatch (Phase 4)
- Cloudinary media transcoding and audio recording (Phase 5)
- Message reactions, replies, and edits (Phase 6)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Real-time Socket.IO direct messaging (1-on-1 chats)
- Phase 3: Live presence, debounced typing, and delivery/read receipts
- Phase 4: Group conversations and admin member management
- Phase 5: Media uploads (images, docs, video) and browser voice note recording
- Phase 6: Emoji reactions, message quoting/replies, edits, and deletions
- Phase 7: Pinned/archived chats, mute, search, and notification chimes
- Phase 8: Mobile view-swapping polish, dark/light toggle, and E2E verification
