import type { PicId } from '../../components/pictures';
import { sample, shuffle, type Rng } from '../../lib/random';

export const MEMORY_PICS: PicId[] = [
  'katt', 'hund', 'fisk', 'uggla', 'gris', 'lejon', 'räv', 'elefant', 'sol', 'äpple',
  'jordgubbe', 'glass', 'bil', 'båt', 'apa', 'mus', 'ko', 'val', 'blomma', 'paraply',
];

export const MEMORY_SIZES = [
  { pairs: 4, label: 'Liten', hint: '8 kort' },
  { pairs: 6, label: 'Mellan', hint: '12 kort' },
  { pairs: 8, label: 'Stor', hint: '16 kort' },
  { pairs: 10, label: 'Jättestor', hint: '20 kort' },
] as const;

export interface MemoryCard {
  key: number;
  pic: PicId;
  matched: boolean;
}

export function createDeck(pairs: number, rng?: Rng): MemoryCard[] {
  const pics = sample(MEMORY_PICS, pairs, rng);
  return shuffle(
    pics.flatMap((pic) => [pic, pic]),
    rng
  ).map((pic, key) => ({ key, pic, matched: false }));
}

export type FlipResult =
  | { kind: 'ignored' }
  | { kind: 'first'; flipped: number[] }
  | { kind: 'match'; flipped: number[] }
  | { kind: 'miss'; flipped: number[] };

/** Ren regel för vad som händer när ett kort trycks. */
export function flipCard(cards: MemoryCard[], flipped: number[], index: number): FlipResult {
  const card = cards[index];
  if (!card || card.matched || flipped.includes(index) || flipped.length >= 2) return { kind: 'ignored' };
  if (flipped.length === 0) return { kind: 'first', flipped: [index] };
  const pair = [flipped[0], index];
  return cards[flipped[0]].pic === card.pic ? { kind: 'match', flipped: pair } : { kind: 'miss', flipped: pair };
}

export function memoryStars(moves: number, pairs: number) {
  if (moves <= Math.ceil(pairs * 1.5)) return 3;
  if (moves <= Math.ceil(pairs * 2.3)) return 2;
  return 1;
}

export function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
