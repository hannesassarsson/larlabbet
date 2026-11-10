import type { Page } from '@playwright/test';
import { expect, test } from './helpers';

/**
 * Klassquiz i demoläget: lärarens tavla och två elevplattor i samma webbläsare
 * (BroadcastChannel). Med Firebase går samma flöde över nätet – det är inte testat här.
 */
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

test('klassquiz: tavlan, två elever, poäng, ställning och pall', async ({ page, context }) => {
  test.setTimeout(90_000);
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

  const alva = await context.newPage();
  const bo = await context.newPage();
  const errs = [...(await joinAs(alva, code, 'Alva')), ...(await joinAs(bo, code, 'Bo'))];
  await expect(page.locator('.qz-players li')).toHaveCount(2);

  // En elev till, som läraren tar bort.
  const extra = await context.newPage();
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

test('läraren kan ladda om tavlan mitt i quizet', async ({ page, context }) => {
  await page.goto('/quiz');
  await page.getByRole('button', { name: 'Starta quiz' }).click();
  const code = (await page.locator('.qz-code').innerText()).replace(/\s/g, '');
  const kid = await context.newPage();
  await joinAs(kid, code, 'Ines');
  await page.reload();
  await expect(page.locator('.qz-players li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Starta' }).click();
  await expect(kid.locator('.qz-pick-grid .qz-ans').first()).toBeVisible({ timeout: 6000 });
});
