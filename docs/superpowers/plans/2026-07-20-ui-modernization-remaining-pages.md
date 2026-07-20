# Remaining-Public-Pages UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the elevation treatment (primitives + reduced-motion-safe motion + WCAG 2.2 AA + Playwright E2E) to Cart, Privacy, Terms, Suggestions, ResetPassword, VerifyEmail, and NotFound, without changing business functionality.

**Architecture:** Reuse the existing `src/components/common/` primitives (`Section`, `SectionHeading`, `Reveal`, `Stagger`) — no new components. Refactor markup only; wrap content in motion primitives; add `data-testid`s where missing on the auth pages; extend the Playwright fixtures, axe gate, and screenshot spec to the new routes.

**Tech Stack:** React 18 (CRA + CRACO, JS/JSX), Tailwind, framer-motion ^12, @playwright/test, @axe-core/playwright. All already installed.

## Global Constraints

- Stack stays **CRA + CRACO + JavaScript/JSX**. No Vite, no TypeScript.
- **No backend changes.** **No functional changes**: routes, API calls (`/appointments`, `/auth/reset-password`, `/auth/verify-email`, `/auth/me`), cart/auth logic, and i18n strings unchanged.
- Existing `data-testid`s must NOT be renamed. New ones may be added (auth pages, cart-empty).
- **On-brand only**: existing tokens + primitives. No hardcoded hex.
- All animation via `Reveal`/`Stagger` ONLY (reduced-motion-safe). NEVER a raw `motion.*` element — framer-motion's `initial`/`animate`/`whileInView` are JS-driven and NOT disabled by the CSS reduced-motion guard.
- Playwright: Chrome via `channel: 'chrome'`; dev server via `npm start`; run from `frontend/`.
- Playwright route precedence: the MOST-RECENTLY-registered matching route wins. `stubAuth` (registering `**/api/auth/me`) must be called AFTER `stubBackend` (which stubs `**/api/auth/**` → 401) to override it.

## File Structure

**Modify:**
- `frontend/tests/e2e/fixtures.js` — add `/appointments` stub + `stubAuth` + `USER`.
- `frontend/src/pages/Cart.js`, `Privacy.js`, `Terms.js`, `Suggestions.js`, `ResetPassword.js`, `VerifyEmail.js`, `NotFound.js`
- `frontend/tests/e2e/axe.spec.js` — add 7 routes.
- `frontend/tests/e2e/screenshots.spec.js` — add new pages.

**Create:**
- `frontend/tests/e2e/cart.spec.js`, `legal.spec.js`, `auth-pages.spec.js`

---

## Task 1: Extend Playwright fixtures

**Files:**
- Modify: `frontend/tests/e2e/fixtures.js`

**Interfaces:**
- Produces: `stubAuth(page, user?)` registers `**/api/auth/me` → 200 with a user; `USER` sample object; `stubBackend` also stubs `**/api/appointments` → 200.

- [ ] **Step 1: Extend `fixtures.js`**

Add `/appointments` to `stubBackend` and export `stubAuth` + `USER`. The file becomes:

```js
// Deterministic backend stubs so E2E runs without the Python backend.
const SERVICES = [
  { service_id: 'svc-consult', name_en: 'Ayurvedic Consultation', name_nl: 'Ayurvedisch Consult',
    description_en: 'Comprehensive assessment of your body constitution (Prakriti).',
    description_nl: 'Uitgebreide beoordeling van uw lichaamsconstitutie (Prakriti).',
    price: 65, duration: 60, image_url: '', display_order: 1 },
  { service_id: 'svc-abhyanga', name_en: 'Abhyanga Massage', name_nl: 'Abhyanga Massage',
    description_en: 'Full body traditional Ayurvedic oil massage.',
    description_nl: 'Traditionele Ayurvedische oliemassage voor het hele lichaam.',
    price: 80, duration: 60, image_url: '', display_order: 2 },
];

const USER = { id: 'u-test', email: 'test@example.com', name: 'Test User', role: 'client' };

async function stubBackend(page) {
  await page.route('**/api/services', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SERVICES) }));
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
  await page.route('**/api/appointments', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, appointment_id: 'appt-1' }) }));
  // Default: unauthenticated. Call stubAuth(page) AFTER this to override /auth/me.
  await page.route('**/api/auth/**', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'unauthenticated' }) }));
}

// Registered AFTER stubBackend so it takes precedence for /auth/me (most-recent route wins).
async function stubAuth(page, user = USER) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }));
}

// Seed the cart (localStorage) before the app loads. Items match SERVICES shape + quantity.
async function seedCart(page, items = [{ ...SERVICES[0], quantity: 1 }]) {
  await page.addInitScript((data) => {
    localStorage.setItem('cart', JSON.stringify(data));
  }, items);
}

module.exports = { stubBackend, stubAuth, seedCart, SERVICES, USER };
```

