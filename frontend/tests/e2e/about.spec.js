const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test('about has a single h1', async ({ page }) => {
  await stubBackend(page);
  await page.goto('/about');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Priiyanka Singh/);
});
