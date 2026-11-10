import { expect, seedWorksheet, test } from './helpers';

/** Arbetsblad: bygga, förhandsgranska och skriva ut till A4. */

test('bygga ett blad från förslag till sparat blad', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('link', { name: 'Arbetsblad att skriva ut' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Arbetsblad att skriva ut');
  await expect(page.locator('.empty-paper')).toBeVisible();

  await page.getByRole('radio', { name: '3', exact: true }).click();
  await page.getByRole('button', { name: 'Föreslå ett blad' }).click();
  await expect(page.locator('.ws-controls .editor-item')).toHaveCount(3);
  await expect(page.locator('.paper')).toHaveCount(2); // blad + facit

  const before = await page.locator('.paper').first().innerText();
  await page.getByRole('button', { name: 'Nya frågor' }).click();
  await expect.poll(() => page.locator('.paper').first().innerText()).not.toBe(before);

  await page.getByRole('radio', { name: 'A och B' }).click();
  await expect(page.locator('.paper')).toHaveCount(3);

  await page.getByRole('button', { name: 'Lägg till övning' }).click();
  await page.locator('.catalog-item', { hasText: 'Egna glosor' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Klar' }).click();
  await expect(page.locator('.ws-problem').first()).toBeVisible();
  await page.fill('#ws-words', 'hund – dog\nkatt – cat\nhäst – horse');
  await expect(page.locator('.ws-glosor').first()).toBeVisible();

  await page.getByRole('button', { name: 'Spara bladet' }).click();
  await expect(page.locator('.saved-list li')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.ws-controls .editor-item')).toHaveCount(4); // utkastet finns kvar
});

test('samma bladnummer ger samma blad', async ({ page }) => {
  const config = {
    grade: 2,
    seed: 4821,
    facit: true,
    nameLine: true,
    big: false,
    variants: 1,
    mode: 'auto',
    title: '',
    words: '',
    sections: [{ activityId: 'ma-plus-minus', level: 'blandat-20', count: 12 }],
  };
  await seedWorksheet(page, config);
  await page.goto('/arbetsblad');
  const first = await page.locator('.paper').first().innerText();
  await seedWorksheet(page, config);
  await page.goto('/arbetsblad');
  expect(await page.locator('.paper').first().innerText()).toBe(first);
  await expect(page.locator('.paper').first()).toContainText('Bladnummer 4821');
});

test('utskrift: bara papperen syns och det blir A4-sidor med facit', async ({ page, browserName }) => {
  await seedWorksheet(page, {
    grade: 5,
    seed: 303,
    facit: true,
    nameLine: true,
    big: false,
    variants: 2,
    mode: 'auto',
    title: 'Glosförhör vecka 47',
    words: 'päron – pear\nplommon – plum\nvindruva – grape\ncitron – lemon\napelsin – orange\nhallon – raspberry',
    sections: [
      { activityId: 'en-egna-glosor', level: 'sv-en', count: 6 },
      { activityId: 'hi-stormaktstiden', count: 5 },
      { activityId: 'so-tidslinje', level: 'handelser', count: 2 },
    ],
  });
  await page.goto('/arbetsblad');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.ws-controls')).toBeHidden();
  await expect(page.locator('.portal-top')).toBeHidden();
  await expect(page.locator('.paper')).toHaveCount(3); // blad A, blad B, facit
  await expect(page.locator('.paper.facit')).toContainText('Blad A');
  await expect(page.locator('.paper.facit')).toContainText('Blad B');
  // Rubriken för varje avsnitt ska ha minst en uppgift efter sig.
  for (const head of await page.locator('.ws-section-head').all()) {
    await expect(head.locator('xpath=following-sibling::*[1]')).toBeVisible();
  }

  test.skip(browserName !== 'chromium', 'PDF kan bara skapas i Chromium');
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  expect(pages).toBeGreaterThanOrEqual(3);
  expect(pages).toBeLessThanOrEqual(6);
});

test('läsförståelse skrivs ut med texten', async ({ page }) => {
  await seedWorksheet(page, {
    grade: 5, seed: 77, facit: true, nameLine: true, big: false, variants: 1, mode: 'auto', title: '', words: '',
    sections: [{ activityId: 'sv-lasforstaelse-4-6', count: 5 }],
  });
  await page.goto('/arbetsblad');
  const paper = page.locator('.paper').first();
  await expect(paper.locator('.ws-passage').first()).toBeVisible();
  expect(((await paper.locator('.ws-passage').first().innerText()) || '').length).toBeGreaterThan(200);
  await expect(paper.locator('.ws-item')).toHaveCount(5);
  await expect(page.locator('.paper.facit')).toContainText('Läsförståelse');
});
