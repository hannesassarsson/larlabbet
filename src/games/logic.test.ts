import { describe, expect, it } from 'vitest';
import { PIC_IDS, PICTURES } from '../components/pictures';
import { seeded } from '../lib/random';
import { buildRound, firstLetter, LEVELS } from './bokstavsjakten/logic';
import { buildMathRound, makeOptions } from './matte/logic';
import { createDeck, flipCard, memoryStars } from './memory/logic';
import { buildPatternRound, describeToken, tokenKey, type PatternLevel } from './monster/logic';
import { GAMES, searchGames } from './registry';
import { buildQuizRound, STATEMENTS } from './santfalskt/questions';
import { applyHint, buildSpellRound, isCorrect, nextHint } from './stavning/logic';

const seeds = Array.from({ length: 40 }, (_, i) => i + 1);

describe('Memory', () => {
  it('skapar rätt antal par med två av varje bild', () => {
    for (const pairs of [4, 6, 8, 10]) {
      const deck = createDeck(pairs, seeded(pairs));
      expect(deck).toHaveLength(pairs * 2);
      const counts = new Map<string, number>();
      deck.forEach((c) => counts.set(c.pic, (counts.get(c.pic) ?? 0) + 1));
      expect([...counts.values()].every((n) => n === 2)).toBe(true);
    }
  });
  it('hanterar vändningar och spärrar ett tredje kort', () => {
    const deck = createDeck(4, seeded(3));
    const first = flipCard(deck, [], 0);
    expect(first.kind).toBe('first');
    const twin = deck.findIndex((c, i) => i !== 0 && c.pic === deck[0].pic);
    expect(flipCard(deck, [0], twin).kind).toBe('match');
    const other = deck.findIndex((c) => c.pic !== deck[0].pic);
    expect(flipCard(deck, [0], other).kind).toBe('miss');
    expect(flipCard(deck, [0], 0).kind).toBe('ignored');
    expect(flipCard(deck, [0, other], twin).kind).toBe('ignored');
  });
  it('ger fler stjärnor för färre drag', () => {
    expect(memoryStars(6, 6)).toBe(3);
    expect(memoryStars(30, 6)).toBe(1);
  });
});

describe('Bokstavsjakten', () => {
  it('har exakt ett rätt svar per fråga', () => {
    for (const seed of seeds) {
      for (const level of LEVELS) {
        const round = buildRound(level.value, seeded(seed));
        expect(round).toHaveLength(10);
        for (const q of round) {
          expect(q.options).toHaveLength(level.options);
          expect(new Set(q.options).size).toBe(level.options);
          expect(q.options.filter((o) => firstLetter(o) === q.letter)).toEqual([q.answer]);
        }
      }
    }
  });
});

describe('Stavningsmästaren', () => {
  it('ger ord med alla bokstäver som brickor och ökande längd', () => {
    for (const seed of seeds) {
      const round = buildSpellRound('stege', seeded(seed));
      expect(round).toHaveLength(8);
      for (let i = 1; i < round.length; i++) expect(round[i].word.length).toBeGreaterThanOrEqual(round[i - 1].word.length);
      for (const task of round) {
        const letters = task.tiles.map((t) => t.ch);
        for (const ch of task.word) {
          const idx = letters.indexOf(ch);
          expect(idx).toBeGreaterThanOrEqual(0);
          letters.splice(idx, 1);
        }
      }
    }
  });
  it('ledtrådar leder alltid fram till rätt ord', () => {
    for (const seed of seeds) {
      for (const task of buildSpellRound('svar', seeded(seed))) {
        // Börja med alla brickor i fel ordning.
        let placed: (number | null)[] = task.word.split('').map((_, i) => task.tiles[i]?.id ?? null);
        for (let n = 0; n < 20 && !isCorrect(task, placed); n++) {
          const h = nextHint(task, placed);
          expect(h).not.toBeNull();
          placed = applyHint(placed, h!);
        }
        expect(isCorrect(task, placed)).toBe(true);
      }
    }
  });
});

