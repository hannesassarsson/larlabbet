import type { Browser, BrowserContext, Page } from '@playwright/test';
import { expect, FIREBASE, test } from './helpers';

/**
 * Klassquiz: lärarens tavla och elevplattor.
 * - Demoläget (npm run test:e2e): flikar i samma webbläsare, BroadcastChannel.
 * - Firebase-emulatorn (npm run test:firebase): varje elev i en egen webbläsare
 *   med en egen anonym användare, som på riktiga plattor.
 */

/** En ny elevplatta. */
async function device(browser: Browser, context: BrowserContext): Promise<Page> {
  if (!FIREBASE) return context.newPage();
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, locale: 'sv-SE' });
  return ctx.newPage();
}
async function joinAs(page: Page, code: string, name: string) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/elev/logga-in');
  // Sifferkoden fungerar i samma ruta som elevkoden.
  await page.fill('#code-input', code);
  await page.getByRole('button', { name: 'Logga in' }).click();
  await expect(page).toHaveURL(new RegExp(`/quiz/${code}$`));
  await page.fill('#qz-name', name);
  await page.getByRole('button', { name: 'Kör!' }).click();
  await expect(page.getByRole('heading', { name: 'Du är med!' })).toBeVisible();
  return errors;
}

test('klassquiz: tavlan, två elever, poäng, ställning och pall', async ({ page, context, browser }) => {
  test.setTimeout(120_000);
  await page.goto('/quiz');
  await page.getByRole('radiogroup', { name: 'Ämne' }).getByRole('radio', { name: 'NO' }).click();
  await page.getByRole('radiogroup', { name: 'Årskurs' }).getByRole('radio', { name: '5', exact: true }).click();
  await page.getByRole('radiogroup', { name: 'Antal frågor' }).getByRole('radio', { name: '10', exact: true }).click();
  await expect(page.getByRole('heading', { name: '10 frågor' })).toBeVisible();
  // Läraren tar bort en fråga – listan fylls på så att det fortfarande blir tio.
  const first = await page.locator('.qz-qlist li').first().innerText();
  await page.locator('.qz-qlist li').first().getByRole('button').click();
  await expect(page.locator('.qz-qlist li').first()).not.toHaveText(first);
  await expect(page.getByRole('heading', { name: '10 frågor' })).toBeVisible();
  await page.getByRole('button', { name: 'Starta quiz' }).click();

  await expect(page).toHaveURL(/\/quiz\/vard$/);
  const code = (await page.locator('.qz-code').innerText()).replace(/\s/g, '');
  expect(code).toMatch(/^\d{6}$/);

  const alva = await device(browser, context);
  const bo = await device(browser, context);
  const errs = [...(await joinAs(alva, code, 'Alva')), ...(await joinAs(bo, code, 'Bo'))];
  await expect(page.locator('.qz-players li')).toHaveCount(2);

  // En elev till, som läraren tar bort.
  const extra = await device(browser, context);
  await joinAs(extra, code, 'Busfrö');
  await page.getByRole('button', { name: 'Ta bort Busfrö' }).click();
  await expect(extra.getByRole('heading', { name: 'Du är inte med i quizet' })).toBeVisible();
  await expect(page.locator('.qz-players li')).toHaveCount(2);

  await page.getByRole('button', { name: 'Starta' }).click();
  for (let i = 0; i < 10; i++) {
    // Elevernas knappar dyker upp när "gör er redo" är över.
    await expect(alva.locator('.qz-pick-grid .qz-ans').first()).toBeVisible({ timeout: 6000 });
    const right = await page.evaluate(() => {
      const g = JSON.parse(sessionStorage.getItem('leklandet:quiz-vard')!);
      return g.questions[g.index].answer as number;
    });
    await alva.locator('.qz-pick-grid .qz-ans').nth(right).click(); // Alva svarar alltid rätt
    await bo.locator('.qz-pick-grid .qz-ans').nth(right === 0 ? 1 : 0).click(); // Bo alltid fel
    // Alla har svarat: svaret visas utan att tiden behöver gå ut.
    await expect(page.locator('.qz-answers.revealed')).toBeVisible();
    await expect(alva.locator('.qz-result.right')).toBeVisible();
    await expect(bo.locator('.qz-result.wrong')).toBeVisible();
    await page.getByRole('button', { name: 'Visa ställningen' }).click();
    await expect(page.locator('.qz-board li').first()).toContainText('Alva');
    await page.getByRole('button', { name: i === 9 ? 'Visa vinnarna' : 'Nästa fråga' }).click();
  }

  await expect(page.locator('.qz-podium .p1')).toContainText('Alva');
  await expect(alva.getByRole('heading', { name: 'Du vann!' })).toBeVisible();
  await expect(bo.locator('.qz-final')).toContainText('0 poäng');
  // Alva fick mellan 500 och 1250 per fråga.
  const score = Number((await alva.locator('.qz-points').innerText()).replace(/\D/g, ''));
  expect(score).toBeGreaterThanOrEqual(5000);
  expect(score).toBeLessThanOrEqual(12500);

  await page.getByRole('button', { name: 'Visa resultat per fråga' }).click();
  await expect(page.locator('.qz-summary li')).toHaveCount(10);
  await expect(page.locator('.qz-summary li').first()).toContainText('50 %');
  expect(errs).toEqual([]);
});

