import { expect, test } from './helpers';

/**
 * Layout på iPad i både liggande och stående läge (se projekten i playwright.config.ts):
 * varje sida ska ha en rubrik, inte rulla i sidled och inte ha små tryckytor.
 */
const PAGES = [
  '/start',
  '/lek',
  '/lar',
  '/lar/amne/matematik',
  '/lar/amne/so',
  '/lar/ova/ma-klockan',
  '/ova',
  '/skola',
  '/larare',
  '/foralder',
  '/elev/logga-in',
  '/arbetsblad',
  '/installera',
  '/hjalp',
  '/spel/memory',
  '/spel/matte',
  '/finns-inte',
];

for (const path of PAGES) {
  test(`layout ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'sidan rullar i sidled').toBeLessThanOrEqual(1);

    // Knappar och länkar som går att trycka på ska vara minst 44 px höga (Apples riktlinje).
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('button, a.btn, [role="radio"], [role="tab"]')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && r.height < 44;
        })
        .map((el) => `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().height)}px`)
    );
    expect(small, 'för små tryckytor').toEqual([]);
  });
}

test('sidan som inte finns har en väg tillbaka', async ({ page }) => {
  await page.goto('/finns-inte');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('finns inte');
  await page.getByRole('link', { name: 'Till startsidan' }).click();
  await expect(page).not.toHaveURL(/finns-inte/);
});
