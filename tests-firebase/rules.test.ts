import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

/**
 * firestore.rules mot Firebase-emulatorn: rätt person kommer in, fel person stoppas.
 * Körs med `npm run test:firebase` (startar emulatorn själv).
 */
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-larlabbet',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/t1'), { role: 'teacher', name: 'Karin', email: 'k@s.se', createdAt: 1 });
    await setDoc(doc(db, 'users/t2'), { role: 'teacher', name: 'Olle', email: 'o@s.se', createdAt: 1 });
    await setDoc(doc(db, 'users/p1'), { role: 'parent', name: 'Per', email: 'p@h.se', createdAt: 1 });
    await setDoc(doc(db, 'classes/cA'), { name: '2B', grade: 2, teacherId: 't1', createdAt: 1 });
    await setDoc(doc(db, 'classes/cB'), { name: '5A', grade: 5, teacherId: 't2', createdAt: 1 });
    await setDoc(doc(db, 'classes/cA/students/s1'), { alias: 'Alva', avatar: 'uggla', progress: {}, createdAt: 1 });
    await setDoc(doc(db, 'classes/cA/students/s2'), { alias: 'Noah', avatar: 'rav', progress: {}, createdAt: 1 });
    await setDoc(doc(db, 'classes/cA/studentCodes/s1'), { loginCode: 'AAA111', parentCode: 'PPP111' });
    await setDoc(doc(db, 'classes/cA/assignments/a1'), { title: 'Uppdrag', items: [] });
    await setDoc(doc(db, 'classes/cB/assignments/b1'), { title: 'Annan klass', items: [] });
    await setDoc(doc(db, 'loginKeys/AAA111'), { classId: 'cA', studentId: 's1', teacherId: 't1' });
    await setDoc(doc(db, 'parentKeys/PPP111'), { classId: 'cA', studentId: 's1', teacherId: 't1' });
    await setDoc(doc(db, 'members/u1'), { classId: 'cA', studentId: 's1', code: 'AAA111', at: 1 });
    await setDoc(doc(db, 'quizzes/123456'), { hostUid: 'h1', state: null, phase: 'question', index: 2 });
  });
});

const teacher = (uid: string) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'password' } }).firestore();
const anon = (uid: string) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const nobody = () => env.unauthenticatedContext().firestore();

describe('lärare', () => {
  it('ser sin egen klass men inte någon annans', async () => {
    await assertSucceeds(getDoc(doc(teacher('t1'), 'classes/cA')));
    await assertFails(getDoc(doc(teacher('t1'), 'classes/cB')));
    await assertFails(getDoc(doc(teacher('t1'), 'classes/cB/assignments/b1')));
  });
  it('kan inte skapa en klass i någon annans namn', async () => {
    await assertSucceeds(setDoc(doc(teacher('t1'), 'classes/ny'), { name: '3C', grade: 3, teacherId: 't1', createdAt: 1 }));
    await assertFails(setDoc(doc(teacher('t1'), 'classes/ny2'), { name: '3C', grade: 3, teacherId: 't2', createdAt: 1 }));
  });
  it('kan inte ge sig själv en annan roll', async () => {
    await assertFails(updateDoc(doc(teacher('t1'), 'users/t1'), { role: 'admin' }));
    await assertFails(setDoc(doc(teacher('x9'), 'users/x9'), { role: 'admin', name: 'X', email: 'x@x.se', createdAt: 1 }));
    // Ett anonymt elevkonto kan inte bli lärare.
    await assertFails(setDoc(doc(anon('u9'), 'users/u9'), { role: 'teacher', name: 'X', email: 'x@x.se', createdAt: 1 }));
  });
});

