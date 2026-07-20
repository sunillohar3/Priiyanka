const { test } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

const pages = { home: '/', services: '/services', about: '/about', contact: '/contact' };

for (const [name, path] of Object.entries(pages)) {
  test(`screenshot ${name}`, async ({ page }, testInfo) => {
    await stubBackend(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `tests/e2e/__screenshots__/${name}-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });
}
