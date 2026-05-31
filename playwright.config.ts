import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const devServerUrl = new URL(baseURL);
const devServerPort = devServerUrl.port || (devServerUrl.protocol === 'https:' ? '443' : '80');
const devServerHost = devServerUrl.hostname;

/**
 * Playwright configuration for Kingdom Builder E2E tests.
 * Targets Chromium, Firefox, and WebKit; starts the Vite dev server
 * automatically so no external server needs to be running.
 *
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Run tests serially (workers=1) so that bot-game setTimeout callbacks are
     not starved when multiple Chromium instances compete for the JS event loop. */
  workers: 1,

  /* Reporter to use */
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    /* Base URL to use in actions such as `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Take screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Tall viewport so the sidebar Actions section is fully visible */
    viewport: { width: 1280, height: 1024 },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Automatically start the Vite dev server before tests */
  webServer: {
    command: `npm run dev -- --host ${devServerHost} --port ${devServerPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING === '1',
    timeout: 30_000,
  },
});
