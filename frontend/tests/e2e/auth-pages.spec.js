const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test('reset-password invalid link (no token)', async ({ page }) => {
  await stubBackend(page);
  await page.goto('/reset-password');
  await expect(page.getByTestId('reset-invalid')).toBeVisible();
});

test('reset-password submits against stubbed endpoint', async ({ page }) => {
  await stubBackend(page);
  await page.route('**/api/auth/reset-password', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
  await page.goto('/reset-password?token=abc123');
  await expect(page.getByTestId('reset-password-form')).toBeVisible();
  await page.locator('#new-password').fill('secret123');
  await page.locator('#confirm-password').fill('secret123');
  await page.getByTestId('reset-submit').click();
  await expect(page.locator('[data-sonner-toast]')).toBeVisible(); // success toast, then navigate('/')
});

test('verify-email success against stubbed endpoint', async ({ page }) => {
  await stubBackend(page);
  await page.route('**/api/auth/verify-email', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'verified' }) }));
  await page.goto('/verify-email?token=abc123');
  await expect(page.getByRole('heading', { name: /Email verified|E-mail geverifieerd/ })).toBeVisible();
});
