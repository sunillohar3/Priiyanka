const { test, expect } = require('@playwright/test');
const { stubBackend, stubAuth, stubAdmin, USER } = require('./fixtures');

test('unauthenticated dashboard redirects home', async ({ page }) => {
  await stubBackend(page); // /auth/me -> 401
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/$/);
});

test.describe('authed dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page);
    await stubAdmin(page); // appointments + endpoints
    await stubAuth(page, { ...USER, email_verified: true });
  });

  test('renders appointments', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('appt-appt-1')).toBeVisible();
  });

  test('verify banner resend when unverified', async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await stubBackend(page); await stubAdmin(page);
    await stubAuth(page, { ...USER, email_verified: false });
    await page.goto('/dashboard');
    await expect(page.getByTestId('verify-banner')).toBeVisible();
  });
});
