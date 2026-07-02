# Interactive Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive dashboard workbench where top cards filter the main order/payment queue and insight panels surface useful operational work.

**Architecture:** Add a pure model helper in `src/lib/dashboard/dashboard-model.ts` that derives dashboard cards, filtered views, payment rows, and insights from `OrderWithCustomer[]`. Replace the static dashboard page with a server fetch plus a client component `InteractiveDashboard` for local card selection.

**Tech Stack:** Next.js App Router, React client component state, TypeScript, Vitest, existing UI/card/button/status components, existing order service.

---

### Task 1: Dashboard Model

**Files:**
- Create: `src/lib/dashboard/dashboard-model.ts`
- Create: `src/lib/dashboard/dashboard-model.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that call `buildDashboardModel(orders, "2026-07-01")` and verify:
- `orders-today`, `deliveries-today`, `pending`, `overdue`, `collected-today`, and `outstanding` card values exist.
- `orders-today` contains orders whose `orderDate` is today.
- `outstanding` rows are sorted by `balanceDuePaise` descending.
- `collected-today` rows are derived from payments whose `paidAt` date is today.

Run: `npx vitest run src/lib/dashboard/dashboard-model.test.ts`
Expected: fail because the module does not exist.

- [ ] **Step 2: Implement model**

Create `buildDashboardModel(orders, today)` and exported view/card types. Keep it pure and deterministic.

- [ ] **Step 3: Verify model tests pass**

Run: `npx vitest run src/lib/dashboard/dashboard-model.test.ts`
Expected: pass.

### Task 2: Interactive Dashboard UI

**Files:**
- Create: `src/components/dashboard/interactive-dashboard.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Build client component**

`InteractiveDashboard` receives the model, keeps `selectedViewId` in `useState`, renders card buttons, main selected work queue, and insight panels.

- [ ] **Step 2: Wire dashboard page**

Fetch `listOrders()` on the server, build the model with `todayISO()`, pass to `InteractiveDashboard`, and remove static dashboard tables.

- [ ] **Step 3: Smoke check HTML**

Run built app and check `/dashboard` includes `Interactive Work Queue`, `Highest Outstanding`, and card labels.

### Task 3: Verification

**Files:**
- All changed files.

- [ ] **Step 1: Run checks**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm audit --omit=dev`
- `npm run build`

- [ ] **Step 2: Runtime smoke**

Restart local server and check `/dashboard` returns HTTP 200 with expected interactive dashboard markup.
