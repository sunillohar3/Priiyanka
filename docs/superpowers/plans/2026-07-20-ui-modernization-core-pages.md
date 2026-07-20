# Core-Pages UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the UI/UX (hierarchy, spacing, type, motion, a11y, reuse) of Home/Services/Contact/About + Navbar/Footer without changing any business functionality, and add an automated Playwright test suite.

**Architecture:** Introduce a small presentational component layer in `src/components/common/` (layout + motion wrappers + extracted cards), refactor the four pages to consume it, add Framer Motion (reduced-motion-aware), close WCAG 2.2 AA gaps, and verify everything with Playwright E2E + axe + responsive screenshots. Backend calls are stubbed in tests via `page.route`.

**Tech Stack:** React 18 (CRA + CRACO, JavaScript/JSX), Tailwind 3.4, shadcn/ui (Radix), framer-motion ^12, lucide-react, @playwright/test (new devDependency), @axe-core/playwright (new devDependency).

## Global Constraints

- Stack stays **CRA + CRACO + JavaScript/JSX**. No Vite, no TypeScript. (verbatim from spec)
- **No backend changes**; Python routes/API contracts untouched.
- **No functional changes**: routes, API calls, cart/auth logic, i18n strings unchanged. Existing `data-testid` values must not be renamed (adding new ones is fine).
- **On-brand only**: hand-craft within existing shadcn/ui + Tailwind tokens from `design_guidelines.json` / `tailwind.config.js`. 21st.dev / magicui MCP = reference only.
- Every animation gated on `prefers-reduced-motion`; no layout-shifting or content-delaying animation.
- Design tokens (exact, from `tailwind.config.js`): `primary #0A4F2A`, `secondary #3A8B3A`, `accent #926F3F`, `background #F5EBDD`, `foreground #2C3E2D`, `muted #E8DFD0` / `muted.foreground #4A5A4B`, `card #FFFFFF`, `border #D2C4B0`, `ring #3A8B3A`. Fonts: heading `Playfair Display`, body `Manrope`.
- All commands run from `frontend/` unless noted. Dev server: `yarn start` on `http://localhost:3000`.

---

## File Structure

**Create:**
- `frontend/src/lib/motionVariants.js` — reduced-motion-aware Framer Motion variant factory (pure, unit-testable).
- `frontend/src/lib/motionVariants.test.js` — Jest unit test for the above.
- `frontend/src/components/common/Reveal.jsx` — scroll-in motion wrapper.
- `frontend/src/components/common/Stagger.jsx` — staggering container.
- `frontend/src/components/common/Section.jsx` — layout container + rhythm.
- `frontend/src/components/common/SectionHeading.jsx` — eyebrow + heading + subtitle.
- `frontend/src/components/common/FeatureCard.jsx` — Home feature card.
- `frontend/src/components/common/ServiceCard.jsx` — Services card (extracted).
- `frontend/playwright.config.js`
- `frontend/tests/e2e/*.spec.js` — E2E specs.
- `frontend/tests/e2e/fixtures.js` — shared stub/route helpers.

**Modify:**
- `frontend/src/App.js` — skip link + `<main id="main">` landmark.
- `frontend/src/index.css` — skip-link styles + global reduced-motion safety.
- `frontend/src/pages/Home.js`, `Services.js`, `Contact.js`, `About.js`
- `frontend/src/components/Navbar.js`, `Footer.js`
- `frontend/package.json` — devDependencies + `test:e2e` script.

---

## Task 1: Playwright harness + smoke test

**Files:**
- Modify: `frontend/package.json` (devDependencies, scripts)
- Create: `frontend/playwright.config.js`, `frontend/tests/e2e/fixtures.js`, `frontend/tests/e2e/smoke.spec.js`

**Interfaces:**
- Produces: `test:e2e` script; `stubBackend(page)` helper in `fixtures.js` that intercepts `**/api/**` GET/POST with deterministic JSON.

- [ ] **Step 1: Install Playwright + axe as devDependencies**

