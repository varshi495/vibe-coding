# Architecture Research

**Domain:** Full-Stack Real-Time Messaging Application
**Researched:** 2026-10-07
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 React Client Layer (Vite + TS)              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Chat Sidebar │  │ Active Chat  │  │ Media/Voice Input │  │
│  │ (List/Search)│  │ (Bubbles/Rxn)│  │ (Recorder/Upload) │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         │                 │                    │            │
├─────────┴─────────────────┴────────────────────┴────────────┤
│           Real-Time & API Integration (HTTP + Socket.IO)    │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐    ┌─────────────────────────┐  │
│  │ REST Endpoints         │    │ Socket.IO Event Engine  │  │
│  │ (/auth, /upload, /chat)│    │ (rooms, presence, ack)  │  │
│  └───────────┬────────────┘    └───────────┬─────────────┘  │
├──────────────┴─────────────────────────────┴────────────────┤
│                    Express.js Backend Core                  │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐    ┌─────────────────────────┐  │
│  │ Controllers & Services │    │ Auth Middleware (JWT)   │  │
│  └───────────┬────────────┘    └───────────┬─────────────┘  │
├──────────────┴─────────────────────────────┴────────────────┤
│                 Data & Object Storage Layer                 │
│  ┌────────────────────────┐    ┌─────────────────────────┐  │
│  │ Database (Prisma/PG)   │    │ Cloud Media (Cloudinary)│  │
│  └────────────────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Auth Controller & Service | User signup, login verification, token generation, user profiles | bcryptjs + jsonwebtoken |
| Socket Handler / Manager | Socket authentication, room management, user status (online/offline), typing triggers, message routing | Socket.IO server namespaces & room broadcasts |
| Conversation Service | Managing 1-on-1 and group conversation membership, unread counts, pinning/archiving | Prisma queries with membership relations |
| Message Service | Storing messages, resolving replies, soft-deletion, reactions, and updating delivery/read statuses | Relational queries + real-time socket events |
| Media / Upload Service | Handling file uploads, validating file size/MIME types, storing in CDN | Multer + Cloudinary SDK (with local disk fallback for dev) |

## Recommended Project Structure

```
chat-app/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── auth/          # Login, Register, ProfileEdit
│       │   ├── chat/          # ChatArea, MessageBubble, MessageInput, ReactionPicker
│       │   ├── sidebar/       # ConversationList, ConversationItem, SearchBar, NewChatModal
│       │   ├── common/        # Avatar, Badge, Modal, Tooltip, AudioPlayer
│       │   └── layout/        # ResponsiveLayout, MobileNavigation
│       ├── context/           # AuthContext, SocketContext, ChatContext
│       ├── hooks/             # useSocket, useTyping, useAudioRecorder, useMediaQuery
│       ├── services/          # api.ts, authService.ts, chatService.ts, uploadService.ts
│       ├── types/             # chat.ts, user.ts, socketEvents.ts
│       └── utils/             # dateFormatter.ts, soundEffects.ts
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma      # Models: User, Conversation, Member, Message, MessageStatus
│   └── src/
│       ├── config/            # environment, cloudinary, db
│       ├── controllers/       # authController, chatController, messageController, userController
│       ├── middleware/        # authMiddleware, uploadMiddleware, errorHandler
│       ├── routes/            # authRoutes, chatRoutes, messageRoutes, userRoutes
│       ├── sockets/           # socketManager, chatHandler, presenceHandler
│       ├── services/          # db queries, notification services
│       ├── types/             # shared event contracts and types
│       └── server.ts          # Express + HTTP Server + Socket.IO initialization
│
└── README.md
```

## Architectural Patterns

### Pattern 1: Optimistic UI Updates with Server Acknowledgment

**What:** When a user sends a message, append it immediately to the local conversation state with a `status: 'sending'` indicator, then update to `sent` once the server socket confirms receipt.
**When to use:** All messaging applications to provide zero-latency feel.
**Trade-offs:** Requires rollback or error badge if network fails.

### Pattern 2: Event-Driven Room Scoping in Socket.IO

**What:** Each conversation has a room `conversation:<id>`. When a user connects and authenticates, they join rooms for all their active conversations. Each user also joins their personal user room `user:<userId>` for direct notifications.
**When to use:** Multi-user and 1-on-1 event routing.

## Data Flow

### Message Send & Delivery Flow

```
[User Types & Clicks Send]
    ↓ (Immediate Optimistic Render on Sender Screen)
[Client emits: 'send_message']
    ↓
[Server: Validates JWT & Member Permission]
    ↓
[Server: Saves Message to Database]
    ↓
[Server emits: 'new_message' to room conversation:<id>]
    ↓
[Recipient Client receives: 'new_message']
    ↓
[Recipient Client emits: 'mark_delivered']
    ↓
[Server updates DB MessageStatus & emits: 'message_delivered' to Sender]
```

---
*Architecture research for: Full-Stack Real-Time Messaging Application*
*Researched: 2026-10-07*
