# UI Modernization — Core Public Pages

**Date:** 2026-07-20
**Scope:** First increment. Core public pages of Priiyanka's Nature Nest.
**Status:** Approved design.

## Goal

Elevate the UI/UX of the core public pages **without changing any business
functionality**. Keep the existing nature/Ayurvedic identity defined in
`design_guidelines.json`. Improve visual hierarchy, spacing, typography, motion,
responsiveness, accessibility (WCAG 2.2 AA), and component reuse. Add an
automated Playwright test suite.

## Constraints (hard)

- **No build or language migration.** Stay on Create React App + CRACO,
  JavaScript/JSX. No Vite, no TypeScript.
- **No backend changes.** Python backend, routes, and API contracts untouched.
- **No functional changes.** Routes, API calls, cart/auth logic, i18n strings,
  and `data-testid` values stay as-is (may *add* testids, never rename existing).
- **On-brand only.** Hand-craft within the existing shadcn/ui + Tailwind setup
  using `design_guidelines.json` tokens. 21st.dev / magicui MCP are
  reference-only, not a component source.

## In scope

Pages: **Home, Services, Contact, About**. Shared: **Navbar, Footer**.

Out of scope this increment: Cart, Dashboard, Admin, Privacy, Terms,
Suggestions, ResetPassword, VerifyEmail, NotFound, auth flows.

## Design

### 1. Reusable component layer — `src/components/common/`

Each unit has one purpose, a clear prop interface, and is testable in isolation.

- **`Section`** — standard container (`max-w-7xl mx-auto px-6 md:px-12`) and
  vertical rhythm (`py-20 md:py-32`). Props: `as`, `background` variant
  (`default` | `card` | `muted`), `id`, `className`.
- **`SectionHeading`** — optional eyebrow (uppercase small), `h2` (or
  configurable level), optional subtitle. Replaces duplicated header blocks on
  Home and Services. Props: `eyebrow`, `title`, `subtitle`, `align`, `as`.
- **`Reveal`** — Framer Motion scroll-in wrapper (fade + rise). No-op under
  `prefers-reduced-motion`. Props: `delay`, `y`, `once`, `className`.
- **`Stagger`** — container that staggers children `Reveal`s. Props:
  `staggerChildren`, `className`.
- **`FeatureCard`** — icon + title + description card (Home "Why Choose Us").
- **`ServiceCard`** — service image/title/price/duration/add-to-cart card
  extracted from `Services.js`. Preserves all existing `data-testid`s and cart
  behavior exactly.

### 2. Motion (Framer Motion)

Library already installed (`framer-motion` ^12). Add:
- Hero content entrance: fade + rise on mount.
- Feature/service cards: staggered scroll reveal via `Reveal`/`Stagger`.
- Hero image: subtle scale/parallax (transform only, no layout shift).
- Cards: hover lift (`translateY`/shadow) — enhances existing hover.
- Mobile menu: animated expand/collapse; cart badge: pop on change.

Rules: every animation gated on `prefers-reduced-motion` (a
`useReducedMotion`-based helper in `Reveal`/`Stagger` returns static variants);
no animation that shifts layout or delays content visibility; durations
150–500ms with easing consistent with `design_guidelines.json`.

### 3. Accessibility (WCAG 2.2 AA)

- Add a **skip-to-content link** and a `<main id="main">` landmark in the app
  layout (`App.js`).
- **Contrast audit**: verify `muted_foreground` (#5C6B5D) on `background`
  (#F5EBDD) and `card`, and the `accent` button (#926F3F bg, white text). If any
  pair fails AA (4.5:1 text / 3:1 large), adjust the token value minimally to
  pass; document the change.
- **Heading order**: one `h1` per page, no skipped levels.
- **Focus**: focus-visible on every interactive element (extend existing
  `focusRing` pattern); ensure focus is not obscured by the sticky nav
  (scroll-margin / offset) — WCAG 2.2 "Focus Not Obscured".
- **Motion**: `prefers-reduced-motion` honored globally.
- Automated **axe** pass in the Playwright suite; fix reported violations.

### 4. Hierarchy / spacing / typography

- Apply the `design_guidelines.json` type scale consistently via
  `SectionHeading` and shared classes.
- Add section eyebrows for scan-ability.
- Strengthen hero (stronger heading treatment, clearer CTA) and Home feature
  grid; consistent vertical rhythm across sections.
- Standardize on `Section` spacing to remove ad-hoc `py-*` values.

### 5. Testing (Playwright)

- Add `@playwright/test` as a **devDependency**; add `playwright.config.js`
  (baseURL to the CRA dev server on `:3000`) and an npm script `test:e2e`.
- Tests run against the frontend dev server with **backend network calls
  stubbed** via `page.route` (Services list, Contact submit) so they are
  deterministic without the Python backend.
- Specs cover: navigation between core pages, language switch, Services renders
  from stubbed data + add-to-cart updates badge, Contact form validation +
  stubbed submit, mobile menu open/close, and an **axe accessibility** assertion
  per page.
- Screenshots captured at **375 / 768 / 1440** for each page (deliverable).
- Also drive the app live via the Playwright MCP for visual eyeballing.

## Data flow (unchanged)

Pages consume `LanguageContext` (`t`, `language`), `CartContext`, `AuthContext`,
and `axios` against `API` as they do today. New components are presentational
and receive data via props; they introduce no new data sources.

## Verification / success criteria

- All four pages + Navbar/Footer render identically in behavior; every existing
  `data-testid`, route, and API call still works.
- Framer Motion animations present and disabled under reduced-motion.
- axe reports zero AA violations on the four pages.
- Responsive at 375/768/1440 with screenshots.
- `test:e2e` suite passes locally.
- No changes outside frontend `src/`, `frontend/package.json`,
  `playwright.config.js`, and `tests/`.

## Risks

- **Contrast token change** could subtly shift brand color — mitigate with
  minimal adjustment, documented, screenshot before/after.
- **Component extraction regressions** — mitigate by preserving markup/testids
  and verifying via Playwright.
- **CRA + @playwright/test coexistence** — Playwright is standalone (its own
  runner); no conflict with `craco test` (Jest).