- [ ] **Step 2: Verify fixtures parse and existing suite still passes**

Run: `node -e "require('./tests/e2e/fixtures.js'); console.log('ok')"` → prints `ok`.
Run: `npx playwright test smoke` → 1 passed (per project; confirms harness unaffected).

- [ ] **Step 3: Commit**

```bash
git add frontend/tests/e2e/fixtures.js
git commit -m "test: fixtures for appointments stub, auth stub, cart seeding"
```

---

## Task 2: Cart refactor + E2E (depth A)

**Files:**
- Modify: `frontend/src/pages/Cart.js`
- Create: `frontend/tests/e2e/cart.spec.js`

**Interfaces:**
- Consumes: `Reveal`, `Stagger` (from `../components/common/`), fixtures `stubBackend`/`stubAuth`/`seedCart`/`SERVICES`.

- [ ] **Step 1: Refactor `Cart.js` (motion only; preserve all logic/testids)**

Imports to add:
```jsx
import Reveal from '../components/common/Reveal';
import Stagger from '../components/common/Stagger';
```
Changes (markup only — do NOT touch `handleConfirm`, the `/appointments` payload, `useCart`/`useAuth` usage, or any existing testid):
  1. Empty-cart state: wrap the inner `<div className="text-center">` in `<Reveal>`, and add `data-testid="cart-empty"` to that container (NEW testid).
  2. Treatment list: change the `<div className="space-y-4 mb-8">` wrapper to `<Stagger className="space-y-4 mb-8">`, and wrap each mapped cart item's outer `<div data-testid={`cart-item-${item.service_id}`} ...>` in a `<Reveal>` (Reveal is the mapped child with `key={item.service_id}`; move the `key` to the `Reveal`). Keep the item `<div>` and its testid unchanged inside.
  3. Scheduling/summary panel: wrap the `<div className="bg-muted p-8 rounded-2xl">` in `<Reveal>`.
Add a trailing newline.

- [ ] **Step 2: Write `frontend/tests/e2e/cart.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend, stubAuth, seedCart, SERVICES } = require('./fixtures');

test.describe('Cart', () => {
  test('empty cart shows empty state', async ({ page }) => {
    await stubBackend(page);
    await page.goto('/cart');
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('seeded cart renders item and removes it', async ({ page }) => {
    await stubBackend(page);
    await seedCart(page); // svc-consult, qty 1
    await page.goto('/cart');
    await expect(page.getByTestId(`cart-item-${SERVICES[0].service_id}`)).toBeVisible();
    await page.getByTestId(`remove-item-${SERVICES[0].service_id}`).click();
    await expect(page.getByTestId(`cart-item-${SERVICES[0].service_id}`)).toHaveCount(0);
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('unauthenticated confirm prompts login', async ({ page }) => {
    await stubBackend(page); // /auth/me -> 401, user null
    await seedCart(page);
    await page.goto('/cart');
    await page.locator('#appt-date').fill('2030-01-01');
    await page.locator('#appt-time').fill('10:00');
    await page.getByTestId('confirm-appointment-button').click();
    await expect(page.locator('[data-sonner-toast]')).toBeVisible(); // "please login" error toast
    await expect(page).toHaveURL(/\/cart$/); // no navigation
  });

  test('authed happy path books and navigates to dashboard', async ({ page }) => {
    await stubBackend(page);
    await stubAuth(page); // /auth/me -> 200 user (registered after stubBackend => wins)
    await seedCart(page);
    await page.goto('/cart');
    await page.locator('#appt-date').fill('2030-01-01');
    await page.locator('#appt-time').fill('10:00');
    await page.getByTestId('confirm-appointment-button').click();
    await expect(page).toHaveURL(/\/dashboard$/); // clearCart + navigate('/dashboard')
  });
});
```

- [ ] **Step 3: Run + build**

