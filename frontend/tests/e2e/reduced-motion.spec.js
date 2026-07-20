const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

// Proves the reduced-motion no-op path in `revealVariants` (see
// src/lib/motionVariants.js): when `prefers-reduced-motion: reduce` is
// active, Reveal-wrapped content must render at full opacity immediately,
// rather than waiting for scroll-into-view + a fade transition. We assert
// this on a below-the-fold element (the "Why Choose Us" heading, wrapped in
// SectionHeading -> Reveal) WITHOUT scrolling, so a still-hidden/animating
// element would fail this check.
test.use({ reducedMotion: 'reduce' });

test('below-the-fold Reveal content is fully visible without scrolling under reduced motion', async ({ page }) => {
  // Belt-and-suspenders: in this Playwright 1.48.2 install, the `use.reducedMotion`
  // context option (set above via `test.use`) is not reliably forwarded to the
  // `page` fixture's underlying browser context (verified independently of this
  // project's `channel: 'chrome'` setting — reproduces even with a bare default
  // Chromium config). `page.emulateMedia` calls the same CDP emulation directly
  // on this page and is confirmed to work, so it guarantees the reduced-motion
  // state this test depends on actually takes effect.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stubBackend(page);
  await page.goto('/');

  // The heading itself never carries an explicit opacity (CSS `opacity` is
  // not inherited, so the <h2> would always read "1" regardless of its
  // ancestor's state). Framer Motion applies the animated `opacity` as an
  // inline style directly on the Reveal wrapper (SectionHeading renders
  // `<Reveal><h2>...</h2></Reveal>`, i.e. the heading's own parent), so we
  // assert on that wrapper to actually exercise the reduced-motion path.
  const heading = page.getByRole('heading', { name: /Why Choose Us|Waarom Voor Ons Kiezen/ });
  const revealWrapper = heading.locator('xpath=..');
  await expect(revealWrapper).toHaveCSS('opacity', '1');
});
