import { PICTURES, type PicId } from '../../components/pictures';
import { pick, randInt, sample, shuffle, type Rng } from '../../lib/random';

/**
 * Mönsterdetektiven: alla uppgifter genereras av algoritmer.
 * Ett mönster beskrivs av en struktur (t.ex. "AAB") och en uppsättning element.
 */
export type ShapeName = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'diamond' | 'arrow';
export const SHAPES: ShapeName[] = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond']; // pilen används bara för vridning
export const COLORS = ['#F25F8C', '#FFC53D', '#5BC0EB', '#7BD389', '#A78BFA', '#FF8A5B'];
export const COLOR_NAMES: Record<string, string> = {
  '#F25F8C': 'rosa',
  '#FFC53D': 'gul',
  '#5BC0EB': 'blå',
  '#7BD389': 'grön',
  '#A78BFA': 'lila',
  '#FF8A5B': 'orange',
};
export const SHAPE_NAMES: Record<ShapeName, string> = {
  circle: 'cirkel',
  square: 'fyrkant',
  triangle: 'triangel',
  star: 'stjärna',
  heart: 'hjärta',
  diamond: 'romb',
  arrow: 'pil',
};
const PATTERN_PICS: PicId[] = ['katt', 'hund', 'fisk', 'sol', 'äpple', 'boll', 'uggla', 'gris', 'blomma', 'bil'];

export type Token =
  | { t: 'shape'; shape: ShapeName; color: string; size?: 1 | 2 | 3; rot?: number }
  | { t: 'pic'; pic: PicId }
  | { t: 'num'; n: number }
  | { t: 'dots'; n: number };

export const tokenKey = (k: Token): string =>
  k.t === 'shape' ? `s:${k.shape}:${k.color}:${k.size ?? 2}:${k.rot ?? 0}` : k.t === 'pic' ? `p:${k.pic}` : `${k.t}:${k.n}`;

export interface PatternTask {
  kind: string; // för återkoppling
  sequence: Token[];
  answer: Token;
  options: Token[];
  explain: string;
}

export type PatternLevel = 'latt' | 'mellan' | 'svar';
export const PATTERN_LEVELS: { value: PatternLevel; label: string; hint: string }[] = [
  { value: 'latt', label: 'Lätt', hint: 'Färger och former' },
  { value: 'mellan', label: 'Mellan', hint: 'Längre mönster' },
  { value: 'svar', label: 'Svår', hint: 'Tal och rörelse' },
];

/* ---------- Upprepande mönster ---------- */

function fromStructure(structure: string, elements: Token[], rng: Rng | undefined, shown?: number) {
  const letters = [...new Set(structure.split(''))];
  const map = new Map(letters.map((l, i) => [l, elements[i]]));
  const unit = structure.split('').map((l) => map.get(l)!);
  const len = shown ?? Math.min(8, unit.length * 2 + randInt(0, unit.length - 1, rng));
  const full = Array.from({ length: len + 1 }, (_, i) => unit[i % unit.length]);
  return { sequence: full.slice(0, len), answer: full[len], unitTokens: [...new Set(unit)] };
}

type Theme = 'color' | 'shape' | 'combo' | 'pic';

function elementsFor(theme: Theme, n: number, rng?: Rng): Token[] {
  if (theme === 'color') {
    const shape = pick(SHAPES, rng);
    return sample(COLORS, n, rng).map((color) => ({ t: 'shape', shape, color }));
  }
  if (theme === 'shape') {
    const color = pick(COLORS, rng);
    return sample(SHAPES, n, rng).map((shape) => ({ t: 'shape', shape, color }));
  }
  if (theme === 'combo') {
    const shapes = sample(SHAPES, n, rng);
    const colors = sample(COLORS, n, rng);
    return shapes.map((shape, i) => ({ t: 'shape', shape, color: colors[i] }));
  }
  return sample(PATTERN_PICS, n, rng).map((pic) => ({ t: 'pic', pic }));
}

