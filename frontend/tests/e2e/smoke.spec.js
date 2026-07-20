const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test.beforeEach(async ({ page }) => { await stubBackend(page); });

test('home renders hero and nav', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('hero-section')).toBeVisible();
  await expect(page.getByTestId('logo-link')).toBeVisible();
});
