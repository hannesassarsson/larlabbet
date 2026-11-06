import { getActivity, activitiesFor } from '../curriculum';
import { parseWordList } from '../curriculum/engelska';
import type { Activity, ChoiceQuestion, Grade, Question, SubjectId } from '../curriculum/types';
import { sample, seeded, shuffle } from '../lib/random';

/**
 * Arbetsblad: gör om kursplaneövningar till papper.
 * Allt styrs av en inställning + ett bladnummer (seed), så samma blad kan
 * skrivas ut igen och facit alltid stämmer.
 */
export type AnswerMode = 'auto' | 'choose' | 'write';

export interface SheetSection {
  activityId: string;
  level?: string;
  count: number;
}

export interface SheetConfig {
  title: string;
  sections: SheetSection[];
  mode: AnswerMode;
  facit: boolean;
  nameLine: boolean;
  big: boolean;
  /** Antal varianter, A–D. Olika frågor på varje, så att grannen inte kan titta. */
  variants: number;
  seed: number;
  /** Lärarens egna glosor, en per rad: "svenska – engelska". */
  words: string;
  grade: Grade;
}

export const DEFAULT_CONFIG: SheetConfig = {
  title: '',
  sections: [],
  mode: 'auto',
  facit: true,
  nameLine: true,
  big: false,
  variants: 1,
  seed: 1,
  words: '',
  grade: 2,
};

export type PrintLayout = 'compact' | 'list' | 'glosor' | 'pictures';

export interface PrintItem {
  q: Question;
  /** Hur frågan ska besvaras på papper. */
  answer: 'choose' | 'write' | 'order' | 'spell';
  /** Bokstäver att välja bland vid stavning. */
  letters?: string[];
  /** Ordningsfrågor: sakerna i den blandade ordning de står på papperet. */
  shuffled?: string[];
}

export interface PrintSection {
  activity: Activity;
  heading: string;
  instruction: string;
  layout: PrintLayout;
  items: PrintItem[];
  /** Felmeddelande om avsnittet inte kunde skapas (t.ex. glosor saknas). */
  problem?: string;
}

export interface PrintSheet {
  variant: string; // "A", "B" …
  number: string; // bladnummer som visas, t.ex. "4821-A"
  sections: PrintSection[];
}

export const VARIANT_NAMES = ['A', 'B', 'C', 'D'];

/** Korta numeriska och enkla svar går att skriva. Långa meningar och bilder ringas in. */
const WRITABLE = /^[−\-]?[\d\s,./()]+( ?(°C|cm²|cm|kr|%|m|g|kg|l|dl))?$/;
function canWrite(q: ChoiceQuestion) {
  if (q.options.some((o) => o.hideLabel)) return false;
  return q.options.every((o) => o.label.length <= 24);
}
function prefersWrite(a: Activity, q: ChoiceQuestion) {
  if (a.subject === 'engelska') return true;
  return q.options.every((o) => WRITABLE.test(o.label));
}

function letterBank(answer: string, extra: number, seed: number) {
  const rng = seeded(seed);
  const letters = answer.toLocaleUpperCase('sv').split('');
  const pool = 'ABDEFGHIJKLMNOPRSTUVY'.split('').filter((l) => !letters.includes(l));
  return shuffle([...letters, ...sample(pool, extra, rng)], rng);
}

function instructionFor(layout: PrintLayout, items: PrintItem[], a: Activity, level?: string): string {
  const kinds = new Set(items.map((i) => i.answer));
  if (layout === 'glosor') return level === 'en-sv' ? 'Skriv vad orden betyder på svenska.' : 'Skriv orden på engelska.';
  if (kinds.size === 1) {
    const k = [...kinds][0];
    if (k === 'order') return 'Skriv 1, 2, 3 och 4 i rutorna så att det blir rätt ordning.';
    if (k === 'spell') return 'Skriv ordet i rutorna. Bokstäverna du behöver står under.';
    if (k === 'write') return a.subject === 'matematik' ? 'Räkna och skriv svaret.' : 'Skriv svaret på linjen.';
    if (layout === 'pictures') return 'Ringa in rätt bild.';
    return 'Ringa in rätt svar.';
  }
  return 'Ringa in eller skriv rätt svar.';
}

