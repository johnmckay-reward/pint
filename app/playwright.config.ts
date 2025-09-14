import { defineConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright configuration for Firebase integration validation
 * Supports comprehensive testing of real-time sync, security rules, and geospatial queries
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel - carefully managed for Firebase tests */
  fullyParallel: false, // Disabled for Firebase integration tests that share state
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Limited workers for Firebase tests to avoid conflicts */
  workers: process.env['CI'] ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8100',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording for debugging */
    video: 'retain-on-failure',
    
    /* Increased timeout for Firebase real-time operations */
    actionTimeout: 20000,
    navigationTimeout: 45000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports for main user app */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Focus mobile tests on user app only
        baseURL: 'http://localhost:8100'
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        baseURL: 'http://localhost:8100'
      },
    },

    /* Test against tablet viewports for dashboards */
    {
      name: 'tablet-ipad',
      use: { 
        ...devices['iPad Pro'],
        // Dashboards need larger viewports
        baseURL: 'http://localhost:4200'
      },
    },

    /* Microsoft Edge for enterprise compatibility */
    {
      name: 'edge-desktop',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge' 
      },
    },
  ],

  /* Run local dev servers before starting tests */
  webServer: [
    {
      command: 'npm start',
      url: 'http://localhost:8100',
      reuseExistingServer: !process.env['CI'],
      timeout: 120 * 1000,
    },
    // Note: For full integration tests, you would also start:
    // Partner Dashboard on 4200, Admin Dashboard on 4201, API on 3000
    // These are commented out to avoid conflicts in single-machine testing
    // {
    //   command: 'cd ../pint-dashboard && npm start',
    //   url: 'http://localhost:4200',
    //   reuseExistingServer: !process.env.CI,
    // },
    // {
    //   command: 'cd ../admin-dashboard && npm start',
    //   url: 'http://localhost:4201',
    //   reuseExistingServer: !process.env.CI,
    // },
    // {
    //   command: 'cd ../api && node index.js',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
  ],

  /* Global test timeout */
  timeout: 60 * 1000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10 * 1000,
  },
});