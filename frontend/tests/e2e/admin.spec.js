const { test, expect } = require('@playwright/test');
const { stubBackend, stubAuth, stubAdmin, ADMIN, SERVICES } = require('./fixtures');

test.describe('admin', () => {
  test.beforeEach(async ({ page }) => {
    await stubBackend(page);
    await stubAdmin(page);
    await stubAuth(page, ADMIN);
  });

  test('services reorder via keyboard buttons issues reorder PUT', async ({ page }) => {
    const reorder = page.waitForRequest((req) =>
      req.url().includes('/api/admin/services/reorder') && req.method() === 'PUT');
    await page.goto('/admin');
    await expect(page.getByTestId(`service-row-${SERVICES[0].service_id}`)).toBeVisible();
    // first row's up is disabled; move it down instead
    await page.getByTestId(`move-down-${SERVICES[0].service_id}`).click();
    const req = await reorder;
    expect(JSON.parse(req.postData()).ordered_ids).toContain(SERVICES[0].service_id);
  });
});