Run:
```bash
yarn add -D @playwright/test@^1.48 @axe-core/playwright@^4.10
npx playwright install chromium
```

- [ ] **Step 2: Create `frontend/playwright.config.js`**

```js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'yarn start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
    env: { BROWSER: 'none' },
  },
});
```

- [ ] **Step 3: Create `frontend/tests/e2e/fixtures.js`**

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

async function stubBackend(page) {
  await page.route('**/api/services', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SERVICES) }));
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
  // Auth "me" and any other GETs default to empty/unauthenticated.
  await page.route('**/api/auth/**', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'unauthenticated' }) }));
}

module.exports = { stubBackend, SERVICES };
```

- [ ] **Step 4: Add script to `frontend/package.json`**

In `"scripts"` add:
```json
"test:e2e": "playwright test"
```

- [ ] **Step 5: Write smoke spec `frontend/tests/e2e/smoke.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test.beforeEach(async ({ page }) => { await stubBackend(page); });

test('home renders hero and nav', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('hero-section')).toBeVisible();
  await expect(page.getByTestId('logo-link')).toBeVisible();
});
```

- [ ] **Step 6: Run smoke test**

Run: `yarn test:e2e smoke`
Expected: 1 passed. (Playwright starts the dev server automatically.)

- [ ] **Step 7: Ignore artifacts + commit**

Append to `frontend/.gitignore` (create if absent): `/test-results/`, `/playwright-report/`, `/tests/e2e/__screenshots__/` is kept (screenshots are deliverables — do NOT ignore).
```bash
git add frontend/package.json frontend/yarn.lock frontend/playwright.config.js frontend/tests frontend/.gitignore
git commit -m "test: add Playwright harness with backend stubs and smoke test"
```

---

## Task 2: Motion foundation (`motionVariants` + Reveal + Stagger)

**Files:**
- Create: `frontend/src/lib/motionVariants.js`, `frontend/src/lib/motionVariants.test.js`
- Create: `frontend/src/components/common/Reveal.jsx`, `frontend/src/components/common/Stagger.jsx`

**Interfaces:**
- Produces:
  - `revealVariants(reduced: boolean, y?: number) => { hidden, visible }`
  - `staggerVariants(reduced: boolean, stagger?: number) => { hidden, visible }`
  - `<Reveal delay={0} y={24} once className>` — wraps children in `motion.div`, animates on scroll-in.
  - `<Stagger className>` — `motion.div` parent that staggers child `<Reveal>`s.

- [ ] **Step 1: Write failing unit test `frontend/src/lib/motionVariants.test.js`**

```js
const { revealVariants, staggerVariants } = require('./motionVariants');

test('reveal hides with offset when motion allowed', () => {
  const v = revealVariants(false, 24);
  expect(v.hidden).toEqual({ opacity: 0, y: 24 });
  expect(v.visible.opacity).toBe(1);
  expect(v.visible.y).toBe(0);
});

test('reveal is static (no offset, instant) under reduced motion', () => {
  const v = revealVariants(true, 24);
  expect(v.hidden).toEqual({ opacity: 1, y: 0 });
  expect(v.visible).toEqual({ opacity: 1, y: 0 });
});

test('stagger delay is zero under reduced motion', () => {
  expect(staggerVariants(true, 0.1).visible.transition.staggerChildren).toBe(0);
  expect(staggerVariants(false, 0.1).visible.transition.staggerChildren).toBe(0.1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true yarn test motionVariants --watchAll=false`
Expected: FAIL — "Cannot find module './motionVariants'".

- [ ] **Step 3: Implement `frontend/src/lib/motionVariants.js`**

```js
// Pure, reduced-motion-aware Framer Motion variant factories.
// When `reduced` is true, elements are fully visible and static — no motion.
export function revealVariants(reduced, y = 24) {
  if (reduced) return { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } };
  return {
    hidden: { opacity: 0, y },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };
}

export function staggerVariants(reduced, stagger = 0.1) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : stagger } },
  };
}
```

Note: the test uses `require`; ESM `export` is interop-compatible under CRA's Babel/Jest. Verify in Step 4.

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true yarn test motionVariants --watchAll=false`
Expected: 3 passed.

