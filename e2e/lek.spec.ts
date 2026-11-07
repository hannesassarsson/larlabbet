import { expect, sessionJSON, test } from './helpers';

/** Leklabbet (F–3): startsidan och de sju spelen, spelade hela vägen till slutskärmen. */

test.describe('Leklabbets startsida', () => {
  test('filter, kategorier och sökning', async ({ page }) => {
    await page.goto('/lek');
    const cards = page.locator('.game-card');
    await expect(cards).toHaveCount(7);

    await page.locator('.filter-row .chip', { hasText: 'Matematik' }).click();
    await expect(cards).toHaveCount(2);
    await page.locator('.filter-row .chip', { hasText: 'Kreativitet' }).click();
    await expect(page.locator('.game-card h3')).toHaveText(['Målarlådan']);

    await page.locator('.filter-row .chip', { hasText: 'Alla spel' }).click();
    await page.fill('.search input', 'stava');
    await expect(page.locator('.game-card h3')).toHaveText(['Stavningsmästaren']);
    await page.fill('.search input', 'xyzqq');
    await expect(page.locator('.empty')).toBeVisible();
    await page.getByRole('button', { name: 'Visa alla spel' }).last().click();
    await expect(cards).toHaveCount(7);

    await page.locator('.category-tile', { hasText: 'Quiz' }).click();
    await expect(page.locator('.game-card h3')).toHaveText(['Sant eller falskt']);
  });

  test('skolämnen i Leklabbet visar bara F–3', async ({ page }) => {
    await page.goto('/ova/amne/matematik');
    await expect(page.locator('.activity-card', { hasText: 'Räkna saker' })).toBeVisible();
    await expect(page.locator('.activity-card', { hasText: 'Ekvationer' })).toHaveCount(0);
  });
});

