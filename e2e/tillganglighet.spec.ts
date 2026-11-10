import { expect, test } from './helpers';

/** Tangentbord och skärmläsare: dialogrutor ska hålla fokus och lämna tillbaka det. */

test('pausrutan håller fokus, Escape stänger och fokus går tillbaka', async ({ page }) => {
  await page.goto('/lar/ova/ma-ekvationer');
  await page.getByRole('button', { name: 'Börja', exact: true }).click();
  const pause = page.getByRole('button', { name: 'Pausa' });
  await pause.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Paus' });
  await expect(dialog).toBeVisible();
  // Tab ska stanna inne i rutan, hur många gånger man än trycker.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab');
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  // Resten av sidan är dold för skärmläsare medan rutan är öppen.
  await expect(page.getByRole('button', { name: 'Pausa' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(pause).toBeFocused();
});
