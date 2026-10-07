# Stack Research

**Domain:** Full-Stack Real-Time Messaging Application
**Researched:** 2026-10-07
**Confidence:** HIGH

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

```bash
# Backend Dependencies (server/)
npm install express socket.io cors dotenv jsonwebtoken bcryptjs multer cloudinary multer-storage-cloudinary prisma @prisma/client
npm install -D typescript tsx @types/express @types/node @types/cors @types/jsonwebtoken @types/bcryptjs @types/multer

# Frontend Dependencies (client/)
npm install react react-dom socket.io-client lucide-react date-fns @emoji-mart/react @emoji-mart/data
npm install -D typescript vite @vitejs/plugin-react tailwindcss postcss autoprefixer @types/react @types/react-dom
```

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

**If offline local development without Docker:**
- Use SQLite with Prisma as the local dev database (`provider = "sqlite"`), easily swappable to PostgreSQL via env var (`DATABASE_URL`).

**If rapid asset uploads without external Cloudinary credentials:**
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

---
*Stack research for: Full-Stack Real-Time Messaging Application*
*Researched: 2026-10-07*
