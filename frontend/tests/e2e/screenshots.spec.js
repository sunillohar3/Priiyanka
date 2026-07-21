const { test } = require('@playwright/test');
const { stubBackend, seedCart, stubAdmin, stubAuth, ADMIN } = require('./fixtures');

const pages = {
  home: '/', services: '/services', about: '/about', contact: '/contact',
  cart: '/cart', privacy: '/privacy', terms: '/terms', suggestions: '/suggestions',
  'reset-password': '/reset-password?token=abc', 'verify-email': '/verify-email?token=abc',
  notfound: '/no-such-page', dashboard: '/dashboard', admin: '/admin',
};

for (const [name, path] of Object.entries(pages)) {
  test(`screenshot ${name}`, async ({ page }, testInfo) => {
    // Reduced motion so Reveal/Stagger entrance animations render in their
    // static, fully-visible end state (see reduced-motion.spec.js for why
    // emulateMedia is used instead of the `reducedMotion` context option).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stubBackend(page);
    if (name === 'cart') {
      await seedCart(page);
    }
    if (name === 'dashboard' || name === 'admin') {
      await stubAdmin(page);
      await stubAuth(page, ADMIN);
    }
    // /verify-email otherwise sits on an error spinner because its POST
    // isn't stubbed by default; registering this unconditionally only
    // affects the verify-email page (no other route matches this pattern).
    await page.route('**/api/auth/verify-email', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'verified' }) }));
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `tests/e2e/__screenshots__/${name}-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });
}