describe('Matteäventyret', () => {
  it('håller sig inom talområdet och har rätt svar bland alternativen', () => {
    for (const seed of seeds) {
      for (const max of [5, 10, 20, 50, 100]) {
        for (const op of ['plus', 'minus', 'blandat'] as const) {
          const round = buildMathRound({ op, max }, seeded(seed * max));
          expect(round).toHaveLength(10);
          for (const t of round) {
            expect(t.answer).toBe(t.op === '+' ? t.a + t.b : t.a - t.b);
            expect(t.answer).toBeGreaterThanOrEqual(0);
            expect(Math.max(t.a, t.b, t.answer)).toBeLessThanOrEqual(max);
            expect(t.options).toContain(t.answer);
            expect(new Set(t.options).size).toBe(4);
            if (op === 'plus') expect(t.op).toBe('+');
            if (op === 'minus') expect(t.op).toBe('−');
          }
          const keys = round.map((t) => `${t.a}${t.op}${t.b}`);
          if (max >= 10) expect(new Set(keys).size).toBe(10);
        }
      }
    }
  });
  it('alternativen är rimliga tal', () => {
    expect(makeOptions(0, 5, seeded(1)).every((n) => n >= 0 && n <= 5)).toBe(true);
  });
});

describe('Mönsterdetektiven', () => {
  it('har ett unikt rätt svar och unika alternativ', () => {
    for (const seed of seeds) {
      for (const level of ['latt', 'mellan', 'svar'] as PatternLevel[]) {
        const round = buildPatternRound(level, seeded(seed));
        expect(round).toHaveLength(10);
        for (const t of round) {
          const keys = t.options.map(tokenKey);
          expect(new Set(keys).size).toBe(keys.length);
          expect(keys.filter((k) => k === tokenKey(t.answer))).toHaveLength(1);
          expect(t.options.length).toBe(level === 'latt' ? 3 : 4);
          expect(t.sequence.length).toBeGreaterThanOrEqual(4);
        }
      }
    }
  });
  it('beskriver former med korrekt svensk böjning', () => {
    expect(describeToken({ t: 'shape', shape: 'heart', color: '#7BD389', size: 1 })).toBe('litet grönt hjärta');
    expect(describeToken({ t: 'shape', shape: 'circle', color: '#5BC0EB', size: 3 })).toBe('stor blå cirkel');
  });
});

describe('Sant eller falskt', () => {
  it('blandar sanna och falska påståenden utan dubbletter', () => {
    for (const seed of seeds) {
      const round = buildQuizRound('alla', seeded(seed));
      expect(round).toHaveLength(10);
      expect(new Set(round.map((s) => s.text)).size).toBe(10);
      const f = round.filter((s) => !s.answer).length;
      expect(f).toBeGreaterThanOrEqual(3);
      expect(f).toBeLessThanOrEqual(6);
    }
  });
  it('varje påstående har förklaring', () => {
    expect(STATEMENTS.every((s) => s.explain.length > 10)).toBe(true);
  });
});

describe('Bilder och sök', () => {
  it('alla bilder har ett ord', () => {
    expect(PIC_IDS.every((id) => PICTURES[id].word.length > 0)).toBe(true);
  });
  it('söker och filtrerar spel', () => {
    expect(searchGames('', 'alla')).toHaveLength(GAMES.length);
    expect(searchGames('MATTE', 'alla').map((g) => g.id)).toContain('matte');
    expect(searchGames('räkna', 'alla').map((g) => g.id)).toEqual(['matte']);
    expect(searchGames('', 'kreativ').map((g) => g.id)).toEqual(['malarladan']);
    expect(searchGames('zzzz', 'alla')).toHaveLength(0);
    expect(searchGames('stava', 'lasning').map((g) => g.id)).toEqual(['stavning']);
  });
});
