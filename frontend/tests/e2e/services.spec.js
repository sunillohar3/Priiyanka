const { test, expect } = require('@playwright/test');
const { stubBackend, SERVICES } = require('./fixtures');

test.beforeEach(async ({ page }) => { await stubBackend(page); });

test('renders stubbed services and adds to cart', async ({ page }) => {
  await page.goto('/services');
  await expect(page.getByTestId(`service-card-${SERVICES[0].service_id}`)).toBeVisible();
  await page.getByTestId(`add-to-cart-${SERVICES[0].service_id}`).click();
  await expect(page.getByTestId('cart-link')).toContainText('1');
  await expect(page.getByTestId(`in-cart-${SERVICES[0].service_id}`)).toBeVisible();
});