/** Bygger ett blad. `variant` 0 = A, 1 = B … */
export function buildSheet(config: SheetConfig, variant = 0): PrintSheet {
  const wordList = config.words.trim() ? { id: 'egna', title: 'Egna glosor', pairs: parseWordList(config.words) } : undefined;
  const sections: PrintSection[] = config.sections.map((sec, si) => {
    const a = getActivity(sec.activityId);
    if (!a) {
      return { activity: activitiesFor('alla', 'alla')[0], heading: 'Okänd övning', instruction: '', layout: 'list', items: [], problem: 'Övningen finns inte längre.' };
    }
    const seed = config.seed * 7919 + si * 104729 + variant * 15485863;
    if (a.needsWordList && (!wordList || wordList.pairs.length < 2)) {
      return { activity: a, heading: a.title, instruction: '', layout: 'list', items: [], problem: 'Skriv in minst två glosor under ”Egna glosor” för att få med det här avsnittet.' };
    }
    const qs = a.generate(sec.level ?? a.defaultLevel, sec.count, seeded(seed), { wordList });
    if (qs.length === 0) {
      return { activity: a, heading: a.title, instruction: '', layout: 'list', items: [], problem: 'Den här övningen finns bara på skärmen.' };
    }
    const items: PrintItem[] = qs.map((q, qi) => {
      if (q.kind === 'order') {
        const rng = seeded(seed + 31 * qi);
        let shuffled = shuffle(q.items, rng);
        for (let k = 0; k < 4 && shuffled.join() === q.items.join(); k++) shuffled = shuffle(q.items, rng);
        return { q, answer: 'order', shuffled };
      }
      if (q.kind === 'spell') return { q, answer: 'spell', letters: letterBank(q.answer, Math.max(1, q.extra), seed + qi) };
      const write = config.mode === 'write' ? canWrite(q) : config.mode === 'auto' ? canWrite(q) && prefersWrite(a, q) : false;
      return { q, answer: write ? 'write' : 'choose' };
    });

    let layout: PrintLayout = 'list';
    const choice = items.every((i) => i.q.kind === 'choice');
    if (choice && items.every((i) => i.answer === 'write' && (i.q as ChoiceQuestion).cue)) layout = 'glosor';
    else if (choice && items.every((i) => i.answer === 'write' && !('visual' in i.q && i.q.visual) && !('detail' in i.q && i.q.detail) && i.q.prompt.length <= 26)) layout = 'compact';
    else if (choice && items.every((i) => i.answer === 'choose' && (i.q as ChoiceQuestion).options.every((o) => o.hideLabel))) layout = 'pictures';

    return { activity: a, heading: a.title, instruction: instructionFor(layout, items, a, sec.level ?? a.defaultLevel), layout, items };
  });
  const v = VARIANT_NAMES[variant] ?? String(variant + 1);
  return { variant: v, number: `${config.seed}${config.variants > 1 ? '-' + v : ''}`, sections };
}

/** Facit som korta rader per avsnitt. */
export function facitFor(sheet: PrintSheet): { heading: string; answers: string[] }[] {
  return sheet.sections
    .filter((s) => !s.problem)
    .map((s) => ({
      heading: s.heading,
      answers: s.items.map((it) => {
        const q = it.q;
        if (q.kind === 'order') return q.items.join(' → ');
        if (q.kind === 'spell') return q.answer;
        const right = q.options[q.answer];
        if (it.answer === 'choose') return `${'ABCDEF'[q.answer]}${right.label ? ` (${right.label})` : ''}`;
        return right.label;
      }),
    }));
}

/** Skriver om en räknefråga för papper: "3 + 2 = ?" blir "3 + 2 =" följt av en linje. */
export function promptParts(prompt: string): { before: string; after: string; blank: boolean } {
  const qm = prompt.match(/^(.*?)\s*\?\s*$/);
  if (prompt.includes('__')) {
    const [before, ...rest] = prompt.split('__');
    return { before, after: rest.join('__'), blank: true };
  }
  if (qm && /=\s*$/.test(qm[1])) return { before: qm[1], after: '', blank: true };
  return { before: prompt, after: '', blank: false };
}

/** Förslag: tre övningar i ämnet som passar årskursen. */
export function suggestSections(subject: SubjectId | 'alla', grade: Grade, seed: number): SheetSection[] {
  const pool = activitiesFor(subject, grade).filter((a) => !a.needsWordList && a.id !== 'ma-monster');
  const rng = seeded(seed);
  const picked = sample(pool, Math.min(3, pool.length), rng);
  return picked.map((a) => ({
    activityId: a.id,
    // Välj nivå efter var i årskursspannet klassen är.
    level: a.levels ? a.levels[Math.min(a.levels.length - 1, Math.max(0, Math.round(((grade - a.grades[0]) / Math.max(1, a.grades[1] - a.grades[0])) * (a.levels.length - 1))))].value : undefined,
    count: grade <= 1 ? 6 : 8,
  }));
}

export function autoTitle(config: SheetConfig) {
  if (config.title.trim()) return config.title.trim();
  const names = config.sections.map((s) => getActivity(s.activityId)?.title).filter(Boolean) as string[];
  if (names.length === 0) return 'Arbetsblad';
  if (names.length <= 2) return names.join(' och ');
  return `${names.slice(0, 2).join(', ')} med mera`;
}

/** Aktiviteter som går att skriva ut. */
export function printableActivities(subject: SubjectId | 'alla', grade: Grade | 'alla') {
  return activitiesFor(subject, grade).filter((a) => a.id !== 'ma-monster');
}

export function newSeed() {
  return 1000 + Math.floor(Math.random() * 9000);
}
