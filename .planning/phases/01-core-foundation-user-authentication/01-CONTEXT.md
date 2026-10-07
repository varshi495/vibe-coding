# Phase 1: Core Foundation & User Authentication - Context

**Gathered:** 2026-10-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a functional, secure end-to-end user registration, login, JWT session persistence, and profile management slice with React client and Node/Express server.
In scope: AUTH-01 through AUTH-06 (User models in Prisma, bcrypt password hashing, JWT creation & verification, auth middleware, signup & login endpoints, profile updating, React Vite scaffold, Tailwind styling, AuthContext, login/signup forms, protected app shell).
Out of scope: Socket.IO connections (Phase 2), group models/APIs (Phase 4), cloud media uploads (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Identifier & Login Flow
- **D-01:** Either Email or Phone number accepted as primary identifier. The user registration model will accommodate both formats (validating email syntax or standard international phone format). Login endpoint accepts either identifier in a single login field.
- **D-02:** Password-based authentication with bcrypt hashing (10 salt rounds) for all user accounts. Instant, self-contained signup/login without external SMS gateway dependencies.

### Session & Token Handling (Agent Discretion)
- **D-03:** JWT token returned in JSON response upon login/signup and persisted in browser `localStorage`. REST API client sends `Authorization: Bearer <token>` header. This ensures seamless reuse during Phase 2 for the Socket.IO `auth: { token }` connection handshake.
- **D-04:** Token expiry set to 7 days with `/api/auth/me` profile verification on app startup to restore authentication state across page reloads.

### Profile Setup & Initial Display (Agent Discretion)
- **D-05:** Sensible default avatar (gradient tile with user initials) and default status bio ("Hey there! I am using ChatApp") created automatically on registration.
- **D-06:** Profile drawer/settings modal allows user to update display name, avatar URL (or local avatar upload), and status bio anytime.

### the agent's Discretion
- Database layer: Prisma schema with SQLite for immediate zero-config local development (`provider = "sqlite"`), with models structured to easily switch to PostgreSQL via `DATABASE_URL`.
- Password validation: Minimum 6 characters required.
- API structure: Clean RESTful endpoints (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context & Requirements
- `.planning/PROJECT.md` — Project definition, core value, and constraints
- `.planning/REQUIREMENTS.md` — Scoped v1 requirements AUTH-01 through AUTH-06
- `.planning/research/STACK.md` — Prescribed dependencies (Express, React 18, Vite, Tailwind CSS, Prisma, bcryptjs, jsonwebtoken)
- `.planning/research/ARCHITECTURE.md` — Client and server project directory structure and conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield project. No existing legacy components. Phase 1 sets the foundational conventions for the entire application.

### Established Patterns
- Client: React + TypeScript + Vite with Tailwind CSS. Single-page application using context providers (`AuthContext`).
- Server: Node.js + Express + TypeScript with `src/controllers`, `src/routes`, `src/middleware`, `src/services`, and Prisma ORM client.

### Integration Points
- Frontend API service (`client/src/services/api.ts`) connecting to Express backend (`http://localhost:5000/api`).
- Future integration in Phase 2: Socket.IO client will read the JWT token stored by `AuthContext`.

</code_context>

<specifics>
## Specific Ideas

- WhatsApp-inspired clean, modern styling: slate/emerald accent colors, crisp typography, responsive layout foundation, and clear visual feedback for errors/loading states.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-core-foundation-user-authentication*
*Context gathered: 2026-10-07*
