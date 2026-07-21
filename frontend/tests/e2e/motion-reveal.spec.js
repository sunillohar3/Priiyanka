// Regression guard: full-motion (NOT reduced) content above the fold must be
// visible on load without scrolling, even for a grid taller than the viewport.
// This catches the class of bug where a scroll-reveal's viewport `amount`
// threshold scales with element height and never fires on load for tall grids.
// (The screenshot/axe suites run with reducedMotion:'reduce', so they cannot
// catch this — hence a dedicated full-motion test.)
const { test, expect } = require('@playwright/test');

const TALL = Array.from({ length: 40 }, (_, i) => ({
  service_id: `svc-${i}`,
  name_en: `Service ${i}`, name_nl: `Dienst ${i}`,
  description_en: 'Description', description_nl: 'Beschrijving',
  price: 60 + i, duration: 60,
  image_url: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
  display_order: i + 1,
}));

test('tall services grid: above-the-fold cards are visible on load (full motion)', async ({ page }) => {
  await page.route('**/api/services', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TALL) }));
  await page.route('**/api/auth/**', (r) =>
    r.fulfill({ status: 401, contentType: 'application/json', body: '{}' }));

  await page.goto('/services'); // NO reduced-motion emulation — real user motion
  const first = page.getByTestId('service-card-svc-0');
  await first.waitFor({ state: 'attached' });
  await page.waitForTimeout(800); // allow reveal to settle; do NOT scroll

  const box = await first.boundingBox();
  expect(box, 'first card should be laid out').not.toBeNull();
  expect(box.y, 'first card should be above the fold on load').toBeLessThan(page.viewportSize().height);

  const opacity = await first.evaluate((el) => {
    let n = el;
    for (let i = 0; i < 5 && n; i++) { const o = getComputedStyle(n).opacity; if (o !== '1') return o; n = n.parentElement; }
    return '1';
  });
  expect(opacity, 'above-the-fold service card must be fully visible on load without scrolling').toBe('1');
});
