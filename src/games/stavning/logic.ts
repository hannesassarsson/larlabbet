import { PIC_IDS, PICTURES, type PicId } from '../../components/pictures';
import { sample, shuffle, type Rng } from '../../lib/random';

export type SpellLevel = 'stege' | 'latt' | 'mellan' | 'svar';

export const SPELL_LEVELS: { value: SpellLevel; label: string; hint: string }[] = [
  { value: 'stege', label: 'Steg för steg', hint: 'Börjar lätt, blir svårare' },
  { value: 'latt', label: 'Lätt', hint: 'Korta ord' },
  { value: 'mellan', label: 'Mellan', hint: '4–5 bokstäver' },
  { value: 'svar', label: 'Svår', hint: 'Långa ord' },
];

const ALPHABET = 'ABDEFGHIJKLMNOPRSTUVYÅÄÖ'.split('');
export const ROUND_WORDS = 8;

type Tier = 1 | 2 | 3;
const tierOf = (word: string): Tier => (word.length <= 3 ? 1 : word.length <= 5 ? 2 : 3);

export interface Tile {
  id: number;
  ch: string;
}

export interface SpellTask {
  pic: PicId;
  word: string; // VERSALER
  tiles: Tile[];
}

function makeTask(pic: PicId, extra: number, rng?: Rng): SpellTask {
  const word = PICTURES[pic].word.toLocaleUpperCase('sv');
  const letters = word.split('');
  const pool = ALPHABET.filter((l) => !letters.includes(l));
  const all = [...letters, ...sample(pool, extra, rng)];
  let order = shuffle(all, rng);
  // Undvik att bokstäverna råkar ligga i rätt ordning från början.
  for (let i = 0; i < 5 && order.slice(0, letters.length).join('') === word && word.length > 1; i++) {
    order = shuffle(all, rng);
  }
  return { pic, word, tiles: order.map((ch, id) => ({ id, ch })) };
}

export function buildSpellRound(level: SpellLevel, rng?: Rng): SpellTask[] {
  // Ettbokstavsordet "ö" passar inte att bygga.
  const words = PIC_IDS.filter((id) => PICTURES[id].word.length >= 2);
  const byTier = (t: Tier) => shuffle(words.filter((id) => tierOf(PICTURES[id].word) === t), rng);
  let picks: { pic: PicId; tier: Tier }[];
  if (level === 'stege') {
    picks = [
      ...byTier(1).slice(0, 3).map((pic) => ({ pic, tier: 1 as Tier })),
      ...byTier(2).slice(0, 3).map((pic) => ({ pic, tier: 2 as Tier })),
      ...byTier(3).slice(0, 2).map((pic) => ({ pic, tier: 3 as Tier })),
    ];
  } else {
    const tier: Tier = level === 'latt' ? 1 : level === 'mellan' ? 2 : 3;
    picks = byTier(tier)
      .slice(0, ROUND_WORDS)
      .map((pic) => ({ pic, tier }));
  }
  // Kortare ord först inom omgången.
  picks.sort((a, b) => PICTURES[a.pic].word.length - PICTURES[b.pic].word.length);
  return picks.map(({ pic, tier }) => makeTask(pic, tier - 1, rng));
}

/** Nästa ruta som är tom eller fel, och vilken bricka som hör hemma där. */
export function nextHint(task: SpellTask, placed: (number | null)[]): { slot: number; tileId: number } | null {
  const correctAt = (slot: number) => placed[slot] !== null && task.tiles[placed[slot]!].ch === task.word[slot];
  const locked = new Set(placed.filter((id, slot) => id !== null && correctAt(slot)) as number[]);
  for (let slot = 0; slot < task.word.length; slot++) {
    if (correctAt(slot)) continue;
    const tile = task.tiles.find((t) => t.ch === task.word[slot] && !locked.has(t.id));
    return tile ? { slot, tileId: tile.id } : null;
  }
  return null;
}

/** Lägger brickan i rutan (flyttar den om den redan ligger någon annanstans). */
export function applyHint(placed: (number | null)[], hint: { slot: number; tileId: number }) {
  const next = placed.map((id) => (id === hint.tileId ? null : id));
  next[hint.slot] = hint.tileId;
  return next;
}

export function isComplete(placed: (number | null)[]) {
  return placed.every((x) => x !== null);
}

export function isCorrect(task: SpellTask, placed: (number | null)[]) {
  return placed.map((id) => (id === null ? '' : task.tiles[id].ch)).join('') === task.word;
}
