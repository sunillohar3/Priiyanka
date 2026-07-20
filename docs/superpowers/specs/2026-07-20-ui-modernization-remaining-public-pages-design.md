# UI Modernization — Remaining Public Pages

**Date:** 2026-07-20
**Scope:** Second increment. The remaining public-facing pages.
**Status:** Approved design.

## Goal

Extend the elevation treatment from the core-pages increment to the remaining
public pages, **without changing business functionality**. Same identity, same
reusable primitives, reduced-motion-safe motion, WCAG 2.2 AA, Playwright E2E.

## Constraints (hard)

- Stay on **CRA + CRACO + JavaScript/JSX**. No Vite, no TypeScript.
- **No backend changes.** **No functional changes**: routes, API calls
  (`/appointments`, `/auth/*`), cart/auth logic, and i18n strings unchanged.
  Existing `data-testid`s must not be renamed (new ones may be added).
- **On-brand only**: reuse existing primitives + design tokens. No hardcoded hex.
- All animation gated on `prefers-reduced-motion` via the existing primitives
  (never a raw `motion.*` — framer-motion's JS-driven props are NOT disabled by
  the CSS guard; only `Reveal`/`Stagger` are safe).

## In scope

Pages: **Cart, Privacy, Terms, Suggestions, ResetPassword, VerifyEmail,
NotFound**. Out of scope: Dashboard, Admin (different design language — internal
tooling), backend.

## Reuse (no new design language)

Reuse `Section`, `SectionHeading`, `Reveal`, `Stagger` from
`src/components/common/`. A small shared wrapper for the three legal pages
(`LegalSection` or a `Prose` container) MAY be introduced only if it removes
real duplication without contorting content — decide during planning (YAGNI).

## Design (per page)

- **Cart** (business-critical; posts to `/appointments`): wrap the treatment
  list in `Stagger` (each item a `Reveal`), reveal the scheduling/summary panel,
  animate the empty-cart state with a single `Reveal`. Preserve exactly:
  `handleConfirm`, the `/appointments` POST payload + `withCredentials`,
  cart/auth logic, and testids `cart-title`, `cart-item-<id>`,
  `remove-item-<id>`, `confirm-appointment-button`. No copy changes.
- **Privacy / Terms / Suggestions** (static text): `SectionHeading` for the
  `h1`; `Stagger`/`Reveal` the `<section>` blocks. Preserve all legal copy
  verbatim and the existing `h1 → h2` hierarchy.
- **ResetPassword / VerifyEmail** (token-driven auth utilities): `Reveal` the
  card/result. **Preserve token handling and the `/auth/reset-password` /
  `/auth/verify-email` POSTs verbatim.** Add `data-testid`s (currently none) to
  enable E2E — e.g. `reset-password-form`, `reset-submit`, `verify-status`.
- **NotFound**: a single `Reveal` around the content. No logic.

## Accessibility (WCAG 2.2 AA)

Extend the axe gate to `/cart`, `/privacy`, `/terms`, `/suggestions`,
`/reset-password`, `/verify-email`, and a 404 route (`/no-such-page`). Zero
serious/critical violations; fix any found. Preserve/verify one `h1` per page.

## Testing (Playwright, backend stubbed)

Extend `tests/e2e/fixtures.js`:
- Add an `/appointments` stub (200) to `stubBackend`.
- Add a `stubAuth(page, user)` helper (or `authedStubBackend`) that registers
  `**/api/auth/me` → 200 with a user object. Because Playwright matches the
  most-recently-registered route first, calling this AFTER `stubBackend` (which
  stubs `**/api/auth/**` → 401) overrides `/auth/me` for the authed path.

New/extended specs:
- **cart.spec.js** — depth A (full flow):
  - empty-cart state renders + "continue shopping" link;
  - seed cart via `/services` add-to-cart, navigate to `/cart`, item renders,
    `remove-item-<id>` removes it;
  - unauthenticated confirm → "please login" toast (default 401 auth);
  - missing date/time → validation toast;
  - **authed happy path**: `stubAuth` returns a user, fill date/time, click
    `confirm-appointment-button`, stubbed `/appointments` 200 → success toast +
    cart cleared + navigation to `/dashboard`.
- **legal.spec.js** — `/privacy`, `/terms`, `/suggestions` each render their
  `h1` and content; single `h1`.
- **auth-pages.spec.js** — `/reset-password?token=abc` renders the form and
  submits against a stubbed `/auth/reset-password`; `/verify-email?token=abc`
  shows success against a stubbed `/auth/verify-email`; invalid-link states
  (no token) render.
- **axe.spec.js** — add the 7 routes above.
- **screenshots.spec.js** — add the new pages (captured at 375/768/1440).

## Verification / success criteria

- All 7 pages behave identically; every existing route, API call, and
  `data-testid` still works; the `/appointments` booking payload is unchanged.
- Motion present and disabled under reduced motion (via primitives only).
- axe: zero serious/critical on all new routes.
- Full E2E suite passes across the 3 viewports; new screenshots produced.
- Changes confined to `frontend/src/pages/*`, `frontend/src/components/common/*`
  (if a shared legal wrapper is added), and `frontend/tests/`.

## Risks

- **Cart booking flow** is the one business-critical path — mitigate by
  preserving `handleConfirm`/payload/testids verbatim and covering it with the
  depth-A E2E (authed happy path + validation + unauth).
- **Auth-page token handling** — preserve verbatim; E2E stubs the token POSTs.
- **Legal-page copy** — must stay byte-identical; only wrappers change.
