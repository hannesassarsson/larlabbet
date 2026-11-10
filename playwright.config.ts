import { defineConfig, devices } from '@playwright/test';

/**
 * Webbläsartester för Lärlabbet.
 *
 * Körs mot ett riktigt produktionsbygge (`vite build` + `vite preview`) så att
 * service worker, offline och manifest testas på samma sätt som i drift.
 *
 *   npm run test:e2e            alla tester (Chromium, iPad liggande och stående)
 *   npm run test:e2e:ui         interaktivt läge
 *   PW_WEBKIT=1 npm run test:e2e   lägg till Safaris motor (WebKit), kräver `npx playwright install webkit`
 */
const PORT = Number(process.env.PW_PORT ?? 4173);
const ipadTouch = { hasTouch: true, deviceScaleFactor: 1, locale: 'sv-SE', timezoneId: 'Europe/Stockholm' };

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 6_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run build:demo && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/start`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      // Huvudprojektet: alla tester, iPad 10/Air i liggande läge.
      name: 'ipad-liggande',
      use: { browserName: 'chromium', viewport: { width: 1180, height: 820 }, ...ipadTouch },
    },
    {
      // Stående läge: layout och de flöden där placeringen skiljer sig mest.
      name: 'ipad-staende',
      testMatch: /(layout|lar|arbetsblad)\.spec\.ts/,
      use: { browserName: 'chromium', viewport: { width: 820, height: 1180 }, ...ipadTouch },
    },
    ...(process.env.PW_WEBKIT
      ? [
          {
            // Safaris motor. Ligger närmast iPad, men är inte samma sak som en riktig iPad.
            name: 'webkit-ipad',
            use: { ...devices['iPad Pro 11 landscape'], locale: 'sv-SE', timezoneId: 'Europe/Stockholm' },
          },
        ]
      : []),
  ],
});
