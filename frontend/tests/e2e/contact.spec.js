const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test.beforeEach(async ({ page }) => { await stubBackend(page); });

test('contact form submits against stubbed backend', async ({ page }) => {
  await page.goto('/contact');
  await page.getByTestId('contact-form').getByLabel(/name|naam/i).first().fill('Test User');
  await page.locator('#contact-email').fill('test@example.com');
  await page.locator('#contact-message').fill('Hello, I would like a consultation.');
  await page.getByTestId('contact-submit').click();
  // Sonner success toast appears
  await expect(page.locator('[data-sonner-toast]')).toBeVisible();
});
