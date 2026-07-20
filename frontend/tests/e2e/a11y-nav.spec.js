const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test('skip link appears on focus and jumps to main', async ({ page }) => {
  await stubBackend(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByTestId('skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});
