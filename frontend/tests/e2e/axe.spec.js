const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { stubBackend } = require('./fixtures');

const pages = ['/', '/services', '/about', '/contact', '/cart', '/privacy', '/terms', '/suggestions', '/reset-password?token=abc', '/verify-email?token=abc', '/no-such-page'];

for (const path of pages) {
  test(`axe: no serious/critical violations on ${path}`, async ({ page }) => {
    // Emulate reduced motion so Reveal/Stagger entrance animations render in
    // their static, fully-visible end state before axe analyzes the page.
    // Without this, axe can occasionally sample an element mid-fade (0.5s
    // framer-motion opacity transition), producing a spurious transient
    // contrast violation. `page.emulateMedia` is used (not `test.use`) since
    // the latter's `reducedMotion` context option is not reliably forwarded
    // in this Playwright 1.48.2 install (see reduced-motion.spec.js).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stubBackend(page);
    // /verify-email otherwise sits on an error spinner because its POST
    // isn't stubbed by default; registering this unconditionally only
    // affects the verify-email page (no other route matches this pattern).
    await page.route('**/api/auth/verify-email', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'verified' }) }));
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    expect(serious, JSON.stringify(serious.map(v => v.id), null, 2)).toEqual([]);
  });
}
