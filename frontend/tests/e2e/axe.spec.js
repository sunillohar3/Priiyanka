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
