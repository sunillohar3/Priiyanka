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

  test('non-admin is redirected to dashboard', async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await stubBackend(page); await stubAdmin(page);
    await stubAuth(page, { id: 'u-1', email: 'c@e.com', name: 'Client', role: 'client', email_verified: true });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('tabs switch and reflect aria-selected', async ({ page }) => {
    await page.goto('/admin');
    const usersTab = page.getByRole('tab', { name: /Users/i });
    await usersTab.click();
    await expect(usersTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('create service submits POST with the form data', async ({ page }) => {
    const post = page.waitForRequest((r) => r.url().endsWith('/api/services') && r.method() === 'POST');
    await page.goto('/admin');
    await page.getByTestId('add-service-button').click();
    await page.getByTestId('input-name-en').fill('Test Service EN');
    await page.getByTestId('input-name-nl').fill('Test Service NL');
    await page.getByTestId('input-description-en').fill('English description');
    await page.getByTestId('input-description-nl').fill('Dutch description');
    await page.getByTestId('input-price').fill('45');
    await page.getByTestId('input-duration').fill('30');
    await page.getByTestId('input-category').fill('Massage');
    await page.getByTestId('submit-service').click();
    const req = await post;
    const body = JSON.parse(req.postData());
    expect(body.name_en).toBe('Test Service EN');
    expect(body.category).toBe('Massage');
  });

  test('edit service issues PUT with updated data', async ({ page }) => {
    const put = page.waitForRequest((r) =>
      r.url().endsWith(`/api/services/${SERVICES[0].service_id}`) && r.method() === 'PUT');
    await page.goto('/admin');
    await page.getByTestId(`edit-service-${SERVICES[0].service_id}`).click();
    await page.getByTestId('input-name-en').fill('Updated Name EN');
    // SERVICES fixture has no `category`, and the field is required by the form,
    // so fill it too or the browser blocks native submission.
    await page.getByTestId('input-category').fill('Consultations');
    await page.getByTestId('submit-service').click();
    const req = await put;
    expect(JSON.parse(req.postData()).name_en).toBe('Updated Name EN');
  });

  test('delete service issues DELETE', async ({ page }) => {
    page.on('dialog', (d) => d.accept());
    const del = page.waitForRequest((r) =>
      r.url().endsWith(`/api/services/${SERVICES[0].service_id}`) && r.method() === 'DELETE');
    await page.goto('/admin');
    await page.getByTestId(`delete-service-${SERVICES[0].service_id}`).click();
    await del;
  });

  test('appointment filter narrows the visible list', async ({ page }) => {
    const appts = [
      { appointment_id: 'appt-a', booking_date: '2030-01-02', booking_time: '10:00', items: [], total_amount: 10, status: 'pending' },
      { appointment_id: 'appt-b', booking_date: '2030-01-03', booking_time: '11:00', items: [], total_amount: 20, status: 'confirmed' },
    ];
    await page.route('**/api/appointments', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(appts) }));
    await page.goto('/admin');
    await page.getByTestId('tab-appointments').click();
    await expect(page.getByTestId('appointment-appt-a')).toBeVisible();
    await expect(page.getByTestId('appointment-appt-b')).toBeVisible();

    await page.getByTestId('appointment-filter-pending').click();
    await expect(page.getByTestId('appointment-appt-a')).toBeVisible();
    await expect(page.getByTestId('appointment-appt-b')).not.toBeVisible();
  });

  test('message filter narrows the visible list', async ({ page }) => {
    const msgs = [
      { message_id: 'msg-a', name: 'Alice', email: 'alice@example.com', subject: 'Hi', message: 'Hello', status: 'new', created_at: '2030-01-01T00:00:00Z' },
      { message_id: 'msg-b', name: 'Bob', email: 'bob@example.com', subject: 'Hey', message: 'World', status: 'read', created_at: '2030-01-01T00:00:00Z' },
    ];
    await page.route('**/api/admin/contact', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(msgs) }));
    await page.goto('/admin');
    await page.getByTestId('tab-messages').click();
    await expect(page.getByTestId('message-msg-a')).toBeVisible();
    await expect(page.getByTestId('message-msg-b')).toBeVisible();

    await page.getByTestId('message-filter-new').click();
    await expect(page.getByTestId('message-msg-a')).toBeVisible();
    await expect(page.getByTestId('message-msg-b')).not.toBeVisible();
  });
});