- [ ] **Step 5: Implement `frontend/src/components/common/Reveal.jsx`**

```jsx
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { revealVariants } from '../../lib/motionVariants';

const Reveal = ({ children, delay = 0, y = 24, once = true, className, ...rest }) => {
  const reduced = useReducedMotion();
  const variants = revealVariants(reduced, y);
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2 }}
      transition={{ delay: reduced ? 0 : delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
```

- [ ] **Step 6: Implement `frontend/src/components/common/Stagger.jsx`**

```jsx
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerVariants } from '../../lib/motionVariants';

const Stagger = ({ children, stagger = 0.1, className, ...rest }) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={staggerVariants(reduced, stagger)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default Stagger;
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/motionVariants.js frontend/src/lib/motionVariants.test.js frontend/src/components/common/Reveal.jsx frontend/src/components/common/Stagger.jsx
git commit -m "feat: reduced-motion-aware Reveal/Stagger motion primitives"
```

---

## Task 3: Layout primitives (`Section` + `SectionHeading`)

**Files:**
- Create: `frontend/src/components/common/Section.jsx`, `frontend/src/components/common/SectionHeading.jsx`

**Interfaces:**
- Produces:
  - `<Section as="section" background="default|card|muted" id className>` → outer element with bg + `py-20 md:py-32`, inner `max-w-7xl mx-auto px-6 md:px-12`.
  - `<SectionHeading eyebrow title subtitle align="center|left" as="h2" className>` → renders optional eyebrow (`<p>` uppercase), heading at `as`, optional subtitle.

- [ ] **Step 1: Implement `frontend/src/components/common/Section.jsx`**

```jsx
import React from 'react';
import { cn } from '../../lib/utils';

const BG = {
  default: '',
  card: 'bg-card',
  muted: 'bg-muted',
};

const Section = ({ as: Tag = 'section', background = 'default', id, className, innerClassName, children, ...rest }) => (
  <Tag id={id} className={cn('py-20 md:py-32', BG[background], className)} {...rest}>
    <div className={cn('max-w-7xl mx-auto px-6 md:px-12', innerClassName)}>{children}</div>
  </Tag>
);

export default Section;
```

- [ ] **Step 2: Implement `frontend/src/components/common/SectionHeading.jsx`**

```jsx
import React from 'react';
import { cn } from '../../lib/utils';
import Reveal from './Reveal';

const SectionHeading = ({ eyebrow, title, subtitle, align = 'center', as: Tag = 'h2', className }) => (
  <Reveal className={cn(align === 'center' ? 'text-center mx-auto' : 'text-left', 'max-w-2xl mb-12 md:mb-16', className)}>
    {eyebrow && (
      <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-3">{eyebrow}</p>
    )}
    <Tag className="text-4xl md:text-5xl font-heading font-semibold text-foreground tracking-tight">{title}</Tag>
    {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
  </Reveal>
);

export default SectionHeading;
```

- [ ] **Step 3: Verify build compiles**

Run: `CI=true yarn build`
Expected: "Compiled successfully" (or with only pre-existing warnings; no new errors referencing these files).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/common/Section.jsx frontend/src/components/common/SectionHeading.jsx
git commit -m "feat: Section and SectionHeading layout primitives"
```

---

## Task 4: Skip link + main landmark (a11y)

**Files:**
- Modify: `frontend/src/App.js` (AppRouter, lines ~28-49)
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: a `#main` landmark and a keyboard-reachable skip link targeting it. E2E asserts skip link becomes visible on focus.

- [ ] **Step 1: Add skip link + `<main>` in `App.js`**

Replace the `AppRouter` return block so the structure is:
```jsx
  return (
    <>
      <a href="#main" className="skip-link" data-testid="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main">
        <Routes>
          {/* ...unchanged routes... */}
        </Routes>
      </main>
      <Footer />
    </>
  );
```
(Keep every existing `<Route>` line exactly as-is inside `<Routes>`.)

