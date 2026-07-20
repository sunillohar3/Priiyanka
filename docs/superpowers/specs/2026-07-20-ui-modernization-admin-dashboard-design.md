# UI Modernization — Dashboard + Admin (internal tools)

**Date:** 2026-07-20
**Scope:** Third increment. The authenticated internal tools.
**Status:** Approved design.

## Goal

Apply **functional polish + accessibility** to the Dashboard and Admin pages
without changing business functionality. These are internal tools (dense data,
CRUD, drag-to-reorder), NOT marketing pages — so motion is restrained and the
emphasis is accessibility, hierarchy/spacing consistency, and test coverage.

## Constraints (hard)

- Stay on **CRA + CRACO + JavaScript/JSX**. No Vite, no TypeScript.
- **No backend changes. No functional changes**: every CRUD call, endpoint,
  redirect guard, filter, and state transition preserved. Existing
  `data-testid`s must not be renamed (new ones may be added).
- **Restrained motion**: at most a single subtle page-level fade on mount via
  the existing reduced-motion-safe `Reveal`. NO staggered scroll-reveals on data
  rows/tables. Never a raw `motion.*`.
- On-brand only: existing tokens/primitives; no hardcoded hex.
- Decisions (confirmed): Admin tabs get ARIA on the existing custom buttons (no
  shadcn `Tabs` rewrite); cancel keeps the native `window.confirm`.

## In scope

`Dashboard` (`/dashboard`) and `Admin` (`/admin`). Out of scope: backend,
public pages (done), any redesign of the data model or flows.

## Design

### Dashboard (`src/pages/Dashboard.js`, ~246 lines)

- Behavior preserved: `!user` → redirect `/`; `GET /appointments`; `handleCancel`
  (native `window.confirm` + `POST /appointments/:id/cancel`); `submitReschedule`
  (`PUT /appointments/:id/reschedule`); `handleResend` (`POST
  /auth/resend-verification`). testids `dashboard-title`, `verify-banner`,
  `appt-<id>`, `reschedule-<id>`, `cancel-<id>` unchanged.
- Polish: page header via `SectionHeading` (or aligned heading), consistent
  spacing; single subtle `Reveal` on the header region only.
- a11y: verify/fix contrast on status badges (`bg-<color>/15` + colored text —
  likely below AA on the light bg); ensure the reschedule inline form inputs
  keep their `<Label htmlFor>` links (already present); focus-visible on all
  buttons (shadcn default).

### Admin (`src/pages/Admin.js`, ~930 lines, 5 tabs, 14 endpoints)

- Behavior preserved: role guard (`!user || role !== 'admin'` → `/dashboard`);
  `Promise.allSettled` load of services/appointments/users/messages/blocked-slots;
  all service CRUD (`POST`/`PUT`/`DELETE /services`, image upload), blocked-slot
  CRUD, message/appointment filters, and the reorder call. All 34 testids kept.
- **Drag-reorder keyboard alternative (WCAG 2.2 SC 2.5.7 — headline fix):** the
  services list reorders only via native HTML5 drag (`dragIndex` ref +
  `GripVertical`). Add **Up/Down buttons** per service row (disabled at
  ends) that perform the SAME reorder as a drag (same `display_order` update /
  reorder request). Keep drag as a progressive enhancement. New testids
  `move-up-<service_id>`, `move-down-<service_id>`.
- **Tab ARIA:** wrap the tab buttons in `role="tablist"`, each button
  `role="tab"` with `aria-selected` + `aria-controls`, and the active panel
  `role="tabpanel"` with `aria-labelledby` + `tabIndex={0}`; support Left/Right
  arrow-key movement between tabs. No change to `activeTab` state logic or
  testids.
- Polish: consistent heading/spacing; verify status-pill contrast; ensure all
  form fields have associated labels; `GripVertical` marked `aria-hidden`.
- Restrained motion: at most one `Reveal` on the page header; none on tables.

### Testing (Playwright, backend + auth stubbed)

Extend `tests/e2e/fixtures.js`:
- `stubAuth(page, user)` already returns a user for `/auth/me`; use it with
  `{ ...USER, role: 'admin', email_verified: true }` for admin tests and a plain
  verified user for dashboard tests. Add an `ADMIN` sample.
- Add stubs (200 + representative JSON) for: `**/api/appointments` (list),
  `**/api/appointments/*/cancel`, `**/api/appointments/*/reschedule`,
  `**/api/services` (already), `**/api/services/*` (PUT/DELETE),
  `**/api/admin/users`, `**/api/admin/contact`, `**/api/admin/blocked-slots`,
  and the reorder endpoint. Group into a `stubAdmin(page)` helper.

Specs:
- **dashboard.spec.js** — redirect when unauthenticated; authed render of
  appointments (seeded via stub); cancel flow (accept the `window.confirm`
  dialog via `page.on('dialog')`); reschedule flow → success; verify-banner
  resend when `email_verified:false`.
- **admin.spec.js** — non-admin (role `client`) redirected to `/dashboard`;
  admin loads and tab switching works (ARIA `aria-selected` reflects state);
  service create + edit + delete against stubs; **keyboard reorder** via
  `move-up`/`move-down` buttons issues the reorder call; message/appointment
  filter changes update the visible list.
- **axe.spec.js** — add `/dashboard` and `/admin` (with `stubAuth`+`stubAdmin`,
  admin role, `emulateMedia({reducedMotion:'reduce'})`). Zero serious/critical.
- **screenshots.spec.js** — add `/dashboard` and `/admin` (authed) — still
  generate-on-demand (gitignored, not committed).

## Verification / success criteria

- Dashboard + Admin behave identically; every endpoint, guard, filter, testid,
  and the reorder result unchanged.
- Services can be reordered by keyboard alone (up/down buttons) — SC 2.5.7 met.
- Admin tabs are keyboard + screen-reader operable (ARIA tab pattern).
- axe: zero serious/critical on `/dashboard` and `/admin`.
- Full E2E suite passes across the 3 viewports.
- Changes confined to `frontend/src/pages/{Dashboard,Admin}.js` and
  `frontend/tests/` (plus `src/components/common/*` only if a shared helper is
  genuinely needed).

## Risks

- **Admin is 930 lines, mutation-heavy** — highest regression risk in the
  project. Mitigate: motion/a11y/ARIA are additive markup changes; preserve
  every handler/endpoint/testid verbatim; decompose the plan into small
  per-tab/per-flow tasks each independently E2E-verified.
- **Keyboard reorder must call the exact same reorder path as drag** — implement
  by factoring the existing drag's reorder logic into a shared `moveService(from,
  to)` and calling it from both drag and the buttons; do not fork the logic.
- **`window.confirm` in E2E** — must be handled with `page.on('dialog', d =>
  d.accept())` before triggering cancel.
