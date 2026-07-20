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
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'yarn start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      BROWSER: 'none',
      // Ensure a resolvable `yarn` on PATH: this machine has no global yarn binary
      // (corepack enable is blocked by EPERM writing into Program Files\nodejs, no admin
      // rights). A `yarn.cmd` shim (calling `corepack yarn`) was added to the user's npm
      // global bin dir; prepend it here so the webServer child process can resolve `yarn`.
      PATH: `C:\\Users\\LoharS\\AppData\\Roaming\\npm;${process.env.PATH}`,
    },
  },
});