Run: `npx playwright test cart` → all pass (per project). Then `CI=true npx craco build` → compiles.
Note: if the "authed happy path" is flaky on the toast vs. navigation race, assert only the URL (navigation implies success); do not weaken to a trivial check.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Cart.js frontend/tests/e2e/cart.spec.js
git commit -m "feat(cart): reveal/stagger motion + full booking-flow E2E"
```

---

## Task 3: Legal pages (Privacy/Terms/Suggestions) + E2E

**Files:**
- Modify: `frontend/src/pages/Privacy.js`, `Terms.js`, `Suggestions.js`
- Create: `frontend/tests/e2e/legal.spec.js`

**Interfaces:**
- Consumes: `SectionHeading`, `Stagger`, `Reveal`.

- [ ] **Step 1: Refactor the three legal pages (motion only; copy byte-identical)**

For EACH of `Privacy.js`, `Terms.js`, `Suggestions.js`:
  1. Add imports: `import SectionHeading from '../components/common/SectionHeading';` `import Stagger from '../components/common/Stagger';` `import Reveal from '../components/common/Reveal';`
  2. Replace the `<h1 ...>{title}</h1>` with `<SectionHeading as="h1" align="left" title={<the same bilingual title expression>} className="mb-8" />` (keep the exact bilingual title text; `SectionHeading` renders the `h1`).
  3. Change the content wrapper `<div className="prose max-w-none ...">` to `<Stagger className="prose max-w-none text-muted-foreground leading-relaxed space-y-6">`, and wrap EACH top-level `<section>` inside it in a `<Reveal>` (keep each `<section>`'s inner content — headings, paragraphs, lists — byte-identical).
  4. Trailing newline.
Do NOT change any legal copy, `h2` text, or list items.

- [ ] **Step 2: Write `frontend/tests/e2e/legal.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

const pages = [
  { path: '/privacy', en: /Privacy Policy/i, nl: /Privacybeleid/i },
  { path: '/terms', en: /Terms & Conditions/i, nl: /Algemene Voorwaarden/i },
  { path: '/suggestions', en: /Suggestions & Feedback/i, nl: /Suggesties & Feedback/i },
];

for (const p of pages) {
  test(`legal page ${p.path} renders single h1`, async ({ page }) => {
    await stubBackend(page);
    await page.goto(p.path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`${p.en.source}|${p.nl.source}`));
  });
}
```

- [ ] **Step 3: Run + build**

Run: `npx playwright test legal` → 3 pass (per project). `CI=true npx craco build` → compiles.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Privacy.js frontend/src/pages/Terms.js frontend/src/pages/Suggestions.js frontend/tests/e2e/legal.spec.js
git commit -m "feat(legal): SectionHeading + staggered reveals on Privacy/Terms/Suggestions"
```

---

## Task 4: Auth pages (ResetPassword/VerifyEmail) + testids + E2E

**Files:**
- Modify: `frontend/src/pages/ResetPassword.js`, `VerifyEmail.js`
- Create: `frontend/tests/e2e/auth-pages.spec.js`

**Interfaces:**
- Consumes: `Reveal`. Preserves all token handling + POSTs. Adds testids: `reset-password-form`, `reset-submit`, `reset-invalid`, `verify-status`.

- [ ] **Step 1: Refactor `ResetPassword.js` (motion + testids; preserve logic)**
  1. Add `import Reveal from '../components/common/Reveal';`
  2. Invalid-link branch: add `data-testid="reset-invalid"` to its outer `<div>`.
  3. Valid branch: wrap the `<div className="w-full max-w-md bg-card ...">` in `<Reveal>`. Add `data-testid="reset-password-form"` to the `<form>` and `data-testid="reset-submit"` to the submit `<Button>`. Do NOT change `handleSubmit`, token read, validation, or the `/auth/reset-password` POST.
  4. Trailing newline.

- [ ] **Step 2: Refactor `VerifyEmail.js` (motion + testid; preserve logic)**
  1. Add `import Reveal from '../components/common/Reveal';`
  2. Wrap the inner `<div className="max-w-md">` in `<Reveal>`. Add `data-testid="verify-status"` to that container and `data-testid="verify-state"` with `data-state={status}` is NOT needed — instead keep it simple: add `data-testid="verify-status"` to the container; tests assert on the visible success/error heading text. Do NOT change the `useEffect` verify POST or token handling.
  3. Trailing newline.

- [ ] **Step 3: Write `frontend/tests/e2e/auth-pages.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test('reset-password invalid link (no token)', async ({ page }) => {
  await stubBackend(page);
  await page.goto('/reset-password');
  await expect(page.getByTestId('reset-invalid')).toBeVisible();
});

test('reset-password submits against stubbed endpoint', async ({ page }) => {
  await stubBackend(page);
  await page.route('**/api/auth/reset-password', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
  await page.goto('/reset-password?token=abc123');
  await expect(page.getByTestId('reset-password-form')).toBeVisible();
  await page.locator('#new-password').fill('secret123');
  await page.locator('#confirm-password').fill('secret123');
  await page.getByTestId('reset-submit').click();
  await expect(page.locator('[data-sonner-toast]')).toBeVisible(); // success toast, then navigate('/')
});

test('verify-email success against stubbed endpoint', async ({ page }) => {
  await stubBackend(page);
  await page.route('**/api/auth/verify-email', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'verified' }) }));
  await page.goto('/verify-email?token=abc123');
  await expect(page.getByRole('heading', { name: /Email verified|E-mail geverifieerd/ })).toBeVisible();
});
```
Note: the reset-password specific route is registered AFTER `stubBackend`'s `**/api/auth/**` (401) so it wins for that path.

