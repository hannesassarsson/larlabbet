import { test as base, expect, type Page } from '@playwright/test';

/**
 * Gemensamt för alla webbläsartester.
 *
 * `test` här är Playwrights test med en automatisk vakt: varje test misslyckas
 * om sidan kastar ett JavaScript-fel eller loggar ett fel i konsolen, även om
 * testet i övrigt inte tittar efter det.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        const t = m.text();
        // Nätverksfel som testerna själva orsakar (offline-testet) räknas inte.
        if (/Failed to load resource|net::ERR_INTERNET_DISCONNECTED/.test(t)) return;
        errors.push(`console: ${t}`);
      });
      await use(errors);
      expect(errors, 'Sidan fick JavaScript-fel').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/* ---------- Spellägen i sessionStorage ----------
   Spelen sparar pågående omgång i sessionStorage. Testerna läser därifrån för
   att veta det rätta svaret, så att de kan spela igenom hela omgångar. */

export async function sessionJSON<T = any>(page: Page, key: string): Promise<T | null> {
  return page.evaluate((k) => {
    const raw = sessionStorage.getItem('leklandet:' + k);
    return raw ? JSON.parse(raw) : null;
  }, key);
}

/** Pågående omgång i den gemensamma övningsspelaren (ActivityRunner). */
export async function runState(page: Page): Promise<any | null> {
  return page.evaluate(() => {
    for (const k of Object.keys(sessionStorage)) {
      if (!k.includes('game:run:')) continue;
      const v = JSON.parse(sessionStorage.getItem(k) || 'null');
      if (v && v.phase === 'playing') return v;
    }
    return null;
  });
}

/**
 * Spelar en övning i den gemensamma spelaren till slutet.
 * `wrongFirst`: antal frågor i början där ett fel svar väljs först.
 */
export async function playRunner(page: Page, { wrongFirst = 0 } = {}) {
  const start = page.getByRole('button', { name: 'Börja', exact: true });
  if (await start.count()) await start.click();
  await expect.poll(() => runState(page)).not.toBeNull();
  for (let n = 0; n < 40; n++) {
    const st = await runState(page);
    if (!st) break;
    const q = st.questions[st.index];
    if (q.kind === 'choice') {
      if (n < wrongFirst) {
        const wrong = q.options.findIndex((_: unknown, i: number) => i !== q.answer);
        await page.locator('.run-option').nth(wrong).click();
        await page.waitForTimeout(420);
      }
      const now = await runState(page);
      if (now && !now.solved) await page.locator('.run-option').nth(q.answer).click();
    } else if (q.kind === 'order') {
      for (const item of q.items) {
        await page.locator('.order-choices .run-option', { hasText: item }).first().click();
        await page.waitForTimeout(60);
      }
    } else {
      const used = new Set<number>();
      for (const ch of q.answer.toLocaleUpperCase('sv')) {
        const i = st.tiles.findIndex((t: string, k: number) => t === ch && !used.has(k));
        used.add(i);
        await page.locator('.spell-tiles .tile').nth(i).click({ force: true });
      }
    }
    await page.waitForTimeout(450);
    const next = page.locator('.next-btn');
    if (await next.count()) {
      await next.click();
      await page.waitForTimeout(450);
    } else {
      await page.waitForTimeout(1300); // automatisk övergång
    }
  }
  await expect(page.locator('.game-end-card, .lar-result-card')).toBeVisible();
}

/* ---------- Skoldelen (demoläge) ---------- */

export async function createTeacher(page: Page, email = 'larare@skola.se', password = 'hemligt123') {
  await page.goto('/larare');
  await page.getByRole('tab', { name: 'Skapa konto' }).click();
  await page.fill('#auth-name', 'Karin Lärare');
  await page.fill('#auth-email', email);
  await page.fill('#auth-password', password);
  await page.locator('.check input').check();
  await page.getByRole('button', { name: 'Skapa konto', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mina klasser');
}

/** Skapar en klass och returnerar dess id. `grade` är knappens text, t.ex. "Åk 2" eller "F". */
export async function createClass(page: Page, name: string, grade: string) {
  await page.goto('/larare');
  await page.fill('#class-name', name);
  await page.getByRole('radio', { name: grade, exact: true }).click();
  await page.getByRole('button', { name: 'Skapa klass' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  return page.url().split('/klass/')[1].split('/')[0];
}

export async function addStudents(page: Page, classId: string, aliases: string[]) {
  await page.goto(`/larare/klass/${classId}/elever`);
  await page.fill('#students-text', aliases.join('\n'));
  await page.getByRole('button', { name: aliases.length > 1 ? `Lägg till ${aliases.length} elever` : 'Lägg till elev' }).click();
  await expect(page.locator('.data-table tbody tr')).toHaveCount(aliases.length);
}

export async function codesFor(page: Page, alias: string) {
  const row = page.locator('.data-table tbody tr', { hasText: alias });
  const login = (await row.locator('td.code').nth(0).innerText()).replace('-', '');
  const parent = (await row.locator('td.code').nth(1).innerText()).replace('-', '');
  return { login, parent };
}

export const mode = (page: Page) => page.evaluate(() => document.documentElement.dataset.mode);

/** Sätter ett utkast för arbetsbladssidan innan den öppnas. */
export async function seedWorksheet(page: Page, config: Record<string, unknown>) {
  await page.goto('/start');
  await page.evaluate((c) => localStorage.setItem('leklandet:arbetsblad-utkast', JSON.stringify(c)), config);
}
