import { defineConfig } from '@playwright/test';

/**
 * Samma webbläsartester mot Firebase-emulatorn, med de riktiga reglerna.
 * Körs via `npm run test:firebase`, som startar emulatorn först.
 * Appen byggs i läget "emulator" (.env.emulator) och pratar då med emulatorn.
 */
process.env.FIREBASE_E2E = '1';
const PORT = Number(process.env.PW_PORT ?? 4175);

export default defineConfig({
  testDir: 'e2e',
  testMatch: /(skola|quiz)\.spec\.ts/,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-firebase' }]] : [['list']],
  outputDir: 'test-results-firebase',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
    locale: 'sv-SE',
    timezoneId: 'Europe/Stockholm',
  },
  webServer: {
    command: `npx tsc -b && npx vite build --mode emulator --outDir dist-emulator && npx vite preview --outDir dist-emulator --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/start`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [{ name: 'firebase', use: { browserName: 'chromium' } }],
});
