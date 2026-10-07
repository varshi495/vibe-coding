<!-- GSD:project-start source:PROJECT.md -->

## Project

**Real-Time Messaging Application (WhatsApp Inspired)**

A modern, full-stack real-time messaging application inspired by WhatsApp featuring a responsive, clean interface. It enables seamless one-to-one and group communication with real-time text, rich media sharing, delivery/read receipts, typing indicators, user presence, and modern interactive chat features.

**Core Value:** Instant, reliable real-time communication with zero latency perception and fluid responsive messaging experience across desktop and mobile.

### Constraints

- **Tech Stack**: React + TypeScript + Tailwind CSS on the frontend; Node.js + Express + TypeScript + Socket.IO on the backend.
- **Security**: JWT authentication, bcrypt password hashing, input validation, rate limiting, and sanitization against XSS/injection.
- **Responsiveness**: Strict mobile-first responsiveness (conditional view switching on small viewports rather than cramped dual panes).
- **Design Independence**: Original aesthetic avoiding proprietary WhatsApp trademarks while retaining intuitive UX familiarity.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | ^18.3.1 | Frontend UI Library | Declarative UI, rich ecosystem for chat lists, virtualization, robust state synchronization. |
| TypeScript | ^5.5.0 | Type System (Full-Stack) | Shared contract types across client and server (events, message models, payloads) eliminates runtime boundary errors. |
| Tailwind CSS | ^3.4.10 | Styling Framework | Rapid responsive UI creation, custom animations, easy theme handling (dark/light), flexible chat bubbles. |
| Node.js & Express | ^20.x LTS / Express ^4.19.2 | Backend Application Server | Event-driven I/O model well-suited for WebSocket orchestration and RESTful auth/media endpoints. |
| Socket.IO | ^4.7.5 (server & client) | Real-Time Transport | Fallback to polling if WebSockets fail, built-in room abstractions (for 1-on-1 and groups), auto-reconnect, and heartbeat acknowledgment. |
| Prisma ORM + PostgreSQL | Prisma ^5.18.0 / pg ^8.12.0 | Primary Database & Schema Layer | Relational model is ideal for structured chat relationships (Conversations, Members, Messages, per-user MessageStatus receipts). SQLite can also serve as immediate local zero-setup dev fallback. |
| Cloudinary SDK | ^2.4.0 | Media Asset Management & CDN | Handles image, video, audio transcoding, thumbnail generation, and secure delivery without straining Node server bandwidth. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React | ^0.428.0 | Iconography | High-quality icons for chat actions, mic, attachments, checkmarks, emojis. |
| bcryptjs | ^2.4.3 | Password Hashing | Secure one-way hashing with salt rounds for user credential storage. |
| jsonwebtoken | ^9.0.2 | Session Token Management | Stateless authorization in HTTP Authorization headers and Socket.IO handshake auth. |
| multer & multer-storage-cloudinary | ^1.4.5-lts.1 | File Upload Middleware | Multi-part form handling for profile avatars and message attachments. |
| date-fns | ^3.6.0 | Date & Timestamp Formatting | Lightweight formatting of "last seen", "today at 10:45 AM", relative timestamps. |
| emoji-mart or @emoji-mart/react | ^1.1.1 | Emoji Picker Component | Rich, searchable emoji reaction and input keyboard. |
| howler.js or Native Web Audio API | ^2.2.4 | Notification Chimes | Low-latency audio playback for incoming message and sent notification sounds. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite | Frontend Bundler | Blazing fast HMR, TypeScript support, optimized production builds. |
| tsx / nodemon | Backend Dev Runner | Zero-config TypeScript execution with hot reload during development. |
| concurrently | Monorepo Process Runner | Single `npm run dev` script starts client and server concurrently. |

## Installation

# Backend Dependencies (server/)

# Frontend Dependencies (client/)

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Socket.IO | Pure WebSockets (`ws`) | When minimal protocol overhead is strictly required; Socket.IO is preferred for built-in reconnects, rooms, and fallbacks. |
| Prisma + PostgreSQL | MongoDB + Mongoose | If conversation documents are heavily unstructured; however, relational joins for read receipts and membership scale cleaner in relational DBs. |
| Cloudinary | AWS S3 + CloudFront | When enterprise cost at millions of uploads is the driver; Cloudinary is much faster for integrated image/video transformations. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Storing media files directly on local server disk in production | Disk fills up, ephemeral container instances lose uploads, slow asset serving | Cloudinary or S3 object storage |
| Plain WebSockets without heartbeats/reconnection logic | Disconnections in mobile view drop messages silently without notice | Socket.IO with reconnect event handlers & queueing |
| Storing plain text passwords or tokens in localStorage without expiration | Vulnerable to XSS and account compromise | bcrypt hashing, short-lived JWTs, and secure storage |
| Unbounded message queries (`SELECT * FROM messages`) | Memory exhaustion on long active chat threads | Cursor-based pagination (`limit` & `beforeId`) |

## Stack Patterns by Variant

- Use SQLite with Prisma as the local dev database (`provider = "sqlite"`), easily swappable to PostgreSQL via env var (`DATABASE_URL`).
- Implement a local filesystem fallback storage service behind a unified media service interface.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| socket.io@4.7.5 | socket.io-client@4.7.5 | Must share major version and CORS origins configuration |
| react@18.3.1 | lucide-react@0.428.0 | Compatible with standard React 18 hooks |
| prisma@5.18.0 | @prisma/client@5.18.0 | Must match exact versions |

## Sources

- Socket.IO official v4 production guides
- React & Vite official documentation
- Prisma ORM data modeling best practices for chat & receipts

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
