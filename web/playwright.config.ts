import { defineConfig, devices } from '@playwright/test';

// Visual specs live in tests/visual/ and run in their own single-browser project:
// a screenshot baseline is only valid for the engine and OS that produced it, so
// multiplying the baselines by three browsers would triple the maintenance for no
// extra signal. Functional specs run on every engine instead.
const VISUAL_SPECS = /[\\/]visual[\\/]/;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  expect: {
    toHaveScreenshot: {
      // Absorbs sub-pixel anti-aliasing noise; a real layout or image defect
      // moves far more than 1% of the pixels in the captured element.
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: VISUAL_SPECS,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: VISUAL_SPECS,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: VISUAL_SPECS,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'visual',
      testMatch: VISUAL_SPECS,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
