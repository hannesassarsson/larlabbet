import { expect, test } from './helpers';

/**
 * Installerbar webbapp: manifest, ikoner, service worker och offline.
 * Körs mot produktionsbygget, där service workern är aktiv.
 */

test('manifest och ikoner', async ({ page, request }) => {
  await page.goto('/start');
  const man = await (await request.get('/manifest.webmanifest')).json();
  expect(man).toMatchObject({ name: 'Lärlabbet', short_name: 'Lärlabbet', display: 'standalone', start_url: '/', lang: 'sv' });
  expect(man.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512', '180x180']));
  expect(man.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);

  for (const href of ['/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', '/startup/ipad-1640x2360.png']) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
    expect(res.headers()['content-type'], href).toContain('image/png');
  }
  const size = await page.evaluate(
    () => new Promise<string>((r) => {
      const i = new Image();
      i.onload = () => r(`${i.naturalWidth}x${i.naturalHeight}`);
      i.src = '/icons/apple-touch-icon.png';
    })
  );
  expect(size).toBe('180x180');
  await expect(page.locator('link[rel="apple-touch-icon"][sizes="180x180"]')).toHaveCount(1);
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Lärlabbet');
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).toContain('viewport-fit=cover');
  expect(await page.locator('link[rel="apple-touch-startup-image"]').count()).toBeGreaterThanOrEqual(10);
});

test('service worker, versionsbunden cache och offline', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'context.setOffline med service worker testas i Chromium');
  await page.goto('/lek');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15_000 });
  const caches = await page.evaluate(() => window.caches.keys());
  expect(caches).toHaveLength(1);
  expect(caches[0]).toMatch(/^leklandet-[0-9a-f]{12}$/);

  await context.setOffline(true);
  await page.goto('/spel/matte');
  await expect(page.getByRole('heading', { name: 'Matteäventyret' })).toBeVisible();
  await page.goto('/installera');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lägg till Lärlabbet');
  await page.goto('/spel/memory');
  await page.getByRole('button', { name: 'Börja spela' }).click();
  await expect(page.locator('.memory-card').first()).toBeVisible();
  await page.goto('/lar/amne/matematik');
  await expect(page.locator('.lar-row').first()).toBeVisible();
  await context.setOffline(false);
});

test('installationsguiden', async ({ page }) => {
  await page.goto('/installera');
  await expect(page.locator('.install-step')).toHaveCount(5);
  const text = await page.locator('body').innerText();
  for (const needle of ['Öppna Safari', 'Tryck på Dela', 'Lägg till på hemskärmen', 'Bekräfta', 'Börja spela', 'App Store', 'internet', 'Safari, inte']) {
    expect(text, needle).toContain(needle);
  }
});
