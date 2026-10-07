# Phase 1: Core Foundation & User Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-07
**Phase:** 01-core-foundation-user-authentication
**Areas discussed:** Identifier & Login Flow

---

## Identifier & Login Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Either Email or Phone number | Flexible, users can register/log in with whichever they prefer | ✓ |
| Email only | Standard, familiar web signup and password reset flow | |
| Phone number only | True WhatsApp style with country code selector | |
| You decide | | |

**User's choice:** Either Email or Phone number
**Notes:** Accommodate both formats in database schema and login forms.

---

## Credential Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Password-based with bcrypt | Secure password required for all accounts, instant sign-in without external SMS API dependencies | ✓ |
| Password for email + simulated OTP for phone | | |
| You decide | | |

**User's choice:** Password-based with bcrypt
**Notes:** Self-contained, robust security.

---

## Session Token Handling

| Option | Description | Selected |
|--------|-------------|----------|
| LocalStorage with Bearer Auth Header | Seamless access for REST API and Socket.IO connection auth payload | |
| HttpOnly Cookies | Stronger XSS isolation, requires withCredentials | |
| You decide | Agent chose LocalStorage + Bearer token for seamless Socket.IO handshake integration | ✓ |

**User's choice:** You decide
**Notes:** LocalStorage selected for simple, robust REST + Socket.IO auth sharing.

---

## Profile Initialization

| Option | Description | Selected |
|--------|-------------|----------|
| Default avatar + status on signup | Customizable immediately in profile drawer/modal | |
| Multi-step signup wizard | Step 1: Credentials -> Step 2: Upload avatar and write status bio | |
| You decide | Agent chose default initial avatar + customizable in profile drawer | ✓ |

**User's choice:** You decide
**Notes:** Low-friction registration with instant profile editing capabilities.

---

## the agent's Discretion

- Token storage and transmission mechanism (LocalStorage + Bearer Header)
- Default avatar generation (initials gradient) and default bio message
- Prisma database configuration with SQLite local dev default

## Deferred Ideas

- None — discussion stayed within phase scope.
