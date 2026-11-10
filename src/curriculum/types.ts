import type { PicId } from '../components/pictures';
import type { Rng } from '../lib/random';

/**
 * Innehållsmodell. Allt är märkt med ämne, årskurs och område i Lgr22,
 * så att det går att flytta om när de nya kursplanerna (planerade från ht 2028)
 * kommer – utan att själva övningarna behöver skrivas om.
 */
export type SubjectId = 'matematik' | 'svenska' | 'engelska' | 'so' | 'no';

/** 0 = förskoleklass (F), 1–6 = årskurs. */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const GRADES: Grade[] = [0, 1, 2, 3, 4, 5, 6];
export const gradeLabel = (g: Grade) => (g === 0 ? 'F' : String(g));
export const gradeLong = (g: Grade) => (g === 0 ? 'Förskoleklass' : `Årskurs ${g}`);
export const gradeRange = ([a, b]: [Grade, Grade]) => (a === b ? gradeLabel(a) : `${gradeLabel(a)}–${gradeLabel(b)}`);

/** Bilder och figurer som kan visas i en fråga eller ett svarsalternativ. */
export type Visual =
  | { t: 'pic'; id: PicId }
  | { t: 'count'; id: PicId; n: number }
  | { t: 'dots'; n: number }
  | { t: 'clock'; h: number; m: number }
  | { t: 'fraction'; num: number; den: number }
  | { t: 'shape'; name: ShapeName }
  | { t: 'base10'; tens: number; ones: number }
  | { t: 'thermo'; value: number }
  | { t: 'rect'; w: number; h: number }
  | { t: 'angle'; deg: number }
  | { t: 'coord'; x: number; y: number }
  | { t: 'marbles'; colors: { color: string; n: number }[] };

export type ShapeName = 'cirkel' | 'kvadrat' | 'rektangel' | 'triangel' | 'klot' | 'kub' | 'cylinder' | 'kon' | 'rätblock';

export interface ChoiceOption {
  label: string;
  visual?: Visual;
  /** Visa bara bilden (namnet används ändå för skärmläsare). */
  hideLabel?: boolean;
}

export interface ChoiceQuestion {
  kind: 'choice';
  prompt: string;
  /** Kort extra rad, t.ex. meningen som frågan gäller. */
  detail?: string;
  visual?: Visual;
  options: ChoiceOption[];
  answer: number;
  explain?: string;
  /** Kort form för papper, t.ex. bara det svenska ordet i ett glosförhör. */
  cue?: string;
  /** Läsförståelse: texten som frågan gäller. Flera frågor kan dela samma text. */
  passage?: Passage;
}

export interface Passage {
  id: string;
  title: string;
  /** Stycken skiljs åt med en tom rad. Rader som börjar med "– " är repliker. */
  text: string;
  genre: 'berättelse' | 'faktatext' | 'instruktion' | 'brev' | 'schema' | 'argumenterande text';
}

export interface OrderQuestion {
  kind: 'order';
  prompt: string;
  /** I rätt ordning. Visas blandade. */
  items: string[];
  /** Kort text under varje sak när den är placerad, t.ex. årtal. */
  notes?: string[];
  explain?: string;
}

export interface SpellQuestion {
  kind: 'spell';
  prompt: string;
  detail?: string;
  visual?: Visual;
  answer: string;
  /** Extra bokstäver som inte ingår. */
  extra: number;
}

export type Question = ChoiceQuestion | OrderQuestion | SpellQuestion;

export interface LevelOption {
  value: string;
  label: string;
  hint?: string;
}

export interface ActivityContext {
  /** Lärarens egna glosor, när aktiviteten är glosor. */
  wordList?: WordList;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  subject: SubjectId;
  grades: [Grade, Grade];
  /** Område i Lgr22:s centrala innehåll. */
  area: string;
  levels?: LevelOption[];
  defaultLevel?: string;
  /** Skapar frågorna. Antalet bestäms av den som startar. */
  generate: (level: string | undefined, count: number, rng?: Rng, ctx?: ActivityContext) => Question[];
  /** Läs frågan högt för den som inte läser ännu. */
  readAloud?: boolean;
  /** Kräver en ordlista (glosor). */
  needsWordList?: boolean;
  /** Aktiviteten spelas i ett av Leklandets fristående spel i stället för i den gemensamma spelaren. */
  game?: string;
}

export interface WordPair {
  sv: string;
  en: string;
}

export interface WordList {
  id: string;
  title: string;
  pairs: WordPair[];
  grades?: [Grade, Grade];
}

export interface Subject {
  id: SubjectId;
  name: string;
  short: string;
  color: string;
  soft: string;
  areas: string[];
}

export const SUBJECTS: Subject[] = [
  {
    id: 'matematik',
    name: 'Matematik',
    short: 'Matte',
    color: '#5BC0EB',
    soft: '#D8F0FB',
    areas: [
      'Taluppfattning och tals användning',
      'Algebra',
      'Geometri',
      'Sannolikhet och statistik',
      'Samband och förändring',
      'Problemlösning',
    ],
  },
  {
    id: 'svenska',
    name: 'Svenska',
    short: 'Svenska',
    color: '#FF8A5B',
    soft: '#FFE3D6',
    areas: ['Läsa och skriva', 'Berättande texter och faktatexter', 'Språkbruk'],
  },
  {
    id: 'engelska',
    name: 'Engelska – glosor',
    short: 'Engelska',
    color: '#A78BFA',
    soft: '#ECE5FF',
    areas: ['Ord och fraser', 'Kommunikationens innehåll'],
  },
  {
    id: 'so',
    name: 'SO – historia, geografi och samhälle',
    short: 'SO',
    color: '#FFC53D',
    soft: '#FFF1C9',
    areas: [
      'Att leva i närområdet (åk 1–3)',
      'Att leva i världen (åk 1–3)',
      'Att undersöka verkligheten (åk 1–3)',
      'Historia: Norden ca 800–1500',
      'Historia: Norden ca 1500–1800',
      'Historia: ca 1800–1900',
      'Geografi',
      'Samhällskunskap',
    ],
  },
  {
    id: 'no',
    name: 'NO – biologi, fysik och kemi',
    short: 'NO',
    color: '#2EC4B6',
    soft: '#D4F4F0',
    areas: [
      'Året runt i naturen (åk 1–3)',
      'Kropp och hälsa (åk 1–3)',
      'Kraft och rörelse (åk 1–3)',
      'Material och ämnen (åk 1–3)',
      'Biologi (åk 4–6)',
      'Fysik (åk 4–6)',
      'Kemi (åk 4–6)',
    ],
  },
];

export const subjectOf = (id: SubjectId) => SUBJECTS.find((s) => s.id === id)!;