- [ ] **Step 2: Add skip-link styles to `frontend/src/index.css`** (inside the first `@layer base`, after the `body` rule)

```css
  .skip-link {
    position: absolute;
    left: 0.75rem;
    top: -3rem;
    z-index: 100;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background: #0A4F2A;
    color: #FFFFFF;
    transition: top 0.15s ease;
  }
  .skip-link:focus {
    top: 0.75rem;
    outline: 2px solid #3A8B3A;
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
  }
```

- [ ] **Step 3: Write E2E `frontend/tests/e2e/a11y-nav.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test('skip link appears on focus and jumps to main', async ({ page }) => {
  await stubBackend(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByTestId('skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});
```

- [ ] **Step 4: Run**

Run: `yarn test:e2e a11y-nav`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.js frontend/src/index.css frontend/tests/e2e/a11y-nav.spec.js
git commit -m "feat(a11y): skip-to-content link, main landmark, reduced-motion guard"
```

---

## Task 5: FeatureCard + Home refactor

**Files:**
- Create: `frontend/src/components/common/FeatureCard.jsx`
- Modify: `frontend/src/pages/Home.js`
- Create: `frontend/tests/e2e/home.spec.js`

**Interfaces:**
- Consumes: `Section`, `SectionHeading`, `Reveal`, `Stagger` from Tasks 2–3.
- Produces: `<FeatureCard icon={Icon} title description />`.

- [ ] **Step 1: Implement `FeatureCard.jsx`**

```jsx
import React from 'react';
import Reveal from './Reveal';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <Reveal className="h-full">
    <div className="h-full bg-background p-8 rounded-2xl border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {Icon && <Icon className="w-12 h-12 text-primary mb-4" aria-hidden="true" />}
      <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </Reveal>
);

export default FeatureCard;
```

- [ ] **Step 2: Refactor `Home.js`** — keep all imports/`features` array/`useSEO`/i18n strings. Replace the two lower `<section>` blocks (the "Why Choose Us" grid and the About teaser) and wrap the hero content in motion. Changes:

  1. Add imports:
  ```jsx
  import { motion } from 'framer-motion';
  import Section from '../components/common/Section';
  import SectionHeading from '../components/common/SectionHeading';
  import Stagger from '../components/common/Stagger';
  import Reveal from '../components/common/Reveal';
  import FeatureCard from '../components/common/FeatureCard';
  ```

  2. Hero: wrap the inner `<div className="relative z-10 ...">` content children in `motion` with an entrance. Replace that inner block with:
  ```jsx
  <motion.div
    className="relative z-10 text-center px-6 max-w-4xl"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
  >
    <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-6">{t('hero.title')}</h1>
    <p className="text-xl md:text-2xl text-white/90 mb-8">{t('hero.subtitle')}</p>
    <Link to="/services">
      <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-12 py-6 text-lg shadow-2xl" data-testid="hero-cta-button">
        {t('hero.cta')}
      </Button>
    </Link>
  </motion.div>
  ```
  (Framer Motion `animate` on mount is fine here; it does not delay content for reduced-motion users because the reduced-motion CSS guard from Task 4 forces instant transitions.)

  3. "Why Choose Us" section → replace the whole `<section className="py-20 md:py-32 bg-card">...</section>` with:
  ```jsx
  <Section background="card">
    <SectionHeading
      eyebrow={language === 'en' ? 'Our Promise' : 'Onze Belofte'}
      title={language === 'en' ? 'Why Choose Us' : 'Waarom Voor Ons Kiezen'}
      subtitle={language === 'en'
        ? 'Experience authentic Ayurvedic care in the heart of the Netherlands'
        : 'Ervaar authentieke Ayurvedische zorg in het hart van Nederland'}
    />
    <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {features.map((feature, index) => (
        <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
      ))}
    </Stagger>
  </Section>
  ```

  4. About-teaser section → replace outer `<section className="py-20 md:py-32">` wrapper with `<Section>` and wrap the text column and image column each in `<Reveal>` (image `<Reveal delay={0.1}>`). Keep all inner text/links/`img` exactly as-is.

- [ ] **Step 3: Write E2E `frontend/tests/e2e/home.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test.beforeEach(async ({ page }) => { await stubBackend(page); });

