import { describe, expect, it } from 'vitest';
import { GRADES } from '../curriculum/types';
import { buildSheet, DEFAULT_CONFIG, facitFor, printableActivities, promptParts, suggestSections, type SheetConfig } from './worksheet';

const cfg = (patch: Partial<SheetConfig>): SheetConfig => ({ ...DEFAULT_CONFIG, ...patch });

describe('Arbetsblad', () => {
  it('samma bladnummer ger exakt samma blad', () => {
    const c = cfg({ seed: 4821, sections: [{ activityId: 'ma-plus-minus', level: 'blandat-20', count: 12 }, { activityId: 'sv-ordklasser', count: 6 }] });
    expect(JSON.stringify(buildSheet(c))).toBe(JSON.stringify(buildSheet(c)));
    expect(JSON.stringify(buildSheet(c))).not.toBe(JSON.stringify(buildSheet({ ...c, seed: 4822 })));
  });

  it('varianterna A och B har olika frågor', () => {
    const c = cfg({ seed: 77, variants: 2, sections: [{ activityId: 'ma-multiplikation', level: 'alla', count: 10 }] });
    const a = facitFor(buildSheet(c, 0))[0].answers.join();
    const b = facitFor(buildSheet(c, 1))[0].answers.join();
    expect(a).not.toBe(b);
    expect(buildSheet(c, 1).number).toBe('77-B');
  });

  it('varje övning går att skriva ut på alla nivåer, med facit för varje uppgift', () => {
    for (const a of printableActivities('alla', 'alla')) {
      for (const level of a.levels?.map((l) => l.value) ?? [undefined]) {
        for (const mode of ['auto', 'choose', 'write'] as const) {
          const sheet = buildSheet(cfg({ seed: 9, mode, words: 'hund – dog\nkatt – cat\nhus – house', sections: [{ activityId: a.id, level, count: 8 }] }));
          const sec = sheet.sections[0];
          expect(sec.problem, `${a.id}/${level}`).toBeUndefined();
          expect(sec.items.length, `${a.id}/${level}`).toBe(8);
          expect(sec.instruction.length).toBeGreaterThan(5);
          const facit = facitFor(sheet)[0].answers;
          expect(facit.length).toBe(8);
          expect(facit.every((f) => f && !/undefined|NaN/.test(f)), `${a.id}/${level}: ${facit.join('|')}`).toBe(true);
          // Bilder utan text kan aldrig bli "skriv svaret".
          for (const it of sec.items) if (it.q.kind === 'choice' && it.q.options.some((o) => o.hideLabel)) expect(it.answer).toBe('choose');
        }
      }
    }
  });

  it('räknetal blir skrivuppgifter och glosor blir glosförhör', () => {
    const math = buildSheet(cfg({ sections: [{ activityId: 'ma-multiplikation', level: '2-5-10', count: 6 }] })).sections[0];
    expect(math.layout).toBe('compact');
    expect(math.items.every((i) => i.answer === 'write')).toBe(true);
    const glos = buildSheet(cfg({ sections: [{ activityId: 'en-djur', level: 'sv-en', count: 8 }] })).sections[0];
    expect(glos.layout).toBe('glosor');
    expect(glos.instruction).toMatch(/engelska/);
    const hunt = buildSheet(cfg({ sections: [{ activityId: 'sv-bokstavsljud', level: 'latt', count: 6 }] })).sections[0];
    expect(hunt.layout).toBe('pictures');
  });

  it('saknade glosor ger ett tydligt meddelande', () => {
    const s = buildSheet(cfg({ sections: [{ activityId: 'en-egna-glosor', count: 5 }] })).sections[0];
    expect(s.problem).toMatch(/glosor/);
  });

  it('skriver om räknefrågor med en svarslinje', () => {
    expect(promptParts('3 + 2 = ?')).toEqual({ before: '3 + 2 =', after: '', blank: true });
    expect(promptParts('7 + __ = 10')).toEqual({ before: '7 + ', after: ' = 10', blank: true });
    expect(promptParts('Vad är klockan?').blank).toBe(false);
  });

  it('föreslår övningar för varje årskurs', () => {
    for (const g of GRADES) {
      const s = suggestSections('alla', g, 3);
      expect(s.length).toBe(3);
      expect(buildSheet(cfg({ grade: g, sections: s })).sections.every((x) => !x.problem)).toBe(true);
    }
  });

  it('läsförståelse: texten följer med och frågorna ringas in', () => {
    const s = buildSheet(cfg({ grade: 5, sections: [{ activityId: 'sv-lasforstaelse-4-6', count: 8 }] })).sections[0];
    expect(s.layout).toBe('reading');
    expect(s.items.length).toBe(8);
    expect(s.items.every((i) => i.answer === 'choose' && i.q.kind === 'choice' && i.q.passage)).toBe(true);
    // Frågor om samma text ligger i följd, så att texten bara skrivs ut en gång per grupp.
    const ids = s.items.map((i) => (i.q.kind === 'choice' ? i.q.passage!.id : ''));
    const groups = ids.filter((id, k) => id !== ids[k - 1]);
    expect(new Set(groups).size).toBe(groups.length);
  });
});