test.describe('Spelen', () => {
  test('Memory: fel par vänds tillbaka, vinst efter alla par', async ({ page }) => {
    await page.goto('/spel/memory');
    await page.getByRole('radio', { name: /Liten/ }).click();
    await page.getByRole('button', { name: 'Börja spela' }).click();
    const st = await sessionJSON(page, 'game:memory');
    const pairs = new Map<string, number[]>();
    st.cards.forEach((c: { pic: string }, i: number) => pairs.set(c.pic, [...(pairs.get(c.pic) ?? []), i]));
    const list = [...pairs.values()];
    const cards = page.locator('.memory-card');

    await cards.nth(list[0][0]).click();
    await cards.nth(list[1][0]).click();
    await expect.poll(async () => (await sessionJSON(page, 'game:memory')).flipped).toEqual([]);

    for (const [a, b] of list) {
      await cards.nth(a).click();
      await cards.nth(b).click();
      await page.waitForTimeout(550);
    }
    await expect(page.locator('.game-end-card')).toContainText('Alla par hittade');
    // Ett missat försök + fyra par = fem drag.
    await expect(page.locator('.end-lines div', { hasText: 'Drag' }).locator('dd')).toHaveText('5');
  });

  test('Bokstavsjakten: felåterkoppling och 9 av 10', async ({ page }) => {
    await page.goto('/spel/bokstavsjakten');
    await page.getByRole('button', { name: 'Börja spela' }).click();
    for (let n = 0; n < 10; n++) {
      const st = await sessionJSON(page, 'game:bokstavsjakten');
      const q = st.questions[st.index];
      const right = q.options.indexOf(q.answer);
      if (n === 0) {
        await page.locator('.pic-option').nth(right === 0 ? 1 : 0).click();
        await expect(page.locator('.feedback-oops')).toBeVisible();
        await page.waitForTimeout(400); // spelet spärrar tryck en kort stund efter ett fel (mot dubbeltryck)
      }
      await page.locator('.pic-option').nth(right).click();
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('.end-lines')).toContainText('9 av 10');
  });

  test('Stavningsmästaren: ledtråd och omgången överlever omladdning', async ({ page }) => {
    await page.goto('/spel/stavning');
    await page.getByRole('button', { name: 'Börja spela' }).click();
    for (let w = 0; w < 8; w++) {
      if (w === 0) {
        await page.getByRole('button', { name: 'Ledtråd' }).click();
        await expect(page.locator('.tile.glow')).toHaveCount(1);
      }
      if (w === 2) {
        await page.reload();
        await expect(page.locator('.spell-slots')).toBeVisible();
        expect((await sessionJSON(page, 'game:stavning')).index).toBe(2);
      }
      const st = await sessionJSON(page, 'game:stavning');
      const t = st.tasks[st.index];
      const used = new Set<number>();
      for (const ch of t.word as string) {
        const tile = t.tiles.find((x: { id: number; ch: string }) => x.ch === ch && !used.has(x.id));
        used.add(tile.id);
        const idx = t.tiles.findIndex((x: { id: number }) => x.id === tile.id);
        await page.locator('.tile').nth(idx).click({ force: true });
      }
      await expect.poll(async () => (await sessionJSON(page, 'game:stavning')).solved).toBe(true);
      await page.locator('.next-btn').click();
      await page.waitForTimeout(450);
    }
    await expect(page.locator('.game-end-card')).toContainText('stavningsmästare');
  });

  test('Matteäventyret: blandat upp till 20, 10 av 10', async ({ page }) => {
    await page.goto('/spel/matte');
    await page.getByRole('radio', { name: /Blandat/ }).click();
    await page.getByRole('radio', { name: /Upp till 20/ }).click();
    await page.getByRole('button', { name: 'Börja spela' }).click();
    for (let n = 0; n < 10; n++) {
      const st = await sessionJSON(page, 'game:matte');
      const q = st.questions[st.index];
      expect(q.answer).toBe(q.op === '+' ? q.a + q.b : q.a - q.b);
      await page.locator('.num-option').nth(q.options.indexOf(q.answer)).click();
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('.end-lines')).toContainText('10 av 10');
  });

  test('Mönsterdetektiven: paus och svår nivå', async ({ page }) => {
    await page.goto('/spel/monster');
    await page.getByRole('radio', { name: /Svår/ }).click();
    await page.getByRole('button', { name: 'Börja spela' }).click();
    await page.getByRole('button', { name: 'Pausa' }).click();
    await expect(page.getByRole('dialog', { name: 'Paus' })).toBeVisible();
    await page.getByRole('button', { name: 'Fortsätt' }).click();
    for (let n = 0; n < 10; n++) {
      const st = await sessionJSON(page, 'game:monster');
      const q = st.questions[st.index];
      const key = JSON.stringify(q.answer);
      const idx = q.options.findIndex((o: unknown) => JSON.stringify(o) === key);
      await page.locator('.pattern-option').nth(idx).click();
      await page.waitForTimeout(1900);
    }
    await expect(page.locator('.game-end-card')).toContainText('Mysteriet');
  });

  test('Sant eller falskt: förklaring och skydd mot dubbeltryck', async ({ page }) => {
    await page.goto('/spel/santfalskt');
    await page.getByRole('button', { name: 'Börja spela' }).click();
    for (let n = 0; n < 10; n++) {
      const st = await sessionJSON(page, 'game:santfalskt');
      const q = st.questions[st.index];
      await page.locator(q.answer ? '.tf-true' : '.tf-false').click();
      if (n === 0) await expect(page.locator('.quiz-result')).toBeVisible();
      await page.locator('.next-btn').dblclick();
      await page.waitForTimeout(450);
      // Andra trycket på "Nästa" får inte räknas som ett svar på nästa fråga.
      if (n < 9) expect((await sessionJSON(page, 'game:santfalskt')).solved).toBe(false);
    }
    await expect(page.locator('.end-lines')).toContainText('10 av 10');
  });

  test('Målarlådan: ritar på duken och visar teckningen', async ({ page }) => {
    await page.goto('/spel/malarladan');
    await page.getByRole('button', { name: 'Börja rita' }).click();
    const box = (await page.locator('.draw-canvas').boundingBox())!;
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    for (let i = 0; i < 20; i++) await page.mouse.move(box.x + 50 + i * 15, box.y + 50 + i * 8);
    await page.mouse.up();
    const painted = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.draw-canvas')!;
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 1] < 200) n++;
      return n;
    });
    expect(painted).toBeGreaterThan(500);
    await page.getByRole('button', { name: 'Klar' }).click();
    await expect(page.locator('.final-drawing')).toBeVisible();
  });
});

test('historik, stjärnor och nollställning', async ({ page }) => {
  await page.goto('/spel/matte');
  await page.getByRole('button', { name: 'Börja spela' }).click();
  for (let n = 0; n < 10; n++) {
    const st = await sessionJSON(page, 'game:matte');
    const q = st.questions[st.index];
    await page.locator('.num-option').nth(q.options.indexOf(q.answer)).click();
    await page.waitForTimeout(1500);
  }
  await expect(page.locator('.game-end-card')).toBeVisible();

  await page.goto('/lek');
  await expect(page.locator('.continue-card', { hasText: 'Matteäventyret' })).toBeVisible();
  await expect(page.locator('.game-card-stars')).toHaveCount(1);

  await page.goto('/hjalp');
  await page.getByRole('button', { name: 'Nollställ' }).click();
  await page.getByRole('button', { name: 'Ja, nollställ' }).click();
  await page.goto('/lek');
  await expect(page.locator('.continue-card')).toHaveCount(0);
});