test('home has single h1 and CTA links to services', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByTestId('hero-cta-button').click();
  await expect(page).toHaveURL(/\/services$/);
});

test('feature cards render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Why Choose Us|Waarom Voor Ons Kiezen/ })).toBeVisible();
});
```

- [ ] **Step 4: Run + verify build**

Run: `yarn test:e2e home` then `CI=true yarn build`
Expected: 2 passed; build compiles.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/common/FeatureCard.jsx frontend/src/pages/Home.js frontend/tests/e2e/home.spec.js
git commit -m "feat(home): Section/SectionHeading/FeatureCard refactor + motion"
```

---

## Task 6: ServiceCard + Services refactor

**Files:**
- Create: `frontend/src/components/common/ServiceCard.jsx`
- Modify: `frontend/src/pages/Services.js`
- Create: `frontend/tests/e2e/services.spec.js`

**Interfaces:**
- Consumes: `Reveal`, `Stagger`, `Section`, `SectionHeading`.
- Produces: `<ServiceCard service language t isInCart onAdd />` — preserves testids `service-card-<id>`, `add-to-cart-<id>`, `in-cart-<id>`.

- [ ] **Step 1: Implement `ServiceCard.jsx`** (markup lifted verbatim from `Services.js` lines 91-148, wrapped in `Reveal`, with the click delegated to `onAdd`)

```jsx
import React from 'react';
import { ShoppingCart, Clock, Euro, Check } from 'lucide-react';
import { Button } from '../ui/button';
import Reveal from './Reveal';

const ServiceCard = ({ service, language, t, isInCart, onAdd }) => {
  const name = language === 'en' ? service.name_en : service.name_nl;
  const description = language === 'en' ? service.description_en : service.description_nl;
  return (
    <Reveal className="h-full">
      <div
        className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-border group flex flex-col h-full"
        data-testid={`service-card-${service.service_id}`}
      >
        {service.image_url && (
          <div className="h-48 overflow-hidden flex-shrink-0">
            <img src={service.image_url} alt={name} loading="lazy" decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-2xl font-heading font-semibold text-foreground mb-2">{name}</h3>
          <p className="text-muted-foreground mb-6">{description}</p>
          <div className="flex items-center gap-4 mb-6 mt-auto text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{service.duration} {t('services.minutes')}</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-primary text-lg">
              <Euro className="w-5 h-5" aria-hidden="true" />
              <span>{service.price.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isInCart(service.service_id) ? (
              <Button disabled className="flex-1 bg-secondary text-secondary-foreground rounded-full disabled:opacity-100" data-testid={`in-cart-${service.service_id}`}>
                <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                {language === 'en' ? 'In cart' : 'In winkelwagen'}
              </Button>
            ) : (
              <Button onClick={() => onAdd(service)} className="flex-1 bg-primary text-primary-foreground hover:bg-secondary rounded-full" data-testid={`add-to-cart-${service.service_id}`}>
                <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('services.addToCart')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
};

export default ServiceCard;
```

- [ ] **Step 2: Refactor `Services.js`** — keep `fetchServices`, `handleAddToCart`, loading state, i18n. Replace the header `<div className="text-center mb-16">` with `SectionHeading`, and the `.map` body with `ServiceCard` inside `Stagger`:
  1. Add imports: `SectionHeading`, `Stagger`, `ServiceCard` from `../components/common/...`.
  2. Header block → 
  ```jsx
  <SectionHeading
    as="h1"
    eyebrow={language === 'en' ? 'Treatments' : 'Behandelingen'}
    title={t('services.title')}
    subtitle={t('services.subtitle')}
    className="mb-12"
  />
  ```
  (Note: `SectionHeading` must render `data-testid="services-header"` here — add a `data-testid` passthrough prop to `SectionHeading` OR keep a wrapping `<div data-testid="services-header">` around it. Choose the wrapping div to avoid changing the component API.)
  3. Grid → wrap the existing `<div className="grid ...">` contents:
  ```jsx
  <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {services.map((service) => (
      <ServiceCard key={service.service_id} service={service} language={language} t={t}
        isInCart={isInCart} onAdd={handleAddToCart} />
    ))}
  </Stagger>
  ```

