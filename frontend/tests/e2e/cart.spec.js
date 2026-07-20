const { test, expect } = require('@playwright/test');
const { stubBackend, stubAuth, seedCart, SERVICES } = require('./fixtures');

test.describe('Cart', () => {
  test('empty cart shows empty state', async ({ page }) => {
    await stubBackend(page);
    await page.goto('/cart');
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('seeded cart renders item and removes it', async ({ page }) => {
    await stubBackend(page);
    await seedCart(page); // svc-consult, qty 1
    await page.goto('/cart');
    await expect(page.getByTestId(`cart-item-${SERVICES[0].service_id}`)).toBeVisible();
    await page.getByTestId(`remove-item-${SERVICES[0].service_id}`).click();
    await expect(page.getByTestId(`cart-item-${SERVICES[0].service_id}`)).toHaveCount(0);
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('unauthenticated confirm prompts login', async ({ page }) => {
    await stubBackend(page); // /auth/me -> 401, user null
    await seedCart(page);
    await page.goto('/cart');
    await page.locator('#appt-date').fill('2030-01-01');
    await page.locator('#appt-time').fill('10:00');
    await page.getByTestId('confirm-appointment-button').click();
    await expect(page.locator('[data-sonner-toast]')).toBeVisible(); // "please login" error toast
    await expect(page).toHaveURL(/\/cart$/); // no navigation
  });

  test('authed happy path books and navigates to dashboard', async ({ page }) => {
    await stubBackend(page);
    await stubAuth(page); // /auth/me -> 200 user (registered after stubBackend => wins)
    await seedCart(page);
    await page.goto('/cart');
    await page.locator('#appt-date').fill('2030-01-01');
    await page.locator('#appt-time').fill('10:00');
    await page.getByTestId('confirm-appointment-button').click();
    await expect(page).toHaveURL(/\/dashboard$/); // clearCart + navigate('/dashboard')
  });
});
