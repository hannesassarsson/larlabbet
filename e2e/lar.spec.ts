import { expect, mode, playRunner, test } from './helpers';

/** Startvalet och Lärlabbet (årskurs 4–6). */

test('första besöket visar valet, och appen minns vald del', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.door')).toHaveCount(2);
  await expect(page).toHaveTitle('Lärlabbet');

  await page.locator('.door-lek').click();
  await expect(page).toHaveURL(/\/lek$/);
  expect(await mode(page)).toBe('lek');
  await expect(page.locator('.logo')).toContainText('Leklabbet');
  await page.goto('/');
  await expect(page).toHaveURL(/\/lek$/);

  await page.goto('/start');
  await page.locator('.door-lar').click();
  await expect(page).toHaveURL(/\/lar$/);
  expect(await mode(page)).toBe('lar');
  await page.goto('/');
  await expect(page).toHaveURL(/\/lar$/);
});

test('ämnessidan visar kursplanens områden för vald årskurs', async ({ page }) => {
  await page.goto('/lar');
  await expect(page.locator('.lar-subject')).toHaveCount(5);
  await page.getByRole('radio', { name: 'Åk 6' }).click();
  await page.locator('.lar-subject', { hasText: 'Matematik' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Matematik');
  expect(await page.locator('.lar-area').count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('.lar-row', { hasText: 'Procent' })).toBeVisible();
  await expect(page.locator('.lar-row', { hasText: 'Räkna saker' })).toHaveCount(0);
});

test('övning i Lärlabbet: procent, genomgång av fel och öva på det man missade', async ({ page }) => {
  await page.goto('/lar/ova/ma-ekvationer');
  await playRunner(page, { wrongFirst: 2 });
  const card = page.locator('.lar-result-card');
  await expect(card).toContainText('%');
  await expect(card).toContainText('8 av 10 rätt på första försöket');
  await expect(page.locator('.lar-review li')).toHaveCount(2);
  await expect(page.locator('.lar-review')).toContainText('Rätt svar:');
  await expect(page.locator('.confetti, .stars')).toHaveCount(0);

  await page.getByRole('button', { name: 'Öva på de 2 du missade' }).click();
  await expect(page.locator('.game-stats')).toContainText('1/2');

  await page.goto('/lar');
  await expect(page.locator('.lar-section', { hasText: 'Fortsätt öva' })).toContainText('Ekvationer');
  await expect(page.locator('.mastery').first()).toContainText('80 %');
});

test('en SO-övning går att göra hela vägen', async ({ page }) => {
  await page.goto('/lar/ova/hi-stormaktstiden');
  await playRunner(page);
  await expect(page.locator('.lar-score')).toContainText('10 av 10');
});

test('läsförståelse: texten syns bredvid frågorna och går att läsa upp', async ({ page }) => {
  await page.goto('/lar/ova/sv-lasforstaelse-4-6');
  await page.getByRole('button', { name: 'Börja', exact: true }).click();
  const passage = page.locator('.passage');
  await expect(passage).toBeVisible();
  await expect(passage.locator('h2, h3').first()).not.toBeEmpty();
  await expect(passage.getByRole('button', { name: /Läs upp/ })).toBeVisible();
  // Texten och frågan ska båda synas utan att man scrollar, på iPad.
  const p = await passage.boundingBox();
  const opts = await page.locator('.run-main .run-option').first().boundingBox();
  const vp = page.viewportSize()!;
  expect(p && opts).toBeTruthy();
  expect(opts!.y + opts!.height).toBeLessThanOrEqual(vp.height + 1);
  await playRunner(page);
  await expect(page.locator('.lar-result-card')).toBeVisible();
});

test('NO: solsystemet med ordningsfrågor går att göra klart', async ({ page }) => {
  await page.goto('/lar/amne/no');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('NO');
  await page.locator('.lar-row', { hasText: 'Solsystemet' }).click();
  await playRunner(page);
  await expect(page.locator('.lar-result-card')).toBeVisible();
});
