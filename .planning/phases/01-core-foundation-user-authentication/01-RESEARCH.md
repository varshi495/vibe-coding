# Phase 1: Core Foundation & User Authentication - Research

**Researched:** 2026-10-07
**Domain:** Node.js/Express, TypeScript, Prisma ORM, React SPA Authentication & Profiles
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Either Email or Phone number accepted as primary identifier during registration and login.
- **D-02:** Password-based authentication with bcrypt hashing (10 salt rounds) for all user accounts without external SMS dependency.
- **D-03:** JWT token returned in JSON response upon login/signup and stored in browser `localStorage`. REST API client sends `Authorization: Bearer <token>` header for easy reuse in Phase 2 Socket.IO handshake auth.
- **D-04:** Token expiry set to 7 days with `/api/auth/me` profile verification on app startup to restore authentication state across page reloads.
- **D-05:** Sensible default avatar (gradient tile with user initials) and default status bio ("Hey there! I am using ChatApp") created automatically on registration.
- **D-06:** Profile drawer/settings modal allows user to update display name, avatar URL (or local avatar upload), and status bio anytime.

### the agent's Discretion
- Database layer: Prisma schema with SQLite for immediate zero-config local development (`provider = "sqlite"`), with models structured to easily switch to PostgreSQL via `DATABASE_URL`.
- Password validation: Minimum 6 characters required.
- API structure: Clean RESTful endpoints (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile`).

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User Registration & Login | API/Backend | Browser/Client | Backend verifies credentials, executes bcrypt hashes, and issues JWT tokens. |
| Session Persistence | Browser/Client | API/Backend | Client stores JWT in localStorage and verifies token against `/api/auth/me` on startup. |
| Password Hashing | API/Backend | Database | Server enforces one-way bcrypt hashing before writing to the database. |
| User Profile Management | API/Backend | Browser/Client | Client provides profile drawer UI; server validates updates and writes to DB. |
| UI & Form States | Browser/Client | — | React client manages form state, error alerts, and dark/light styling. |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 establishes the full-stack architecture for the WhatsApp-inspired real-time chat application. It creates the monorepo structure with `server/` (Node.js, Express, TypeScript, Prisma ORM) and `client/` (React, Vite, TypeScript, Tailwind CSS), delivering an end-to-end working slice of user authentication and profile management.

The authentication workflow utilizes stateless JSON Web Tokens (JWT) signed with a secret key, with bcryptjs securing passwords in the database. In the client, an `AuthContext` provides global authentication state (`user`, `token`, `login`, `register`, `logout`, `updateProfile`), automatically hydrating the session on mount and attaching the `Authorization: Bearer <token>` header to all API requests.

**Primary recommendation:** Build a clean monorepo layout with concurrent dev scripts, initialize Prisma with SQLite for zero-setup instant local running, and implement the complete vertical slice from database models to responsive auth UI before starting Socket.IO messaging in Phase 2.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | ^4.19.2 | Backend HTTP router | Industry-standard Node.js REST server |
| prisma & @prisma/client | ^5.18.0 | Database ORM | Type-safe queries and straightforward schema migrations |
| bcryptjs | ^2.4.3 | Password hashing | Zero-dependency, pure JavaScript bcrypt implementation for Windows/cross-platform compatibility |
| jsonwebtoken | ^9.0.2 | Token signing & decoding | Standard JWT implementation for Node.js |
| react & react-dom | ^18.3.1 | Frontend framework | Component-based declarative UI |
| vite | ^5.4.0 | Frontend bundler | Ultra-fast HMR and optimized TypeScript builds |
| tailwindcss | ^3.4.10 | CSS framework | Utility-first styling matching WhatsApp design tokens |
| lucide-react | ^0.428.0 | Icons | High-quality, modern SVG icon library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cors | ^2.8.5 | Cross-Origin Resource Sharing | Enables React client on port 5173 to call Express backend on port 5000 |
| dotenv | ^16.4.5 | Environment variable loader | Loads JWT secrets and port configs from `.env` |
| tsx | ^4.19.0 | Node TypeScript runner | Fast dev server execution with zero compilation delay |
| concurrently | ^8.2.2 | Multi-process runner | Single root `npm run dev` starts client and server together |

**Installation:**
```bash
# Server dependencies
cd server && npm install express cors dotenv jsonwebtoken bcryptjs @prisma/client
npm install -D typescript @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs tsx prisma

# Client dependencies
cd ../client && npm install react react-dom lucide-react
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss postcss autoprefixer
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
vibe coding/
├── package.json               # Root scripts (dev, build, install)
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── prisma/
│   │   └── schema.prisma      # User model (id, name, email, phone, password, avatar, bio)
│   └── src/
│       ├── config/            # env vars and prisma client
│       ├── controllers/       # authController.ts, userController.ts
│       ├── middleware/        # authMiddleware.ts, errorHandler.ts
│       ├── routes/            # authRoutes.ts, userRoutes.ts
│       └── server.ts          # Express server entry point
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── components/
        │   ├── auth/          # AuthCard.tsx, LoginForm.tsx, RegisterForm.tsx
        │   └── profile/       # ProfileDrawer.tsx, Avatar.tsx
        ├── context/           # AuthContext.tsx
        ├── services/          # api.ts (fetch/axios helper)
        ├── types/             # auth.ts, user.ts
        ├── App.tsx            # Protected app shell
        └── main.tsx
```

### Pattern 1: Flexible Identifier Resolution
```typescript
// Support either email or phone in a single login identifier field
export const findUserByIdentifier = async (identifier: string) => {
  const isEmail = identifier.includes('@');
  return prisma.user.findFirst({
    where: isEmail
      ? { email: identifier.toLowerCase().trim() }
      : { phone: identifier.replace(/[^0-9+]/g, '') }
  });
};
```

### Pattern 2: Global Auth Context & Interceptor
```typescript
// React Auth Context providing instant session restore and clean logout
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('chat_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setUser(data.user); })
      .finally(() => setLoading(false));
  }, []);
  // ...
};
```
</architecture_patterns>

<validation_architecture>
## Validation Architecture

The automated and manual verification strategy for Phase 1 covers all 6 scoped requirements:

1. **AUTH-01 & AUTH-06 (Registration & Password Hashing):**
   - API test: `POST /api/auth/register` with email or phone + password returns 201 with JWT and sanitized user object (password excluded).
   - Validation test: Submitting passwords shorter than 6 characters returns 400 Bad Request.
   - Database verification: Direct query confirms stored password is a valid bcrypt hash starting with `$2a$` or `$2b$`.

2. **AUTH-02 & AUTH-05 (Login & Session Persistence):**
   - API test: `POST /api/auth/login` with correct identifier & password returns 200 with JWT token.
   - API test: `POST /api/auth/login` with wrong password returns 401 Unauthorized with descriptive error.
   - Session test: `GET /api/auth/me` with `Bearer <token>` returns 200 with current user profile.
   - Session test: `GET /api/auth/me` without token returns 401 Unauthorized.

3. **AUTH-03 & AUTH-04 (Logout & Profile Update):**
   - API test: `PUT /api/auth/profile` updates `name`, `status`, or `avatar` and returns updated user.
   - UI test: Calling `logout()` clears `localStorage` token and returns interface to login card.

4. **Schema Push Requirement:**
   - Execute `npx prisma db push` inside `server/` to generate SQLite database and apply models.
</validation_architecture>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password encryption | Custom hash or SHA256 | `bcryptjs` | SHA256 is vulnerable to rainbow table attacks; bcrypt provides salt rounds |
| Token management | Simple random tokens | `jsonwebtoken` | JWT provides tamper-proof signed payload with expiration |
| Database schema management | Raw SQL CREATE TABLE scripts | `prisma` | Provides type-safe TS client, automatic schema migrations, and relational joins |
</dont_hand_roll>

---
*Phase: 01-core-foundation-user-authentication*
*Research completed: 2026-10-07*
*Ready for planning: yes*
