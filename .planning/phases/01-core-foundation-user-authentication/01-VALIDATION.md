---
phase: 1
slug: core-foundation-user-authentication
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js verification scripts + TypeScript compiler check |
| **Config file** | `server/tsconfig.json` & `client/tsconfig.json` |
| **Quick run command** | `cd server && npx tsc --noEmit && cd ../client && npx tsc --noEmit` |
| **Full suite command** | `npm run build && node server/test-auth-endpoints.js` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick TypeScript typecheck & schema validation
- **After every plan wave:** Run full build and auth endpoint verification
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | T-01-01 | Bcrypt hashed passwords ($2a$) | integration | `cd server && npx tsx src/tests/auth.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-02 | T-01-02 | Valid JWT issued with 7d expiry | integration | `cd server && npx tsx src/tests/auth.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | AUTH-06 | T-01-03 | Reject passwords < 6 chars | unit | `cd server && npx tsx src/tests/auth.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | AUTH-05 | — | LocalStorage token hydration on app mount | smoke | `cd client && npm run build` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | AUTH-04 | — | Update display name and bio via profile drawer | integration | `cd server && npx tsx src/tests/profile.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | AUTH-03 | — | Clear token and redirect on logout | smoke | `cd client && npm run build` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Initialize `server/` with `npm init -y`, install dependencies, setup `prisma/schema.prisma`
- [ ] Initialize `client/` with Vite + React + Tailwind CSS
- [ ] Create automated endpoint verification test script `server/src/tests/auth.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual glassmorphic styling & responsive dark mode | UI-SPEC | Visual aesthetics | Open `http://localhost:5173` in browser and inspect login card layout |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all setup dependencies
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-07