/** Störalternativ i samma stil som mönstret. */
function distractorsFor(theme: Theme, base: Token[], rng?: Rng): Token[] {
  const extra = elementsFor(theme, 4, rng);
  if (theme === 'color' && base[0].t === 'shape') {
    const shape = base[0].shape;
    return COLORS.map((color) => ({ t: 'shape', shape, color }) as Token);
  }
  if (theme === 'shape' && base[0].t === 'shape') {
    const color = base[0].color;
    return SHAPES.map((shape) => ({ t: 'shape', shape, color }) as Token);
  }
  return [...base, ...extra];
}

function repeating(structure: string, theme: Theme, rng?: Rng): Omit<PatternTask, 'options'> & { pool: Token[] } {
  const n = new Set(structure).size;
  const elements = elementsFor(theme, n, rng);
  const { sequence, answer, unitTokens } = fromStructure(structure, elements, rng);
  return {
    kind: structure,
    sequence,
    answer,
    pool: [...unitTokens, ...distractorsFor(theme, elements, rng)],
    explain: `Mönstret ${structure.split('').join(' ')} upprepas om och om igen.`,
  };
}

/* ---------- Växande och rörliga mönster ---------- */

function numberStep(rng?: Rng) {
  const step = pick([1, 2, 2, 3, 5, 10, -1, -2], rng);
  const len = 5;
  const start = step > 0 ? randInt(0, step === 10 ? 30 : 10, rng) : randInt(len * -step + 2, 20, rng);
  const seq = Array.from({ length: len + 1 }, (_, i) => start + step * i);
  const answer = seq[len];
  const pool = [answer + step, answer - step, answer + 1, answer - 1, answer + 2]
    .filter((x) => x >= 0 && x !== answer)
    .map((n) => ({ t: 'num', n }) as Token);
  return {
    kind: 'tal',
    sequence: seq.slice(0, len).map((n) => ({ t: 'num', n }) as Token),
    answer: { t: 'num', n: answer } as Token,
    pool,
    explain: step > 0 ? `Talen blir ${step} större varje gång.` : `Talen blir ${-step} mindre varje gång.`,
  };
}

function dotsGrow(rng?: Rng) {
  const step = pick([1, 1, 2], rng);
  const start = randInt(1, 2, rng);
  const len = 4;
  const seq = Array.from({ length: len + 1 }, (_, i) => start + step * i);
  const answer = seq[len];
  return {
    kind: 'prickar',
    sequence: seq.slice(0, len).map((n) => ({ t: 'dots', n }) as Token),
    answer: { t: 'dots', n: answer } as Token,
    pool: [answer - 1, answer + 1, answer + 2, answer - step - 1].filter((n) => n > 0 && n !== answer).map((n) => ({ t: 'dots', n }) as Token),
    explain: step === 1 ? 'Det kommer en prick till varje gång.' : 'Det kommer två prickar till varje gång.',
  };
}

function rotation(rng?: Rng) {
  const color = pick(COLORS, rng);
  const step = pick([90, 45, -90], rng);
  const start = pick([0, 90, 180], rng);
  const len = 5;
  const norm = (d: number) => ((d % 360) + 360) % 360;
  const seq = Array.from({ length: len + 1 }, (_, i) => ({ t: 'shape', shape: 'arrow', color, rot: norm(start + step * i) }) as Token);
  const answer = seq[len];
  const rotOf = (k: Token) => (k.t === 'shape' ? (k.rot ?? 0) : 0);
  const pool = [45, 90, 135, 180, 225, 270, 315, 0]
    .map((d) => norm(rotOf(answer) + d))
    .map((rot) => ({ t: 'shape', shape: 'arrow', color, rot }) as Token);
  return {
    kind: 'vridning',
    sequence: seq.slice(0, len),
    answer,
    pool,
    explain: step > 0 ? 'Pilen vrider sig lika mycket åt höger varje gång.' : 'Pilen vrider sig lika mycket åt vänster varje gång.',
  };
}

