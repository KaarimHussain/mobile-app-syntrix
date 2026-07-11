# Product Requirements Document
## Real Estate Owner & Employee Management App
### Klyron Studio — Client Project (Karachi Real Estate Company)

**Version:** 1.0
**Date:** July 2026
**Status:** Draft for Review

---

## 1. Overview

### 1.1 Problem Statement
The client (a real estate company operating in Karachi's local market) currently manages properties, deals, referrals, and employee performance manually — no centralized system, no transparency into commission splits, no way to track who sourced a deal (direct owner vs. agent), and no digital task assignment for staff.

### 1.2 Solution
A two-sided mobile application:
- **Owner App** — full visibility and control: properties, deals, commissions, employee task approval.
- **Employee App** — task execution: assigned visits/follow-ups, property status updates, referral logging, personal commission tracking.

Both apps share one backend and one database, with role-based access controlling what each side can see and do.

### 1.3 Goals
- Centralize property and deal data in one system of record.
- Automate commission calculation per employee, per deal.
- Give the Owner a real-time view of employee performance and property pipeline.
- Give Employees a simple, low-friction way to manage their daily tasks and track their own earnings.
- Make the entire system **highly configurable via environment variables**, so deployment/rebranding/scaling requires minimal code changes.

### 1.4 Non-Goals (v1)
- Public-facing property listing site (this is an internal ops tool, not a Zameen.com competitor).
- Payment gateway integration (commission is tracked, not auto-disbursed, in v1).
- Multi-tenant support (this build is single-company; multi-tenant can be a v2 consideration if productized).

---

## 2. Users & Roles

| Role | App | Access Level |
|---|---|---|
| **Owner** | Owner App | Full access — all properties, all employees, all deals, approvals, commission overview |
| **Employee** (Agent/Salesperson) | Employee App | Scoped access — own tasks, own referrals, own commission, property status updates |
| **Manager** *(optional — pending client confirmation)* | Owner App (scoped) | Mid-tier — can approve tasks/deals for assigned employees, cannot see company-wide financials |

> **Note:** Role hierarchy is configurable. If the client confirms a "Manager" tier is needed, RBAC middleware is built to support it without a schema rewrite.

---

## 3. Feature List

### 3.1 Owner App

| Feature | Description |
|---|---|
| **Dashboard** | At-a-glance overview: total properties, active/rented/sold breakdown, pending approvals, top-performing employee |
| **Property Management (CRUD)** | Add/edit/archive properties — location, type (rent/sale), price, images, status |
| **Deal Records** | View/manage deal lifecycle — negotiated price, final price, payment status, linked property + employee |
| **Source Tracking** | Every deal tagged as **Direct Owner** or **Agent-Sourced**, with agent name if applicable |
| **Task Management** | Create, assign, and approve tasks for employees (property visits, client follow-ups) |
| **Approval Flow** | Employee-submitted deal/status updates route to Owner for approval before becoming "final" *(configurable — can be toggled to auto-approve)* |
| **Employee Directory** | View all employees, their roles, active task count, performance stats |
| **Commission Overview** | Auto-calculated commission per employee per deal, with company-wide commission summary |
| **Performance Monitoring** | Deals closed, revenue generated, and task completion rate — per employee, filterable by date range |
| **Notifications** | New employee submissions, task completions, deal status changes |

### 3.2 Employee App

| Feature | Description |
|---|---|
| **Login** | Role-based auth, scoped to assigned properties/tasks only |
| **My Tasks** | List of assigned tasks (visits, follow-ups) with due dates and status |
| **Property Status Update** | Mark property as Available / Rented / Sold (goes to Owner approval queue if enabled) |
| **Referral Logging** | Log new leads/deals as Direct Owner or Agent-sourced |
| **My Commission** | Personal running total, broken down by deal |
| **My Performance** | Deals closed, tasks completed, personal stats over time |
| **Notifications** | New task assigned, deal approved/rejected, commission credited |

### 3.3 Shared / System-Level Features

- Role-based authentication & authorization (JWT)
- Image upload for property listings (Cloudinary/S3)
- Push notifications (Expo Notifications)
- Dark/Light theme toggle (system default: **Light**)
- Fully environment-driven configuration (see §5)

---

## 4. Design System

### 4.1 Framework
- **Styling:** Tailwind CSS (via NativeWind for React Native/Expo)
- **Component Library:** [Gluestack UI](https://gluestack.io) or [Tamagui](https://tamagui.dev) — both support Tailwind-style utility classes + are RN-native and performant. *(Final pick to be confirmed once we prototype — Gluestack has better NativeWind parity, Tamagui has better animation/perf ceiling.)*

### 4.2 Color Theme
- **Primary:** Green (Shopify/Lyrix-inspired — confident, trustworthy, "money/growth" association fits real estate + commission theme)
- **Default mode:** Light
- **Dark mode:** Fully supported, toggle-able, persisted per user

| Token | Light | Dark |
|---|---|---|
| `primary` | `#0F9D58`–`#16A34A` range (final hex TBD in design pass) | Same hue, adjusted lightness for contrast |
| `background` | Off-white / near-white | Deep neutral gray/black |
| `surface` | White with soft shadow | Elevated dark gray |
| `text-primary` | Near-black | Near-white |
| `text-secondary` | Muted gray | Muted light gray |

### 4.3 Visual Style — Clay + Skeuomorphic Hybrid
A blended aesthetic: soft, tactile, slightly 3D surfaces (claymorphism) combined with subtle realistic depth cues (skeuomorphism) — without going full retro-skeuomorph (no fake leather/wood textures).

**Execution guidelines:**
- Soft, rounded corners (16–24px radius) on cards, buttons, inputs
- Dual-shadow technique for clay effect: light shadow (top-left, low opacity white/light) + dark shadow (bottom-right, low opacity black) to create a "pressed into surface" or "popped out" feel
- Buttons/toggles have a subtle "pressed" state (inset shadow on tap) — skeuomorphic tactility
- Icons: slightly dimensional, not flat-line — soft gradients or subtle shading, not photorealistic
- Avoid heavy borders — depth comes from shadow/light, not strokes
- Consistent light-source direction (top-left) across all elevated elements for visual coherence
- Dark mode clay shadows shift to lower-opacity, cooler-toned shadows to avoid muddiness

> This style will be prototyped early (2–3 core components: card, button, input) and validated with the client before applying system-wide.

### 4.4 Typography
- To align with Klyron's system: **Inter Tight** (headings/UI) — clean, modern, pairs well with a green fintech-adjacent palette
- *(Open to client input if they want something warmer for a real estate context)*

---

## 5. Environment-Based Configuration

**Core requirement:** the app must be deployable/reconfigurable through `.env` files with minimal to zero code changes. This covers:

### 5.1 Backend `.env`
```env
# Server
PORT=
NODE_ENV=

# Database
MONGODB_URI=

# Auth
JWT_SECRET=
JWT_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

# File Storage
STORAGE_PROVIDER=          # cloudinary | s3
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Push Notifications
EXPO_ACCESS_TOKEN=

# Business Logic Toggles
REQUIRE_OWNER_APPROVAL=    # true | false — deal/status approval flow
DEFAULT_COMMISSION_RATE=   # fallback % if not set per-deal
ENABLE_MANAGER_ROLE=       # true | false

# CORS / API
ALLOWED_ORIGINS=
```

### 5.2 Mobile App `.env` (Expo)
```env
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_APP_ENV=              # development | staging | production
EXPO_PUBLIC_DEFAULT_THEME=        # light | dark
EXPO_PUBLIC_PRIMARY_COLOR=        # override brand color without code change
EXPO_PUBLIC_APP_NAME=
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=
```

### 5.3 Why This Matters
- Client can rebrand color/name without touching code (useful if this gets productized for other real estate companies later).
- Approval flow, manager role, and commission defaults become **business toggles**, not hardcoded logic — client/ops can adjust behavior without a redeploy involving code changes.
- Clean separation between dev/staging/prod for safe iteration.

---

## 6. Technical Architecture

### 6.1 Stack Summary

| Layer | Choice |
|---|---|
| Mobile | React Native + Expo (managed workflow) |
| Styling | Tailwind via NativeWind |
| Components | Gluestack UI / Tamagui (TBD) |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (access + refresh token pattern) |
| File Storage | Cloudinary (default) — S3 swappable via env |
| Push Notifications | Expo Notifications |
| Hosting (API) | Railway / Render |
| Hosting (DB) | MongoDB Atlas |

### 6.2 App Structure

Two options — **final call pending your decision from earlier discussion:**
- **Option A:** Single Expo codebase, role-based routing/navigation (one app, two experiences) — faster to build/maintain, simpler deployment
- **Option B:** Two separate Expo apps (Owner, Employee) sharing a common package/component library via monorepo — cleaner app-store separation, slightly more setup overhead

*(Recommendation: Option A for v1 — role-based single app — unless client specifically wants two separate app store listings.)*

### 6.3 High-Level Data Models

**User**
```
{
  _id, name, email, phone, passwordHash,
  role: 'owner' | 'employee' | 'manager',
  active: Boolean,
  createdAt
}
```

**Property**
```
{
  _id, title, location, type: 'rent' | 'sale',
  askingPrice, finalPrice,
  status: 'available' | 'rented' | 'sold',
  images: [String],
  ownerId, assignedEmployeeId,
  createdAt, updatedAt
}
```

**Deal**
```
{
  _id, propertyId, employeeId,
  source: 'direct_owner' | 'agent',
  agentName (optional),
  negotiatedPrice, finalPrice,
  commissionAmount, commissionRate,
  paymentStatus: 'pending' | 'partial' | 'paid',
  approvalStatus: 'pending' | 'approved' | 'rejected',
  createdAt
}
```

**Task**
```
{
  _id, title, type: 'visit' | 'follow_up' | 'other',
  assignedTo, assignedBy,
  propertyId (optional),
  dueDate, status: 'pending' | 'in_progress' | 'completed',
  createdAt
}
```

**Notification**
```
{
  _id, userId, type, message, read: Boolean, createdAt
}
```

### 6.4 API Structure (REST, high-level)
```
/api/auth          — login, refresh, logout
/api/users          — CRUD (owner/manager only for write ops)
/api/properties     — CRUD + status updates
/api/deals          — CRUD + approval endpoints
/api/tasks          — CRUD + assignment + completion
/api/commissions    — summary + per-employee breakdown
/api/notifications  — fetch + mark-read
```

---

## 7. Approval Flow (configurable)
When `REQUIRE_OWNER_APPROVAL=true`:
1. Employee updates property status or logs a deal → status = `pending`
2. Owner sees it in an Approvals queue on dashboard
3. Owner approves/rejects → status updates → notification sent to employee
4. Only approved deals count toward commission totals

When `false`: employee updates go live immediately, no queue.

---

## 8. Open Questions (from earlier discussion — pending client/Kaarim confirmation)

1. Confirm if **Manager** role is in scope for v1 or deferred.
2. Confirm default state of `REQUIRE_OWNER_APPROVAL` — on or off at launch.
3. Confirm property types beyond rent/sale (plots, commercial) — affects schema now vs. later.
4. Confirm single codebase (Option A) vs. two separate apps (Option B).
5. Confirm final component library pick (Gluestack vs. Tamagui) after prototype.
6. Confirm final primary green hex — align with any existing client branding if they have a logo/colors already.

---

## 9. Suggested Roadmap (high-level, not yet estimated)

| Phase | Scope |
|---|---|
| **Phase 1** | Auth, roles, DB schema, base API |
| **Phase 2** | Property CRUD + Owner dashboard |
| **Phase 3** | Deal + commission engine + approval flow |
| **Phase 4** | Task management (both apps) |
| **Phase 5** | Notifications + performance analytics |
| **Phase 6** | Design polish (clay/skeuomorphic pass), dark mode, QA, deployment |

---

*Prepared by Klyron Studio. This is a living document — update as scope is confirmed with the client.*
