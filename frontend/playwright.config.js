const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // channel: 'chrome' pins these projects to the machine's installed Google
  // Chrome instead of Playwright's bundled Chromium. This is deliberate:
  // Microsoft Edge (`msedge`) is blocked by group policy on this dev machine,
  // and Chrome is already installed, so there's no need to download Chromium.
  // On a CI runner without Chrome, either remove `channel: 'chrome'' below to
  // fall back to bundled Chromium (after `npx playwright install chromium`),
  // or install Google Chrome on the runner first.
  projects: [
    { name: 'mobile',  use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 375,  height: 812 } } },
    { name: 'tablet',  use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 768,  height: 1024 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      BROWSER: 'none',
    },
  },
});