describe('elev', () => {
  it('ser sin klass, sina uppdrag och sig själv, men inte klasskamraterna eller koderna', async () => {
    const db = anon('u1');
    await assertSucceeds(getDoc(doc(db, 'classes/cA')));
    await assertSucceeds(getDoc(doc(db, 'classes/cA/assignments/a1')));
    await assertSucceeds(getDoc(doc(db, 'classes/cA/students/s1')));
    await assertFails(getDoc(doc(db, 'classes/cA/students/s2')));
    await assertFails(getDoc(doc(db, 'classes/cA/studentCodes/s1')));
    await assertFails(getDoc(doc(db, 'classes/cB')));
  });
  it('får spara sina resultat men inte ändra sitt namn', async () => {
    const db = anon('u1');
    await assertSucceeds(updateDoc(doc(db, 'classes/cA/students/s1'), { progress: { a1: { 0: { stars: 3 } } }, lastActive: 2 }));
    await assertFails(updateDoc(doc(db, 'classes/cA/students/s1'), { alias: 'Kungen' }));
    await assertFails(updateDoc(doc(db, 'classes/cA/students/s2'), { progress: {} }));
  });
  it('kan bara koppla sig med en kod som finns och stämmer', async () => {
    await assertSucceeds(setDoc(doc(anon('u2'), 'members/u2'), { classId: 'cA', studentId: 's1', code: 'AAA111', at: 1 }));
    await assertFails(setDoc(doc(anon('u3'), 'members/u3'), { classId: 'cA', studentId: 's2', code: 'AAA111', at: 1 }));
    await assertFails(setDoc(doc(anon('u4'), 'members/u4'), { classId: 'cA', studentId: 's1', code: 'FEL999', at: 1 }));
  });
  it('tappar åtkomsten direkt när läraren byter kod', async () => {
    await env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), 'loginKeys/AAA111')));
    await assertFails(getDoc(doc(anon('u1'), 'classes/cA')));
  });
});

describe('koder', () => {
  it('går att slå upp en och en, men aldrig lista', async () => {
    await assertSucceeds(getDoc(doc(anon('u5'), 'loginKeys/AAA111')));
    await assertFails(getDocs(collection(anon('u5'), 'loginKeys')));
    await assertFails(getDocs(collection(anon('u5'), 'parentKeys')));
    await assertFails(getDoc(doc(nobody(), 'loginKeys/AAA111')));
  });
});

describe('förälder', () => {
  it('kopplar sig med föräldrakoden och ser sitt barn, men inte andra', async () => {
    const db = teacher('p1');
    await assertSucceeds(setDoc(doc(db, 'parents/p1/children/s1'), { classId: 'cA', code: 'PPP111', at: 1 }));
    await assertSucceeds(setDoc(doc(db, 'parents/p1/classes/cA'), { code: 'PPP111', at: 1 }));
    await assertSucceeds(getDoc(doc(db, 'classes/cA/students/s1')));
    await assertFails(getDoc(doc(db, 'classes/cA/students/s2')));
    await assertFails(setDoc(doc(db, 'parents/p1/children/s2'), { classId: 'cA', code: 'PPP111', at: 1 }));
  });
});

describe('klassquiz', () => {
  it('går att slå upp med koden men inte lista', async () => {
    await assertSucceeds(getDoc(doc(anon('e1'), 'quizzes/123456')));
    await assertFails(getDocs(collection(anon('e1'), 'quizzes')));
  });
  it('eleven svarar en gång på den öppna frågan', async () => {
    const db = anon('e1');
    await assertSucceeds(setDoc(doc(db, 'quizzes/123456/players/e1'), { name: 'Alva', at: 1 }));
    await assertSucceeds(setDoc(doc(db, 'quizzes/123456/answers/e1_2'), { pid: 'e1', index: 2, choice: 1, ms: 1500 }));
    await assertFails(setDoc(doc(db, 'quizzes/123456/answers/e1_2'), { pid: 'e1', index: 2, choice: 0, ms: 100 })); // ändra svar
    await assertFails(setDoc(doc(db, 'quizzes/123456/answers/e1_1'), { pid: 'e1', index: 1, choice: 1, ms: 100 })); // gammal fråga
    await assertFails(setDoc(doc(db, 'quizzes/123456/answers/e2_2'), { pid: 'e2', index: 2, choice: 1, ms: 100 })); // i någon annans namn
  });
  it('bara läraren ser namnen och svaren och styr quizet', async () => {
    await assertFails(getDocs(collection(anon('e1'), 'quizzes/123456/players')));
    await assertFails(getDocs(collection(anon('e1'), 'quizzes/123456/answers')));
    await assertSucceeds(getDocs(collection(anon('h1'), 'quizzes/123456/players')));
    await assertFails(updateDoc(doc(anon('e1'), 'quizzes/123456'), { phase: 'end' }));
    await assertSucceeds(updateDoc(doc(anon('h1'), 'quizzes/123456'), { phase: 'reveal' }));
  });
  it('inga svar när frågan är stängd, och inga för långa namn', async () => {
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'quizzes/123456'), { phase: 'reveal' }));
    await assertFails(setDoc(doc(anon('e1'), 'quizzes/123456/answers/e1_2'), { pid: 'e1', index: 2, choice: 1, ms: 100 }));
    await assertFails(setDoc(doc(anon('e1'), 'quizzes/123456/players/e1'), { name: 'Ett alldeles för långt namn', at: 1 }));
  });
});
