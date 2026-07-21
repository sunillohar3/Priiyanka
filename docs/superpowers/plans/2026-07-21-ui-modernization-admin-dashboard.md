# Dashboard + Admin Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Functional polish + accessibility for Dashboard and Admin (internal tools) without changing business functionality; headline fix is a keyboard alternative to the drag-only services reorder (WCAG 2.2 SC 2.5.7) plus an ARIA tab pattern for Admin.

**Architecture:** Additive markup/ARIA changes on `Dashboard.js` and `Admin.js`; reuse existing `Reveal` primitive for restrained page-level motion only; factor the drag reorder into a shared `moveService(from,to)` used by both drag and new up/down buttons; extend Playwright fixtures with auth+admin stubs and add E2E + axe coverage. No backend, no dependency changes.

**Tech Stack:** React 18 (CRA+CRACO, JS/JSX), Tailwind, framer-motion ^12, @playwright/test, @axe-core/playwright. All installed.

## Global Constraints

- Stack stays **CRA + CRACO + JavaScript/JSX**. No Vite, no TypeScript.
- **No backend changes. No functional changes**: preserve every endpoint, redirect guard, filter, CRUD handler, and state transition. Existing `data-testid`s NOT renamed (new ones OK).
- **Restrained motion**: at most one `Reveal` per page (header region). NO staggered/row reveals. Never a raw `motion.*` (framer-motion JS motion isn't disabled by the CSS reduced-motion guard).
- On-brand only; no hardcoded hex.
- Decisions: Admin tabs get ARIA on existing buttons (no shadcn `Tabs` rewrite); cancel keeps native `window.confirm`.
- Auth: pages read `user` from `AuthContext` (`GET /auth/me`). Dashboard redirects `/` if `!user`; Admin redirects `/dashboard` if `!user || user.role !== 'admin'`.
- Exact reorder contract (verbatim, do not change): `PUT ${API}/admin/services/reorder` body `{ ordered_ids: services.map(s => s.service_id) }`.

## File Structure

**Modify:** `frontend/tests/e2e/fixtures.js`; `frontend/src/pages/Dashboard.js`; `frontend/src/pages/Admin.js`; `frontend/tests/e2e/axe.spec.js`; `frontend/tests/e2e/screenshots.spec.js`.
**Create:** `frontend/tests/e2e/dashboard.spec.js`, `frontend/tests/e2e/admin.spec.js`.

---

## Task 1: Fixtures — admin/auth stubs

**Files:** Modify `frontend/tests/e2e/fixtures.js`

**Interfaces:** Produces `ADMIN` user; `APPOINTMENTS` sample; `stubAdmin(page)` that stubs all Dashboard+Admin endpoints (200 + representative JSON). Existing `stubBackend`/`stubAuth`/`seedCart`/`SERVICES`/`USER` unchanged.

- [ ] **Step 1: Add to `fixtures.js`** (append new exports; keep existing)

```js
const ADMIN = { id: 'u-admin', email: 'admin@example.com', name: 'Admin User', role: 'admin', email_verified: true };

const APPOINTMENTS = [
  { appointment_id: 'appt-1', booking_date: '2030-01-02', booking_time: '10:00',
    items: [{ name: 'Ayurvedic Consultation' }], total_amount: 65, status: 'pending' },
];

const ADMIN_USERS = [ { id: 'u-admin', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
                      { id: 'u-1', email: 'client@example.com', name: 'Client One', role: 'client' } ];
const ADMIN_MESSAGES = [ { id: 'm-1', name: 'Jane', email: 'jane@example.com', subject: 'Hi', message: 'Question', status: 'new' } ];
const BLOCKED_SLOTS = [];

async function stubAdmin(page) {
  const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/appointments', (r) => r.fulfill(json(APPOINTMENTS)));
  await page.route('**/api/appointments/*/cancel', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/appointments/*/reschedule', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/appointments/*/status', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/admin/users', (r) => r.fulfill(json(ADMIN_USERS)));
  await page.route('**/api/admin/contact', (r) => r.fulfill(json(ADMIN_MESSAGES)));
  await page.route('**/api/admin/contact/*', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/admin/blocked-slots', (r) => r.fulfill(json(BLOCKED_SLOTS)));
  await page.route('**/api/admin/blocked-slots/*', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/admin/services/reorder', (r) => r.fulfill(json({ ok: true })));
  await page.route('**/api/services/*', (r) => r.fulfill(json({ ok: true }))); // PUT/DELETE single service
  await page.route('**/api/auth/resend-verification', (r) => r.fulfill(json({ ok: true })));
  // NOTE: `**/api/services` (list) is stubbed by stubBackend; call stubBackend first.
}

module.exports = { stubBackend, stubAuth, seedCart, stubAdmin, SERVICES, USER, ADMIN, APPOINTMENTS };
```
(Keep the existing `stubBackend`/`stubAuth`/`seedCart` definitions above unchanged; only add the new consts/function and extend the exports.)

- [ ] **Step 2: Verify** `node -e "require('./tests/e2e/fixtures.js'); console.log('ok')"` → `ok`; `npx playwright test smoke` → passes.
- [ ] **Step 3: Commit** `git add frontend/tests/e2e/fixtures.js && git commit -m "test: admin/dashboard stubs (stubAdmin, ADMIN, APPOINTMENTS)"`

---

## Task 2: Dashboard polish + a11y + E2E

**Files:** Modify `frontend/src/pages/Dashboard.js`; Create `frontend/tests/e2e/dashboard.spec.js`

**Interfaces:** Consumes `Reveal`, fixtures `stubBackend`/`stubAuth`/`stubAdmin`.

- [ ] **Step 1: Dashboard.js — polish + a11y (preserve ALL logic/testids)**
  1. Import `Reveal` from `../components/common/Reveal`.
  2. Wrap the header block (`<div className="mb-8">` containing the `h1[data-testid=dashboard-title]` + email `<p>`) in a single `<Reveal>`. No other motion.
  3. Status-badge contrast fix: the `statusColor` map uses `bg-<c>/15 text-<c>` which is likely < 4.5:1. Change each to a token pairing that passes AA on the card background — use solid low-alpha bg with the darker text, e.g. `pending: 'bg-accent/15 text-accent-foreground'` is wrong (white); instead darken text: keep the `/15` bg but set text to `text-foreground` with a colored left-border, OR use `bg-<c> text-<c>-foreground` chips. Concretely set: `pending: 'bg-accent text-accent-foreground'`, `confirmed: 'bg-secondary text-secondary-foreground'`, `completed: 'bg-primary text-primary-foreground'`, `cancelled: 'bg-destructive text-destructive-foreground'`. (Solid brand bg + its foreground token — all AA-verified pairings from the token set.) This is a visual tweak only; the status text/logic is unchanged.
  4. Preserve: `!user`→`/` redirect, `fetchData`, `handleCancel` (native `window.confirm`), `submitReschedule`, `handleResend`, all testids. Trailing newline.

- [ ] **Step 2: `dashboard.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend, stubAuth, stubAdmin, USER } = require('./fixtures');

test('unauthenticated dashboard redirects home', async ({ page }) => {
  await stubBackend(page); // /auth/me -> 401
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/$/);
});

test.describe('authed dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page);
    await stubAdmin(page); // appointments + endpoints
    await stubAuth(page, { ...USER, email_verified: true });
  });

  test('renders appointments and reschedules', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('appt-appt-1')).toBeVisible();
    await page.getByTestId('reschedule-appt-1').click();
    await page.locator('#rd-appt-1').fill('2030-02-02');
    await page.locator('#rt-appt-1').fill('11:00');
    await page.getByRole('button', { name: /Save|Opslaan/ }).click();
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
  });

  test('cancel accepts confirm dialog', async ({ page }) => {
    page.on('dialog', (d) => d.accept());
    await page.goto('/dashboard');
    await page.getByTestId('cancel-appt-1').click();
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
  });

  test('verify banner resend when unverified', async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await stubBackend(page); await stubAdmin(page);
    await stubAuth(page, { ...USER, email_verified: false });
    await page.goto('/dashboard');
    await expect(page.getByTestId('verify-banner')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run** `npx playwright test dashboard` → pass; `CI=true npx craco build` → compiles.
- [ ] **Step 4: Commit** `git add frontend/src/pages/Dashboard.js frontend/tests/e2e/dashboard.spec.js && git commit -m "feat(dashboard): header reveal, AA status badges, E2E for cancel/reschedule"`

---

## Task 3: Admin keyboard reorder (WCAG 2.2 SC 2.5.7) + E2E

**Files:** Modify `frontend/src/pages/Admin.js`; Create `frontend/tests/e2e/admin.spec.js` (reorder test; grown in Tasks 4-5)

**Interfaces:** Adds `moveService(from,to)`; new testids `move-up-<id>`, `move-down-<id>`.

- [ ] **Step 1: Factor shared reorder in Admin.js** — replace `handleServiceDrop` (lines ~200-209) so both drag and buttons share one path:

```jsx
const moveService = (from, to) => {
  if (from === null || to === from || to < 0 || to >= services.length) return;
  const arr = [...services];
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  setServices(arr);
  persistServiceOrder(arr);
};

const handleServiceDrop = (dropIndex) => {
  const from = dragIndex.current;
  dragIndex.current = null;
  moveService(from, dropIndex);
};
```
(`persistServiceOrder` unchanged — still `PUT /admin/services/reorder` with `{ ordered_ids }`.)

- [ ] **Step 2: Add Up/Down buttons in the service row** (services tab, ~line 628 button group). Before the Edit button, add:

```jsx
<Button variant="ghost" size="icon" aria-label={`Move ${service.name_en} up`}
  disabled={index === 0} onClick={() => moveService(index, index - 1)}
  data-testid={`move-up-${service.service_id}`}>
  <ChevronUp className="w-4 h-4" aria-hidden="true" />
</Button>
<Button variant="ghost" size="icon" aria-label={`Move ${service.name_en} down`}
  disabled={index === services.length - 1} onClick={() => moveService(index, index + 1)}
  data-testid={`move-down-${service.service_id}`}>
  <ChevronDown className="w-4 h-4" aria-hidden="true" />
</Button>
```
Add `ChevronUp, ChevronDown` to the lucide-react import (line 8). Update the helper text (line 606) to mention keyboard: `"Drag rows, or use the up/down buttons, to reorder how services appear on the site."`

- [ ] **Step 3: `admin.spec.js` (reorder test)**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend, stubAuth, stubAdmin, ADMIN, SERVICES } = require('./fixtures');

test.describe('admin', () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page);
    await stubAdmin(page);
    await stubAuth(page, ADMIN);
  });

  test('services reorder via keyboard buttons issues reorder PUT', async ({ page }) => {
    const reorder = page.waitForRequest((req) =>
      req.url().includes('/api/admin/services/reorder') && req.method() === 'PUT');
    await page.goto('/admin');
    await expect(page.getByTestId(`service-row-${SERVICES[0].service_id}`)).toBeVisible();
    // first row's up is disabled; move it down instead
    await page.getByTestId(`move-down-${SERVICES[0].service_id}`).click();
    const req = await reorder;
    expect(JSON.parse(req.postData()).ordered_ids).toContain(SERVICES[0].service_id);
  });
});
```

- [ ] **Step 4: Run** `npx playwright test admin` → pass; `CI=true npx craco build` → compiles.
- [ ] **Step 5: Commit** `git add frontend/src/pages/Admin.js frontend/tests/e2e/admin.spec.js && git commit -m "feat(admin): keyboard up/down reorder alternative (WCAG 2.2 SC 2.5.7) + E2E"`

---

## Task 4: Admin tab ARIA + arrow-key nav + guard/tab E2E

**Files:** Modify `frontend/src/pages/Admin.js`, `frontend/tests/e2e/admin.spec.js`

- [ ] **Step 1: Tab ARIA** — the tab buttons live ~line 396-455 (5 buttons keyed to `activeTab`). Wrap the button container in `role="tablist"` `aria-label="Admin sections"`. For each tab button add: `role="tab"`, `id={`tab-${key}`}`, `aria-selected={activeTab === key}`, `aria-controls={`panel-${key}`}`, `tabIndex={activeTab === key ? 0 : -1}`. Add an `onKeyDown` on the tablist that moves focus + `setActiveTab` on `ArrowLeft`/`ArrowRight` (wrap around the 5 keys `['services','appointments','availability','users','messages']`). For each panel wrapper (`{activeTab === 'x' && (<div>...)}`) add `role="tabpanel"`, `id={`panel-x`}`, `aria-labelledby={`tab-x`}`, `tabIndex={0}`. Do NOT change `activeTab` state logic or any testid.

- [ ] **Step 2: admin.spec.js — add guard + tab tests**

```js
test('non-admin is redirected to dashboard', async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await stubBackend(page); await stubAdmin(page);
  await stubAuth(page, { id: 'u-1', email: 'c@e.com', name: 'Client', role: 'client', email_verified: true });
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('tabs switch and reflect aria-selected', async ({ page }) => {
  await page.goto('/admin');
  const usersTab = page.getByRole('tab', { name: /Users/i });
  await usersTab.click();
  await expect(usersTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toBeVisible();
});
```
(These beforeEach-share the admin stubs; the guard test overrides auth to a client.)

- [ ] **Step 3: Run** `npx playwright test admin` → pass; build compiles.
- [ ] **Step 4: Commit** `git add frontend/src/pages/Admin.js frontend/tests/e2e/admin.spec.js && git commit -m "feat(admin): ARIA tab pattern + arrow-key nav + guard/tab E2E"`

---

## Task 5: Admin a11y polish + service CRUD & filter E2E

**Files:** Modify `frontend/src/pages/Admin.js`, `frontend/tests/e2e/admin.spec.js`

- [ ] **Step 1: a11y polish (Admin.js)** — (a) status pills across appointments/messages: apply the same solid `bg-<c> text-<c>-foreground` AA pairing approach used on the Dashboard badges (find the pill className maps and update). (b) **Label association gap (confirmed):** the service-form fields use bare `<label className="block ...">` with NO `htmlFor`, and the `<Input>`/`<Textarea>` have no `id` (e.g. lines 487-493 "Name (English)"). Associate each — add a unique `id` to each control and `htmlFor` to its label (e.g. `id="svc-name-en"` + `htmlFor="svc-name-en"`), for all service-form fields and the blocked-slot form fields. Do NOT remove or rename the existing `data-testid`s (`input-name-en`, `input-name-nl`, `input-description-en`, `input-description-nl`, and the price/duration/category/image fields). (c) `GripVertical` already has `aria-hidden` (line 620) — leave. No logic/testid changes.

- [ ] **Step 2: admin.spec.js — service CRUD + filter tests**

```js
test('create service submits POST', async ({ page }) => {
  const post = page.waitForRequest((r) => r.url().endsWith('/api/services') && r.method() === 'POST');
  await page.goto('/admin');
  await page.getByTestId('add-service-button').click(); // NOTE: confirm exact testid in Admin.js; use the real one
  await page.locator('#name_en, [name="name_en"]').first().fill('Test Service');
  // fill remaining required fields by id/name as present in the form
  await page.getByRole('button', { name: /Create|Save/ }).click();
  await post;
});

test('delete service issues DELETE', async ({ page }) => {
  page.on('dialog', (d) => d.accept()); // if delete confirms
  const del = page.waitForRequest((r) => /\/api\/services\/.+/.test(r.url()) && r.method() === 'DELETE');
  await page.goto('/admin');
  await page.getByTestId(`delete-service-${require('./fixtures').SERVICES[0].service_id}`).click();
  await del;
});
```
NOTE for implementer: open `Admin.js` and use the ACTUAL testids/field names for the add-service trigger and form fields (`add-service-button` and `name_en` are expected but VERIFY; adjust the selectors to what exists — do not add/rename testids just to fit the test, except adding a testid to the "add service" trigger if it genuinely lacks one). Keep assertions on the real network calls (POST/DELETE/PUT) so they're meaningful. Add an edit test and a message/appointment filter test the same way (assert the filtered list count changes).

- [ ] **Step 3: Run** `npx playwright test admin` → all pass; build compiles.
- [ ] **Step 4: Commit** `git add frontend/src/pages/Admin.js frontend/tests/e2e/admin.spec.js && git commit -m "feat(admin): AA status pills, form labels + service CRUD/filter E2E"`

---

## Task 6: axe gate + screenshots + full suite

**Files:** Modify `frontend/tests/e2e/axe.spec.js`, `frontend/tests/e2e/screenshots.spec.js`

- [ ] **Step 1: axe.spec.js** — the current spec iterates public routes with `stubBackend` + `emulateMedia({reducedMotion:'reduce'})`. Add authenticated coverage for `/dashboard` and `/admin` as SEPARATE tests (they need `stubAdmin` + `stubAuth(ADMIN)` before goto), e.g.:

```js
const { ADMIN } = require('./fixtures'); // add stubAdmin, stubAuth to imports
for (const path of ['/dashboard', '/admin']) {
  test(`axe: no serious/critical on ${path} (authed)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stubBackend(page); await stubAdmin(page); await stubAuth(page, ADMIN);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    const serious = results.violations.filter((v) => ['serious','critical'].includes(v.impact));
    expect(serious, JSON.stringify(serious.map((v) => v.id), null, 2)).toEqual([]);
  });
}
```
Fix any serious/critical violations found (minimal, on-brand; no logic changes). Re-run until green.

- [ ] **Step 2: screenshots.spec.js** — add `dashboard: '/dashboard'` and `admin: '/admin'`; for both, call `stubAdmin(page)` + `stubAuth(page, ADMIN)` before `goto` (import them). Keep `emulateMedia` + gitignored output.

- [ ] **Step 3: Run full suite** `npx playwright test` → all pass across 3 viewports; build compiles.
- [ ] **Step 4: Commit** `git add frontend/tests/e2e/axe.spec.js frontend/tests/e2e/screenshots.spec.js && git commit -m "test(a11y): axe + screenshots for /dashboard and /admin (authed)"`

---

## Self-Review

**Spec coverage:** Dashboard polish+a11y+E2E (Task 2); Admin keyboard reorder SC 2.5.7 (Task 3); Admin tab ARIA + arrow keys (Task 4); Admin a11y pills/labels + CRUD/filter E2E (Task 5); axe /dashboard+/admin + screenshots (Task 6); fixtures (Task 1). Restrained motion (≤1 Reveal/page), no raw motion.*, all endpoints/testids/guards preserved — stated per task. ✅

**Placeholder scan:** Concrete code for fixtures, reorder refactor, and specs. Task 5's CRUD test explicitly instructs the implementer to VERIFY real testids/field names in Admin.js rather than guessing — this is a deliberate directive (the form's exact field ids weren't captured in planning), not a placeholder; assertions are on real network calls. ✅

**Type/name consistency:** `stubAdmin`/`ADMIN`/`APPOINTMENTS` defined Task 1, used Tasks 2-6. `moveService(from,to)` defined Task 3, drives drag + buttons. Reorder contract (`PUT /admin/services/reorder`, `{ordered_ids}`) matches source. New testids `move-up-<id>`/`move-down-<id>` defined+used Task 3. ARIA ids `tab-<key>`/`panel-<key>` consistent Task 4. ✅
