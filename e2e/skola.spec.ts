import { addStudents, codesFor, createClass, createTeacher, expect, FIREBASE, mode, playRunner, test, uniqueEmail } from './helpers';

/**
 * Skoldelen: lärare → elev → förälder → lärare.
 * Körs i demoläget (npm run test:e2e) och mot Firebase-emulatorn med de riktiga
 * reglerna (npm run test:firebase).
 */

test('hela kedjan: lärare ger uppdrag, elev gör det, förälder och lärare ser resultatet', async ({ page }) => {
  let codes = { login: '', parent: '' };
  let noahOld = '';
  let classId = '';
  const karin = uniqueEmail('karin');
  const per = uniqueEmail('per');

  await test.step('skolportalen', async () => {
    await page.goto('/skola');
    await expect(page.locator('.role-card')).toHaveCount(3);
    await expect(page.locator('.demo-banner')).toHaveCount(FIREBASE ? 0 : 1);
  });

  await test.step('läraren skapar konto, klass och elever', async () => {
    await page.goto('/larare');
    await page.getByRole('tab', { name: 'Skapa konto' }).click();
    await page.fill('#auth-name', 'Karin');
    await page.fill('#auth-email', karin);
    await page.fill('#auth-password', 'hemligt123');
    await expect(page.getByRole('button', { name: 'Skapa konto', exact: true })).toBeDisabled(); // kräver godkännande
    await page.locator('.check input').check();
    await page.getByRole('button', { name: 'Skapa konto', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mina klasser');
    classId = await createClass(page, '2B', 'Åk 2');
    await addStudents(page, classId, ['Alva S', 'Noah', 'Maja K']);
    codes = await codesFor(page, 'Alva S');
    expect(codes.login).toMatch(/^[A-Z2-9]{6}$/);
    expect(codes.parent).not.toBe(codes.login);
  });

  await test.step('nya koder ersätter de gamla', async () => {
    noahOld = (await codesFor(page, 'Noah')).login;
    await page.locator('.data-table tbody tr', { hasText: 'Noah' }).getByRole('button', { name: 'Nya koder' }).click();
    await expect.poll(async () => (await codesFor(page, 'Noah')).login).not.toBe(noahOld);
  });

  await test.step('egna glosor', async () => {
    await page.goto(`/larare/klass/${classId}/glosor`);
    await page.getByRole('button', { name: 'Nya glosor' }).click();
    await page.fill('#wl-title', 'Vecka 47 – frukter');
    await page.fill('#wl-text', 'päron – pear\nplommon – plum\nvindruva – grape\ncitron – lemon');
    await expect(page.locator('.overlay-card')).toContainText('4 glosor');
    await page.getByRole('button', { name: 'Spara' }).click();
    // Vänta tills listan är sparad (mot Firebase tar det en stund).
    await expect(page.locator('.class-card', { hasText: 'Vecka 47 – frukter' })).toBeVisible();
  });

  await test.step('uppdrag med fyra övningar', async () => {
    await page.goto(`/larare/klass/${classId}/uppdrag/nytt`);
    const cat = page.locator('.editor-catalog');
    await cat.getByRole('button', { name: 'Matte' }).click();
    await expect(cat.locator('.catalog-item', { hasText: 'Ekvationer' })).toHaveCount(0); // åk 2 ser inte åk 4–6
    await cat.locator('.catalog-item', { hasText: 'Klockan' }).getByRole('button', { name: 'Lägg till' }).click();
    await cat.getByRole('button', { name: 'Svenska' }).click();
    await cat.locator('.catalog-item', { hasText: 'Alfabetisk ordning' }).getByRole('button', { name: 'Lägg till' }).click();
    await cat.locator('.catalog-item', { hasText: 'Stava ordet' }).getByRole('button', { name: 'Lägg till' }).click();
    await cat.getByRole('button', { name: 'Engelska' }).click();
    await cat.locator('.catalog-item', { hasText: 'Egna glosor' }).getByRole('button', { name: 'Lägg till' }).click();
    const items = page.locator('.editor-main .editor-item');
    await expect(items).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const selects = items.nth(i).locator('select');
      // Sista valet i varje övning är antalet frågor, utom för glosor där listan kommer sist.
      const countSelect = i === 3 ? selects.nth(1) : selects.last();
      await countSelect.selectOption('5');
    }
    await page.fill('#as-title', 'Veckans uppdrag');
    await page.fill('#as-message', 'Gör klart innan fredag!');
    await page.fill('#as-due', '2030-11-13');
    await page.getByRole('button', { name: 'Ge uppdraget till klassen' }).click();
    await expect(page.locator('.assignment-admin', { hasText: 'Veckans uppdrag' })).toContainText('0 av 3 klara');
  });

  await test.step('inloggningskort och föräldralappar', async () => {
    await page.goto(`/larare/klass/${classId}/kort`);
    await expect(page.locator('.login-card .qr svg')).toHaveCount(3);
    await page.getByRole('button', { name: 'Föräldralappar' }).click();
    await expect(page.locator('.parent-slip')).toHaveCount(3);
    await page.goto('/larare');
    await page.getByRole('button', { name: 'Logga ut' }).click();
  });

  await test.step('eleven loggar in med QR-länk och gör uppdraget', async () => {
    await page.goto(`/in/${noahOld}`);
    await expect(page.locator('.form-error').first()).toBeVisible(); // gammal kod gäller inte
    await page.goto(`/in/${codes.login}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hej Alva S!');
    expect(await mode(page)).toBe('lek'); // åk 2 ser Leklabbet
    await expect(page.locator('.assignment-card')).toContainText('Gör klart innan fredag!');
    for (let i = 0; i < 4; i++) {
      await page.locator('.item-row').nth(i).click();
      await playRunner(page, { wrongFirst: i === 0 ? 1 : 0 });
      await expect(page.locator('.end-lines')).toContainText('av 5');
      await page.getByRole('button', { name: 'Till mina uppdrag' }).click();
    }
    await expect(page.locator('.assignment-card')).toContainText('4 av 4 klara');
    await expect(page.locator('.item-stars')).toHaveCount(4);
    await page.getByRole('button', { name: 'Byt elev' }).click();
  });

  await test.step('föräldern kopplar sig och ser bara sitt barn', async () => {
    await page.goto('/foralder');
    await page.getByRole('tab', { name: 'Skapa konto' }).click();
    await page.fill('#auth-name', 'Per');
    await page.fill('#auth-email', per);
    await page.fill('#auth-password', 'losenord1');
    await page.locator('.check input').check();
    await page.getByRole('button', { name: 'Skapa konto', exact: true }).click();
    await page.fill('#code-input', 'XXXXXX');
    await page.getByRole('button', { name: 'Koppla', exact: true }).click();
    await expect(page.locator('.form-error')).toBeVisible();
    await page.fill('#code-input', codes.parent);
    await page.getByRole('button', { name: 'Koppla', exact: true }).click();
    await expect(page.locator('.child-section h2')).toHaveText('Alva S');
    await expect(page.locator('.assignment-card')).toContainText('4 av 4 klara');
    await expect(page.locator('.assignment-card button.item-row')).toHaveCount(0); // kan inte göra elevens övningar
    await page.getByRole('button', { name: 'Logga ut' }).click();
  });

  await test.step('läraren ser resultatet', async () => {
    await page.goto('/larare');
    await page.fill('#auth-email', karin);
    await page.fill('#auth-password', 'fel-lösenord');
    await page.getByRole('button', { name: 'Logga in', exact: true }).click();
    await expect(page.locator('.auth-card')).toContainText('Fel e-postadress');
    await page.fill('#auth-password', 'hemligt123');
    await page.getByRole('button', { name: 'Logga in', exact: true }).click();
    await page.locator('.class-card', { hasText: '2B' }).click();
    await expect(page.locator('.assignment-admin')).toContainText('1 av 3 klara');
    await page.goto(`/larare/klass/${classId}/resultat`);
    const cell = page.locator('.data-table tbody tr', { hasText: 'Alva S' }).locator('.result-cell');
    await expect(cell).toContainText('%');
    await expect(cell).toContainText('4/4');
    await cell.click();
    await expect(page.locator('.detail-list li')).toHaveCount(4);
  });
});

test('elever hamnar i rätt del efter klassens årskurs', async ({ page }) => {
  await createTeacher(page);
  const codes: Record<string, string> = {};
  for (const [name, grade] of [['2B', 'Åk 2'], ['5A', 'Åk 5']]) {
    const id = await createClass(page, name, grade);
    await page.goto(`/larare/klass/${id}/uppdrag/nytt`);
    await page.locator('.editor-catalog .catalog-item').first().getByRole('button', { name: 'Lägg till' }).click();
    await page.fill('#as-title', 'Test');
    await page.getByRole('button', { name: 'Ge uppdraget till klassen' }).click();
    await addStudents(page, id, ['Elev']);
    codes[name] = (await codesFor(page, 'Elev')).login;
  }
  expect(await mode(page)).toBe('lar'); // lärarsidorna är Lärlabbet
  await page.getByRole('button', { name: 'Logga ut' }).click();

  await page.goto(`/in/${codes['2B']}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hej Elev!');
  await expect.poll(() => mode(page)).toBe('lek');
  await page.getByRole('button', { name: 'Byt elev' }).click();

  await page.goto(`/in/${codes['5A']}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hej Elev!');
  await expect.poll(() => mode(page)).toBe('lar');
});

test('lärarens uppdrag kan skrivas ut som arbetsblad', async ({ page }) => {
  await createTeacher(page);
  const id = await createClass(page, '4A', 'Åk 4');
  await page.goto(`/larare/klass/${id}/uppdrag/nytt`);
  const cat = page.locator('.editor-catalog');
  await cat.getByRole('button', { name: 'Matte' }).click();
  await cat.locator('.catalog-item', { hasText: 'Gångertabellen' }).getByRole('button', { name: 'Lägg till' }).click();
  await page.fill('#as-title', 'Tabellträning');
  await page.getByRole('button', { name: 'Ge uppdraget till klassen' }).click();
  await page.getByRole('button', { name: 'Skriv ut' }).click();
  await expect(page.locator('.paper h1').first()).toHaveText('Tabellträning');
  await expect(page.locator('.paper .ws-title').first()).toContainText('Årskurs 4');
});