- [ ] **Step 3: Write E2E `frontend/tests/e2e/services.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend, SERVICES } = require('./fixtures');

test.beforeEach(async ({ page }) => { await stubBackend(page); });

test('renders stubbed services and adds to cart', async ({ page }) => {
  await page.goto('/services');
  await expect(page.getByTestId(`service-card-${SERVICES[0].service_id}`)).toBeVisible();
  await page.getByTestId(`add-to-cart-${SERVICES[0].service_id}`).click();
  await expect(page.getByTestId('cart-link')).toContainText('1');
  await expect(page.getByTestId(`in-cart-${SERVICES[0].service_id}`)).toBeVisible();
});
```

- [ ] **Step 4: Run**

Run: `yarn test:e2e services`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/common/ServiceCard.jsx frontend/src/pages/Services.js frontend/tests/e2e/services.spec.js
git commit -m "feat(services): extract ServiceCard + staggered reveal"
```

---

## Task 7: Contact refactor + form a11y

**Files:**
- Modify: `frontend/src/pages/Contact.js`
- Create: `frontend/tests/e2e/contact.spec.js`

**Interfaces:**
- Consumes: `Section`, `Reveal`. Preserves testids `contact-form`, `contact-submit`.

- [ ] **Step 1: Refactor `Contact.js`**
  1. Add imports: `Reveal` from `../components/common/Reveal`.
  2. Wrap page header `<div className="text-center mb-16">` in `<Reveal>`.
  3. Wrap the form card `<div className="bg-card p-8 ...">` in `<Reveal>` and the contact-details column blocks in `<Reveal delay={0.1}>`.
  4. Add basic invalid-state a11y to the three required inputs (name/email/message): add `aria-required="true"`. Keep native `required`; do NOT add custom validation (no behavior change).

- [ ] **Step 2: Write E2E `frontend/tests/e2e/contact.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test.beforeEach(async ({ page }) => { await stubBackend(page); });

test('contact form submits against stubbed backend', async ({ page }) => {
  await page.goto('/contact');
  await page.getByTestId('contact-form').getByLabel(/name|naam/i).first().fill('Test User');
  await page.locator('#contact-email').fill('test@example.com');
  await page.locator('#contact-message').fill('Hello, I would like a consultation.');
  await page.getByTestId('contact-submit').click();
  // Sonner success toast appears
  await expect(page.locator('[data-sonner-toast]')).toBeVisible();
});
```

- [ ] **Step 3: Run**

Run: `yarn test:e2e contact`
Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Contact.js frontend/tests/e2e/contact.spec.js
git commit -m "feat(contact): reveal motion + input aria-required"
```

---

## Task 8: About refactor

**Files:**
- Modify: `frontend/src/pages/About.js`
- Create: `frontend/tests/e2e/about.spec.js`

**Interfaces:**
- Consumes: `Section`, `Reveal`.

- [ ] **Step 1: Refactor `About.js`**
  1. Add imports: `Reveal`.
  2. Wrap the header block, the profile-image block, and each of the four `<section>` cards in `<Reveal>` (stagger visually by leaving default settings; they reveal as scrolled into view). Keep all copy/credentials/i18n exactly as-is.
  3. Add `aria-hidden="true"` to the decorative lucide icons (`Award`, `BookOpen`, `Shield`) — they are adjacent to text headings.

- [ ] **Step 2: Write E2E `frontend/tests/e2e/about.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test('about has a single h1', async ({ page }) => {
  await stubBackend(page);
  await page.goto('/about');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Priiyanka Singh/);
});
```

