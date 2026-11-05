import { shuffle, type Rng } from '../lib/random';
import type { ChoiceOption, ChoiceQuestion, Question, Visual } from './types';

/** Bygger en flervalsfråga och blandar alternativen. Dubbletter tas bort. */
export function mc(
  prompt: string,
  correct: string | ChoiceOption,
  wrong: (string | ChoiceOption)[],
  rng?: Rng,
  extra: { visual?: Visual; detail?: string; explain?: string; max?: number } = {}
): ChoiceQuestion {
  const norm = (o: string | ChoiceOption): ChoiceOption => (typeof o === 'string' ? { label: o } : o);
  const right = norm(correct);
  const seen = new Set([right.label]);
  const others: ChoiceOption[] = [];
  for (const w of wrong.map(norm)) {
    if (seen.has(w.label)) continue;
    seen.add(w.label);
    others.push(w);
  }
  const opts = shuffle([right, ...shuffle(others, rng).slice(0, (extra.max ?? 4) - 1)], rng);
  return {
    kind: 'choice',
    prompt,
    detail: extra.detail,
    visual: extra.visual,
    explain: extra.explain,
    options: opts,
    answer: opts.indexOf(right),
  };
}

/**
 * Tar fram `count` frågor ur en generator och undviker dubbletter
 * (samma fråga och detalj) så långt det går.
 */
export function unique(count: number, make: (i: number) => Question): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  for (let i = 0, guard = 0; out.length < count && guard < count * 40; guard++) {
    const q = make(i);
    const key = q.prompt + '|' + ('detail' in q ? q.detail ?? '' : '') + '|' + JSON.stringify('visual' in q ? q.visual ?? '' : '') + (q.kind === 'order' ? q.items.join() : '');
    if (seen.has(key) && guard < count * 30) continue;
    seen.add(key);
    out.push(q);
    i++;
  }
  return out;
}

/** Plockar `count` frågor ur en färdig bank, blandade, och upprepar bara om banken tar slut. */
export function fromBank<T>(bank: T[], count: number, rng: Rng | undefined, toQ: (item: T) => Question): Question[] {
  const out: Question[] = [];
  while (out.length < count) {
    for (const item of shuffle(bank, rng)) {
      if (out.length >= count) break;
      out.push(toQ(item));
    }
  }
  return out;
}

export const cap = (s: string) => s.charAt(0).toLocaleUpperCase('sv') + s.slice(1);