function sizes(rng?: Rng) {
  const color = pick(COLORS, rng);
  const shape = pick(SHAPES, rng);
  const structure = pick(['123', '321', '1232'], rng);
  const unit = structure.split('').map((d) => ({ t: 'shape', shape, color, size: Number(d) as 1 | 2 | 3 }) as Token);
  const len = Math.min(8, unit.length * 2 + randInt(0, 1, rng));
  const full = Array.from({ length: len + 1 }, (_, i) => unit[i % unit.length]);
  return {
    kind: 'storlek',
    sequence: full.slice(0, len),
    answer: full[len],
    pool: [
      ...[1, 2, 3].map((size) => ({ t: 'shape', shape, color, size }) as Token),
      // samma storlek men fel färg, så att det alltid finns fyra alternativ
      ...sample(COLORS.filter((c) => c !== color), 2, rng).map(
        (c) => ({ t: 'shape', shape, color: c, size: (full[len] as { size?: 1 | 2 | 3 }).size }) as Token
      ),
    ],
    explain: 'Titta på storleken: liten, mellan, stor … i samma ordning.',
  };
}

/* ---------- Omgång ---------- */

type Gen = (rng?: Rng) => Omit<PatternTask, 'options'> & { pool: Token[] };

const GENERATORS: Record<PatternLevel, Gen[]> = {
  latt: [
    (r) => repeating('AB', 'color', r),
    (r) => repeating('AB', 'shape', r),
    (r) => repeating('AB', 'pic', r),
    (r) => repeating('ABB', 'color', r),
    (r) => repeating('AAB', 'pic', r),
  ],
  mellan: [
    (r) => repeating('ABC', 'color', r),
    (r) => repeating('AAB', 'combo', r),
    (r) => repeating('ABB', 'shape', r),
    (r) => repeating('ABC', 'pic', r),
    (r) => repeating('AABB', 'color', r),
    sizes,
  ],
  svar: [
    (r) => repeating('ABCD', 'combo', r),
    (r) => repeating('ABAC', 'pic', r),
    (r) => repeating('AABC', 'combo', r),
    numberStep,
    numberStep,
    dotsGrow,
    rotation,
    sizes,
  ],
};

export const PATTERN_ROUND = 10;

export function buildPatternRound(level: PatternLevel, rng?: Rng, length = PATTERN_ROUND): PatternTask[] {
  const gens = GENERATORS[level];
  const order: Gen[] = [];
  while (order.length < length) order.push(...shuffle(gens, rng));
  const optionCount = level === 'latt' ? 3 : 4;
  return order.slice(0, length).map((gen) => {
    const { pool, ...task } = gen(rng);
    const answerKey = tokenKey(task.answer);
    const seen = new Set([answerKey]);
    const distractors: Token[] = [];
    for (const t of shuffle(pool, rng)) {
      const k = tokenKey(t);
      if (seen.has(k)) continue;
      seen.add(k);
      distractors.push(t);
      if (distractors.length === optionCount - 1) break;
    }
    return { ...task, options: shuffle([task.answer, ...distractors], rng) };
  });
}

const NEUTER: Record<string, string> = { grön: 'grönt', gul: 'gult', blå: 'blått', liten: 'litet', stor: 'stort' };

/** Beskrivning på svenska, t.ex. "liten blå cirkel" eller "grönt hjärta". */
export function describeToken(k: Token): string {
  if (k.t === 'shape') {
    const ett = k.shape === 'heart';
    const adj = (w: string) => (ett ? NEUTER[w] ?? w : w);
    const size = k.size === 1 ? adj('liten') + ' ' : k.size === 3 ? adj('stor') + ' ' : '';
    return `${size}${adj(COLOR_NAMES[k.color] ?? '')} ${SHAPE_NAMES[k.shape]}`.trim();
  }
  if (k.t === 'pic') return PICTURES[k.pic].word;
  if (k.t === 'num') return String(k.n);
  return k.n === 1 ? '1 prick' : `${k.n} prickar`;
}
