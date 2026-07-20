const { test, expect } = require('@playwright/test');
const { stubBackend } = require('./fixtures');

const pages = [
  { path: '/privacy', en: /Privacy Policy/i, nl: /Privacybeleid/i },
  { path: '/terms', en: /Terms & Conditions/i, nl: /Algemene Voorwaarden/i },
  { path: '/suggestions', en: /Suggestions & Feedback/i, nl: /Suggesties & Feedback/i },
];

for (const p of pages) {
  test(`legal page ${p.path} renders single h1`, async ({ page }) => {
    await stubBackend(page);
    await page.goto(p.path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`${p.en.source}|${p.nl.source}`));
  });
}
