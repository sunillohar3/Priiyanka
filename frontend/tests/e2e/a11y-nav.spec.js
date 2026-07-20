const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

test('skip link appears on focus and jumps to main', async ({ page }) => {
  await stubBackend(page);
  await page.goto('/');
  const skip = page.getByTestId('skip-link');

  // Before focus: the link is rendered but pushed off-screen (top: -3rem =
  // -48px), not display:none, so toBeVisible() alone would pass even
  // without the focus-reveal working. Assert the actual computed `top`
  // instead of mere visibility. toHaveCSS auto-retries, which also avoids
  // racing the `transition: top 0.15s ease` below.
  await expect(skip).toHaveCSS('top', '-48px');

  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();

  // After focus: `top` must move to 0.75rem (12px), proving the
  // focus-reveal CSS actually toggled rather than just checking visibility.
  await expect(skip).toHaveCSS('top', '12px');
});
