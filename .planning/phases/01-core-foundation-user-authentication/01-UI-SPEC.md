---
phase: 1
slug: core-foundation-user-authentication
status: approved
shadcn_initialized: false
preset: none
created: 2026-10-07
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for frontend Phase 1: Core Foundation & User Authentication. Verified against GSD 6-dimension UI quality standards.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Tailwind CSS (v3.4+) |
| Preset | not applicable |
| Component library | Custom modular React components |
| Icon library | `lucide-react` |
| Font | `Inter`, system-ui, sans-serif |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-text gaps, avatar status badge offset |
| sm | 8px | Form label margins, input inner padding (py), pill tags |
| md | 16px | Card body padding, input horizontal padding (px), form field gaps |
| lg | 24px | Modal dialog padding, profile drawer padding, card header margin |
| xl | 32px | Auth container padding, section dividers |
| 2xl | 48px | Page margins on large viewports |
| 3xl | 64px | Maximum vertical spacing |

Exceptions: None.

---

## Typography

| Role | Size | Weight | Line Height | Tracking | Usage |
|------|------|--------|-------------|----------|-------|
| Body | 14px (text-sm) | 400 (normal) | 1.5 | normal | Input field values, helper text, status bio preview |
| Label | 12px (text-xs) | 500 (medium) | 1.25 | 0.02em | Form field labels, validation error messages, timestamps |
| Heading | 20px (text-xl) | 600 (semibold) | 1.3 | -0.01em | Modal headers, card titles ("Sign In", "Your Profile") |
| Display | 28px (text-2xl) | 700 (bold) | 1.2 | -0.02em | Auth screen welcome branding, hero titles |

---

## Color

### Theme Palettes

#### Dark Mode (Primary Default)
| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0b141a` | Main application background, backdrop underlay |
| Secondary (30%) | `#111b21` | Auth card container, profile drawer panel, input backgrounds (`#202c33`) |
| Accent (10%) | `#00a884` | Primary action buttons, active tab indicators, focus rings |
| Destructive | `#ef4444` | Form validation errors, logout button hover state |

#### Light Mode (Secondary Variant)
| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#f0f2f5` | Main application background |
| Secondary (30%) | `#ffffff` | Auth card container, input background (`#f0f2f5`) |
| Accent (10%) | `#008069` | Primary action buttons, active tab indicators, focus rings |
| Destructive | `#dc2626` | Validation errors, logout action |

**Accent reserved strictly for:**
1. Primary submit buttons ("Sign In", "Create Account", "Save Profile")
2. Active tab indicator ("Email" vs "Phone" tab toggle)
3. Input focus ring (`focus:ring-2 focus:ring-[#00a884]`)
4. Online presence status dot

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (Login) | "Sign In to Chat" |
| Primary CTA (Register) | "Create Free Account" |
| Primary CTA (Profile) | "Save Changes" |
| Empty state heading | "Welcome to Real-Time Chat" |
| Empty state body | "Sign in with your email or phone number to access your messages and conversations." |
| Input Placeholder (Email) | "name@example.com" |
| Input Placeholder (Phone) | "+1 (555) 000-0000" |
| Input Placeholder (Password) | "Enter your password" |
| Input Placeholder (Status Bio) | "Hey there! I am using ChatApp" |
| Error state (Auth Failed) | "Incorrect email, phone, or password. Please verify your details." |
| Error state (Validation) | "Password must be at least 6 characters long." |
| Destructive confirmation | "Log Out: Are you sure you want to log out of your session on this device?" |

---

## Component Specifications (Auth & Profile Slice)

### 1. Auth Card Container
- Centered layout with responsive container (`max-w-md w-full mx-auto p-6 md:p-8 rounded-2xl`).
- Glassmorphic card styling with subtle border (`border border-slate-700/40 bg-[#111b21]/90 backdrop-blur-md shadow-2xl`).
- WhatsApp-inspired header badge with chat icon and app title.
- Toggle between "Sign In" and "Create Account" with animated tab underline.

### 2. Identifier Input Field
- Supports both email syntax and phone number formatting.
- Clear error state styling (`border-red-500 bg-red-500/10 text-red-400`).
- Interactive show/hide password toggle using `Eye` and `EyeOff` icons from `lucide-react`.

### 3. Profile Drawer / Modal
- Slide-over drawer from left (desktop) or bottom sheet (mobile).
- Initials avatar with customizable color gradients and upload button trigger (`Camera` icon).
- Live preview of display name and status bio with inline character counters.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | custom Tailwind implementation |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS (Consistent, active verbs, explicit error states)
- [x] Dimension 2 Visuals: PASS (Clean WhatsApp-inspired glassmorphic card, rounded corners, clear hierarchy)
- [x] Dimension 3 Color: PASS (60-30-10 rule strictly followed, dark/light variants mapped)
- [x] Dimension 4 Typography: PASS (Inter font, 4 defined scales, strict line-heights)
- [x] Dimension 5 Spacing: PASS (Multiples of 4 strictly enforced from xs to 3xl)
- [x] Dimension 6 Registry Safety: PASS (No unvetted external registries)

**Approval:** approved 2026-10-07