- [ ] **Step 4: Run + build**

Run: `npx playwright test auth-pages` → all pass. `CI=true npx craco build` → compiles.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ResetPassword.js frontend/src/pages/VerifyEmail.js frontend/tests/e2e/auth-pages.spec.js
git commit -m "feat(auth-pages): reveal motion + testids for reset/verify + E2E"
```

---

## Task 5: NotFound + extend axe gate

**Files:**
- Modify: `frontend/src/pages/NotFound.js`, `frontend/tests/e2e/axe.spec.js`

**Interfaces:**
- Consumes: `Reveal`, `stubBackend`.

- [ ] **Step 1: Refactor `NotFound.js`**
  Add `import Reveal from '../components/common/Reveal';` and wrap the `<div className="text-center max-w-md">` in `<Reveal>`. No logic changes. Trailing newline.

- [ ] **Step 2: Extend `axe.spec.js` routes**
  Change the `pages` array to include the new routes:
  ```js
  const pages = ['/', '/services', '/about', '/contact', '/cart', '/privacy', '/terms', '/suggestions', '/reset-password?token=abc', '/verify-email?token=abc', '/no-such-page'];
  ```
  Keep the existing per-page axe logic (tags `wcag2a,wcag2aa,wcag21aa,wcag22aa`, filter serious/critical, `emulateMedia({ reducedMotion: 'reduce' })`, `stubBackend`). For `/verify-email?token=abc`, also register the verify-email stub inside the test so it doesn't sit on an error spinner — add before `goto`:
  ```js
  await page.route('**/api/auth/verify-email', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'verified' }) }));
  ```
  (Apply this route unconditionally in the beforeEach/loop; it only affects the verify-email page.)

- [ ] **Step 3: Run axe (multiple times) + fix violations**

Run: `npx playwright test axe` — fix any serious/critical violations on the new pages (keep fixes minimal/on-brand; no copy changes). Re-run until green across all viewports.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/NotFound.js frontend/tests/e2e/axe.spec.js
git commit -m "feat(404)+test(a11y): NotFound reveal, axe gate extended to remaining pages"
```

---

## Task 6: Extend screenshots + full-suite run

**Files:**
- Modify: `frontend/tests/e2e/screenshots.spec.js`

- [ ] **Step 1: Add the new pages to `screenshots.spec.js`**
  Extend the `pages` map:
  ```js
  const pages = {
    home: '/', services: '/services', about: '/about', contact: '/contact',
    cart: '/cart', privacy: '/privacy', terms: '/terms', suggestions: '/suggestions',
    'reset-password': '/reset-password?token=abc', 'verify-email': '/verify-email?token=abc',
    notfound: '/no-such-page',
  };
  ```
  Keep `emulateMedia({ reducedMotion: 'reduce' })` (deterministic) + `stubBackend`. For `cart`, call `seedCart(page)` before `goto` so the screenshot shows a populated cart; for `verify-email`, register the verify stub before `goto` (as in Task 5). Import `seedCart` from fixtures.

- [ ] **Step 2: Run the full suite across all viewports**

Run: `npx playwright test` → all specs pass on mobile/tablet/desktop; new screenshots written to `frontend/tests/e2e/__screenshots__/` (11 pages × 3 = 33 PNGs total).

- [ ] **Step 3: Commit**

```bash
git add frontend/tests/e2e/screenshots.spec.js frontend/tests/e2e/__screenshots__
git commit -m "test: responsive screenshots for remaining public pages"
```

---

## Self-Review

**Spec coverage:** Cart (Task 2, depth-A E2E incl. authed happy path via stubAuth), legal trio (Task 3), auth pages + testids (Task 4), NotFound (Task 5), axe gate extended to all 7 new routes (Task 5), screenshots (Task 6), fixtures for appointments/auth/cart-seed (Task 1). Reduced-motion via primitives only — enforced per task. ✅

**Placeholder scan:** No TBD/TODO; all specs have concrete code; page edits reference exact wrappers/testids. ✅

**Type/name consistency:** `stubBackend`/`stubAuth`/`seedCart`/`SERVICES`/`USER` defined in Task 1, used consistently in Tasks 2/5/6. New testids (`cart-empty`, `reset-password-form`, `reset-submit`, `reset-invalid`, `verify-status`) defined where added (Tasks 2/4) and consumed in the same task's spec. Existing testids reused, never renamed. Route-precedence rule (stubAuth after stubBackend) stated in Global Constraints and applied in Tasks 2/4. ✅