- [ ] **Step 3: Run**

Run: `yarn test:e2e about`
Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/About.js frontend/tests/e2e/about.spec.js
git commit -m "feat(about): reveal motion + decorative icon aria-hidden"
```

---

## Task 9: Navbar/Footer motion polish

**Files:**
- Modify: `frontend/src/components/Navbar.js`, `frontend/src/components/Footer.js`

**Interfaces:**
- Consumes: `framer-motion` (`motion`, `AnimatePresence`), `Reveal`. No testid/behavior changes.

- [ ] **Step 1: Animate the mobile menu in `Navbar.js`**
  1. Add import: `import { motion, AnimatePresence } from 'framer-motion';`
  2. Replace the `{mobileOpen && (<div id="mobile-menu" ...>...</div>)}` block: wrap in `<AnimatePresence>` and change the outer `<div>` to `motion.div` with:
  ```jsx
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  exit={{ opacity: 0, height: 0 }}
  transition={{ duration: 0.2 }}
  className="md:hidden border-t border-border bg-background/95 backdrop-blur-md overflow-hidden"
  ```
  Keep `id="mobile-menu"`, `data-testid="mobile-menu"`, and all inner links unchanged. (The reduced-motion CSS guard neutralizes the transition; content still shows.)
  3. Animate the cart badge: change the badge `<span>` (lines ~213-217) to `motion.span` with `initial={{ scale: 0 }} animate={{ scale: 1 }}` and `key={cartCount}`.

- [ ] **Step 2: Add reveal to `Footer.js`**
  1. Add import: `import Reveal from './common/Reveal';`
  2. Wrap the four-column `<div className="grid grid-cols-1 md:grid-cols-4 gap-8">` children each in `<Reveal>` (or wrap the grid in a single `<Reveal>` for simplicity). Keep all compliance content/links/logos exactly as-is.

- [ ] **Step 3: Verify build + existing E2E still pass**

Run: `CI=true yarn build` then `yarn test:e2e`
Expected: build compiles; all specs pass. Manually confirm mobile menu still opens: covered by Step 4.

- [ ] **Step 4: Add mobile-menu E2E to `frontend/tests/e2e/a11y-nav.spec.js`**

Append:
```js
test('mobile menu toggles', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  await page.getByTestId('mobile-menu-toggle').click();
  await expect(page.getByTestId('mobile-menu')).toBeVisible();
  await expect(page.getByTestId('mobile-nav-services')).toBeVisible();
});
```
Run: `yarn test:e2e a11y-nav`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Navbar.js frontend/src/components/Footer.js frontend/tests/e2e/a11y-nav.spec.js
git commit -m "feat(nav/footer): animated mobile menu, cart badge pop, footer reveal"
```

---

## Task 10: Accessibility audit (contrast + axe)

**Files:**
- Create: `frontend/tests/e2e/axe.spec.js`
- Possibly modify: `frontend/tailwind.config.js`, `frontend/design_guidelines.json` (only if a contrast fix is required)

**Interfaces:**
- Consumes: `@axe-core/playwright`.

- [ ] **Step 1: Compute contrast for the at-risk pairs** (do this manually; record results in the commit message)
  - `muted.foreground #4A5A4B` on `background #F5EBDD`
  - `muted.foreground #4A5A4B` on `card #FFFFFF`
  - `accent.foreground #FFFFFF` on `accent #926F3F`
  AA thresholds: 4.5:1 normal text, 3:1 large text (≥24px, or ≥18.7px bold).
  Use any WCAG contrast formula. If `#FFFFFF` on `#926F3F` is below 4.5:1, the accent-button text is large (`text-lg`) so 3:1 applies and it passes — but the About "13+ Years Experience" badge (`text-sm font-bold`) is small: if that pair is < 4.5:1, darken `accent` to the nearest value that reaches 4.5:1 on white (e.g. `#7A5C33`) in `tailwind.config.js` AND `design_guidelines.json`, and re-screenshot.

