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

  test('renders appointments and reschedules', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('appt-appt-1')).toBeVisible();
    await page.getByTestId('reschedule-appt-1').click();
    await page.locator('#rd-appt-1').fill('2030-02-02');
    await page.locator('#rt-appt-1').fill('11:00');
    await page.getByRole('button', { name: /Save|Opslaan/ }).click();
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
  });

  test('cancel accepts confirm dialog', async ({ page }) => {
    page.on('dialog', (d) => d.accept());
    await page.goto('/dashboard');
    await page.getByTestId('cancel-appt-1').click();
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
  });

  test('verify banner resend when unverified', async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await stubBackend(page); await stubAdmin(page);
    await stubAuth(page, { ...USER, email_verified: false });
    await page.goto('/dashboard');
    await expect(page.getByTestId('verify-banner')).toBeVisible();
  });
});
