import { describe, expect, it } from 'vitest';
import { seeded } from '../lib/random';
import { BUILTIN_LISTS, parseWordList } from './engelska';
import { ACTIVITIES, activitiesFor } from './index';
import { clockWords } from './matematik';
import { GRADES, SUBJECTS } from './types';

const seeds = Array.from({ length: 25 }, (_, i) => i + 1);

describe('Kursplaneinnehåll', () => {
  it('har unika id:n', () => {
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length);
  });

  it('varje ämne har innehåll i varje årskurs F–6', () => {
    // Engelska har ingen kursplan i förskoleklass – den börjar i åk 1.
    for (const s of SUBJECTS) for (const g of GRADES) if (!(s.id === 'engelska' && g === 0)) expect(activitiesFor(s.id, g).length, `${s.id} åk ${g}`).toBeGreaterThan(0);
  });

  it('varje aktivitet ger giltiga frågor på alla nivåer', () => {
    const list = { id: 'x', title: 'Test', pairs: parseWordList('hund – dog\nkatt – cat\nhus – house\nbil – car') };
    for (const a of ACTIVITIES) {
      if (a.game) continue;
      expect(a.area && a.description, a.id).toBeTruthy();
      for (const level of a.levels?.map((l) => l.value) ?? [undefined]) {
        for (const seed of seeds) {
          const qs = a.generate(level, 10, seeded(seed), { wordList: list });
          expect(qs.length, `${a.id}/${level}`).toBe(10);
          for (const q of qs) {
            const tag = `${a.id}/${level}: ${q.prompt}`;
            if (q.kind === 'choice') {
              const labels = q.options.map((o) => o.label);
              expect(new Set(labels).size, tag + ' ' + labels.join('|')).toBe(labels.length);
              expect(q.options.length, tag).toBeGreaterThanOrEqual(2);
              expect(q.answer, tag).toBeGreaterThanOrEqual(0);
              expect(q.answer, tag).toBeLessThan(q.options.length);
              expect(labels.every((l) => !/NaN|undefined|Infinity/.test(l)), tag + labels.join('|')).toBe(true);
            } else if (q.kind === 'order') {
              expect(new Set(q.items).size, tag).toBe(q.items.length);
              expect(q.items.length, tag).toBeGreaterThanOrEqual(3);
            } else {
              expect(q.answer.length, tag).toBeGreaterThan(0);
            }
          }
        }
      }
    }
  });

  it('räknar matte rätt', () => {
    const find = (id: string) => ACTIVITIES.find((a) => a.id === id)!;
    for (const seed of seeds) {
      for (const q of find('ma-multiplikation').generate('alla', 10, seeded(seed))) {
        if (q.kind !== 'choice') continue;
        const [k, t] = q.prompt.replace(' = ?', '').split(' · ').map(Number);
        expect(Number(q.options[q.answer].label)).toBe(k * t);
      }
      for (const q of find('ma-ekvationer').generate('blandat', 10, seeded(seed))) {
        if (q.kind !== 'choice') continue;
        const x = Number(q.options[q.answer].label);
        const m = q.prompt.match(/^x ([+−]) (\d+) = (\d+)$/);
        if (m) expect(m[1] === '+' ? x + Number(m[2]) : x - Number(m[2])).toBe(Number(m[3]));
        const g = q.prompt.match(/^(\d+)x = (\d+)$/);
        if (g) expect(Number(g[1]) * x).toBe(Number(g[2]));
      }
      for (const q of find('ma-prioritering').generate(undefined, 10, seeded(seed))) {
        if (q.kind !== 'choice') continue;
        const expr = q.prompt.replace(' = ?', '').replace(/·/g, '*').replace(/−/g, '-');
        // eslint-disable-next-line no-new-func
        expect(Number(q.options[q.answer].label)).toBe(Function(`return ${expr}`)());
      }
    }
  });

  it('säger klockan på svenska', () => {
    expect(clockWords(3, 0)).toBe('tre');
    expect(clockWords(3, 30)).toBe('halv fyra');
    expect(clockWords(3, 15)).toBe('kvart över tre');
    expect(clockWords(3, 45)).toBe('kvart i fyra');
    expect(clockWords(12, 30)).toBe('halv ett');
    expect(clockWords(11, 25)).toBe('fem i halv tolv');
  });

  it('tolkar inklistrade glosor', () => {
    expect(parseWordList('hund – dog\nkatt\tcat\nhus = house\n\nsol: sun')).toEqual([
      { sv: 'hund', en: 'dog' },
      { sv: 'katt', en: 'cat' },
      { sv: 'hus', en: 'house' },
      { sv: 'sol', en: 'sun' },
    ]);
    expect(BUILTIN_LISTS.every((l) => l.pairs.length >= 8)).toBe(true);
  });
});