- [ ] **Step 2: Write axe spec `frontend/tests/e2e/axe.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { stubBackend } = require('./fixtures');

const pages = ['/', '/services', '/about', '/contact'];

for (const path of pages) {
  test(`axe: no serious/critical violations on ${path}`, async ({ page }) => {
    await stubBackend(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    expect(serious, JSON.stringify(serious.map(v => v.id), null, 2)).toEqual([]);
  });
}
```

- [ ] **Step 3: Run axe and fix violations**

Run: `yarn test:e2e axe`
Expected: initially may fail; fix each reported `serious`/`critical` violation in the relevant page/component (common fixes: missing `aria-hidden` on decorative icons, low contrast, missing form labels — the iframe on Contact needs the existing `title` which is present). Re-run until 4 passed.

- [ ] **Step 4: Commit**

```bash
git add frontend/tests/e2e/axe.spec.js frontend/tailwind.config.js frontend/design_guidelines.json
git commit -m "test(a11y): axe WCAG 2.2 AA gate on core pages + contrast fixes"
```
(Include the computed contrast ratios in the commit body.)

---

## Task 11: Responsive screenshots + full suite

**Files:**
- Create: `frontend/tests/e2e/screenshots.spec.js`
- Modify: `frontend/playwright.config.js` (add mobile/tablet projects)

**Interfaces:** none produced; deliverable = screenshots under `frontend/tests/e2e/__screenshots__/`.

- [ ] **Step 1: Add projects to `playwright.config.js`**

Replace `projects` with:
```js
projects: [
  { name: 'mobile',  use: { ...devices['Desktop Chrome'], viewport: { width: 375,  height: 812 } } },
  { name: 'tablet',  use: { ...devices['Desktop Chrome'], viewport: { width: 768,  height: 1024 } } },
  { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
],
```

- [ ] **Step 2: Write `frontend/tests/e2e/screenshots.spec.js`**

```js
const { test } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

const pages = { home: '/', services: '/services', about: '/about', contact: '/contact' };

for (const [name, path] of Object.entries(pages)) {
  test(`screenshot ${name}`, async ({ page }, testInfo) => {
    await stubBackend(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `tests/e2e/__screenshots__/${name}-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });
}
```

- [ ] **Step 3: Run full suite across all viewports**

Run: `yarn test:e2e`
Expected: all specs pass on mobile/tablet/desktop; 12 screenshots written to `frontend/tests/e2e/__screenshots__/`.

- [ ] **Step 4: Commit**

```bash
git add frontend/playwright.config.js frontend/tests/e2e/screenshots.spec.js frontend/tests/e2e/__screenshots__
git commit -m "test: responsive screenshots at 375/768/1440 for core pages"
```

---

## Self-Review

**Spec coverage:**
- Reusable components → Tasks 2,3,5,6. Motion → Tasks 2,5,6,7,8,9. WCAG 2.2 AA (skip link, contrast, focus, reduced-motion, axe) → Tasks 4,10. Hierarchy/spacing/type → Tasks 3,5,6 (Section/SectionHeading). Playwright E2E + stubs + screenshots → Tasks 1,5,6,7,8,10,11. Responsive → Task 11. Constraints (no backend/build/lang change) → honored (no backend files touched; CRA kept). ✅ All spec sections mapped.
- "Improve animations" was flagged in the spec as the biggest gap → Tasks 2,5,6,7,8,9. ✅

**Placeholder scan:** No TBD/TODO; all code blocks concrete; no "similar to Task N". ✅

**Type/name consistency:** `revealVariants`/`staggerVariants` names match between Task 2 test, impl, and `Reveal`/`Stagger`. Component prop names (`icon`, `title`, `description`, `service`, `language`, `t`, `isInCart`, `onAdd`) consistent between definition (Tasks 5,6) and usage. `stubBackend`/`SERVICES` consistent across Tasks 1,5,6,7,8,10,11. Testids reused, never renamed. ✅
