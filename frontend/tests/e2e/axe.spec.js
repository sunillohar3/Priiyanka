const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { stubBackend } = require('./fixtures');

const pages = ['/', '/services', '/about', '/contact'];

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
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    expect(serious, JSON.stringify(serious.map(v => v.id), null, 2)).toEqual([]);
  });
}
