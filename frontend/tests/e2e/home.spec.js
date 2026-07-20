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
