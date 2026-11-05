import { randInt, shuffle, type Rng } from '../../lib/random';

export type Op = 'plus' | 'minus' | 'blandat';

export interface MathSettings {
  op: Op;
  max: number;
}

export const RANGES = [
  { value: 5, label: 'Upp till 5', hint: 'Allra första' },
  { value: 10, label: 'Upp till 10', hint: 'Talkamrater' },
  { value: 20, label: 'Upp till 20', hint: 'Tiotalsövergång' },
  { value: 50, label: 'Upp till 50', hint: 'Större tal' },
  { value: 100, label: 'Upp till 100', hint: 'Utmaning' },
];

export const OPS: { value: Op; label: string; hint: string }[] = [
  { value: 'plus', label: 'Plus', hint: '3 + 2' },
  { value: 'minus', label: 'Minus', hint: '5 − 2' },
  { value: 'blandat', label: 'Blandat', hint: 'Plus och minus' },
];

export interface MathTask {
  a: number;
  b: number;
  op: '+' | '−';
  answer: number;
  options: number[];
}

export const MATH_ROUND = 10;

/** Skapar unika uppgifter inom talområdet. Alla svar ligger mellan 0 och max. */
export function buildMathRound(settings: MathSettings, rng?: Rng, length = MATH_ROUND): MathTask[] {
  const { max } = settings;
  const seen = new Set<string>();
  const tasks: MathTask[] = [];
  const r = rng ?? Math.random;
  let guard = 0;
  while (tasks.length < length && guard++ < 2000) {
    const op: '+' | '−' =
      settings.op === 'plus' ? '+' : settings.op === 'minus' ? '−' : r() < 0.5 ? '+' : '−';
    let a: number;
    let b: number;
    if (op === '+') {
      const sum = randInt(Math.min(2, max), max, rng);
      a = randInt(0, sum, rng);
      b = sum - a;
    } else {
      a = randInt(1, max, rng);
      b = randInt(0, a, rng);
    }
    // Undvik för många uppgifter med 0 och dubbletter.
    if ((a === 0 || b === 0) && r() < 0.85) continue;
    const key = `${a}${op}${b}`;
    // Tillåt dubbletter först när talområdet är för litet för att räcka.
    if (seen.has(key) && guard < 1500) continue;
    seen.add(key);
    const answer = op === '+' ? a + b : a - b;
    tasks.push({ a, b, op, answer, options: makeOptions(answer, max, rng) });
  }
  // Mjuk progression: mindre svar först, men blanda inom grupperna.
  const sorted = tasks.slice().sort((x, y) => Math.max(x.a, x.b) - Math.max(y.a, y.b));
  const easy = shuffle(sorted.slice(0, Math.ceil(length / 2)), rng);
  const hard = shuffle(sorted.slice(Math.ceil(length / 2)), rng);
  return [...easy, ...hard];
}

export function makeOptions(answer: number, max: number, rng?: Rng): number[] {
  const deltas = max > 20 ? [1, -1, 2, -2, 10, -10, 5, -5] : [1, -1, 2, -2, 3, -3];
  const opts = new Set<number>([answer]);
  for (const d of shuffle(deltas, rng)) {
    const v = answer + d;
    if (v >= 0 && v <= max) opts.add(v);
    if (opts.size === 4) break;
  }
  let fill = 0;
  while (opts.size < 4) opts.add(fill++);
  return shuffle([...opts], rng);
}
