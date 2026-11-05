import { PIC_IDS, PICTURES, type PicId } from '../../components/pictures';
import { pick, shuffle, type Rng } from '../../lib/random';

export type Level = 'latt' | 'mellan' | 'svar';

export const LEVELS: { value: Level; label: string; hint: string; options: number; letters: 'upper' | 'both' | 'lower' }[] = [
  { value: 'latt', label: 'Lätt', hint: '3 bilder, STORA bokstäver', options: 3, letters: 'upper' },
  { value: 'mellan', label: 'Mellan', hint: '4 bilder, Stora och små', options: 4, letters: 'both' },
  { value: 'svar', label: 'Svår', hint: '6 bilder, små bokstäver', options: 6, letters: 'lower' },
];

/** Bokstäver som är lätta att höra i början av ordet – används på nivån Lätt. */
const EASY_LETTERS = ['S', 'B', 'M', 'F', 'K', 'L', 'H', 'T', 'R', 'O', 'A'];

export const firstLetter = (id: PicId) => PICTURES[id].word[0].toLocaleUpperCase('sv');

export interface LetterQuestion {
  letter: string;
  answer: PicId;
  options: PicId[];
}

export const ROUND_LENGTH = 10;

export function buildRound(level: Level, rng?: Rng, length = ROUND_LENGTH): LetterQuestion[] {
  const conf = LEVELS.find((l) => l.value === level)!;
  const byLetter = new Map<string, PicId[]>();
  for (const id of PIC_IDS) {
    const l = firstLetter(id);
    byLetter.set(l, [...(byLetter.get(l) ?? []), id]);
  }
  let letters = [...byLetter.keys()];
  if (level === 'latt') letters = letters.filter((l) => EASY_LETTERS.includes(l));
  // Varje bokstav högst en gång per omgång (om det finns tillräckligt många).
  const order = shuffle(letters, rng);
  while (order.length < length) order.push(...shuffle(letters, rng));

  return order.slice(0, length).map((letter) => {
    const answer = pick(byLetter.get(letter)!, rng);
    const distractorPool = PIC_IDS.filter((id) => firstLetter(id) !== letter);
    // Välj störbilder med olika begynnelsebokstäver så att det bara finns ett rätt svar.
    const used = new Set<string>();
    const distractors: PicId[] = [];
    for (const id of shuffle(distractorPool, rng)) {
      const l = firstLetter(id);
      if (used.has(l)) continue;
      used.add(l);
      distractors.push(id);
      if (distractors.length === conf.options - 1) break;
    }
    return { letter, answer, options: shuffle([answer, ...distractors], rng) };
  });
}

export function displayLetter(letter: string, level: Level) {
  const conf = LEVELS.find((l) => l.value === level)!;
  const lower = letter.toLocaleLowerCase('sv');
  if (conf.letters === 'upper') return letter;
  if (conf.letters === 'lower') return lower;
  return `${letter} ${lower}`;
}