test('fel kod ger ett tydligt besked', async ({ page }) => {
  await page.goto('/quiz/spela');
  await page.fill('#qz-code', '999999');
  await page.getByRole('button', { name: 'Gå med' }).click();
  await expect(page.getByRole('alert')).toContainText('inget quiz med den koden');
});

test('läraren kan ladda om tavlan mitt i quizet', async ({ page, context, browser }) => {
  await page.goto('/quiz');
  await page.getByRole('button', { name: 'Starta quiz' }).click();
  const code = (await page.locator('.qz-code').innerText()).replace(/\s/g, '');
  const kid = await device(browser, context);
  await joinAs(kid, code, 'Ines');
  await page.reload();
  await expect(page.locator('.qz-players li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Starta' }).click();
  await expect(kid.locator('.qz-pick-grid .qz-ans').first()).toBeVisible({ timeout: 6000 });
});

test('egna frågor: läraren skriver två frågor och klassen spelar bara dem', async ({ page, context, browser }) => {
  await page.goto('/quiz');
  await page.getByRole('button', { name: 'Skriv egna frågor' }).click();
  await page.fill('#qz-custom', 'Vilken månad har jul?\nnovember\n* december\n\nUtan rätt svar?\nja\nnej\n\nVad heter läraren?\n* Karin\nPer\nOlle\nFörklaring: Hon heter Karin.');
  await expect(page.locator('.qz-custom-status')).toContainText('2 frågor klara');
  await expect(page.locator('.qz-problems li')).toHaveCount(1);
  await expect(page.locator('.qz-problems')).toContainText('markera rätt svar');
  await page.getByText('Bara mina egna frågor').click();
  await expect(page.getByRole('heading', { name: '2 frågor' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Ämne' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Starta quiz' }).click();
  const code = (await page.locator('.qz-code').innerText()).replace(/\s/g, '');
  const kid = await device(browser, context);
  await kid.goto(`/quiz/${code}`);
  await kid.fill('#qz-name', 'Ines');
  await kid.getByRole('button', { name: 'Kör!' }).click();
  await expect(page.locator('.qz-players li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Starta' }).click();
  for (const [i, right] of [[0, 'december'], [1, 'Karin']] as const) {
    await expect(page.locator('.qz-prompt')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('.qz-prompt')).toHaveText(i === 0 ? 'Vilken månad har jul?' : 'Vad heter läraren?');
    await kid.locator('.qz-pick-grid .qz-ans', { hasText: right }).click();
    await expect(page.locator('.qz-answers.revealed')).toBeVisible();
    if (i === 1) await expect(page.locator('.qz-explain')).toHaveText('Hon heter Karin.');
    await page.getByRole('button', { name: 'Visa ställningen' }).click();
    await page.getByRole('button', { name: i === 1 ? 'Visa vinnarna' : 'Nästa fråga' }).click();
  }
  await expect(kid.getByRole('heading', { name: 'Du vann!' })).toBeVisible();
});
