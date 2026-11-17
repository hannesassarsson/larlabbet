import { ACTIVITIES, getActivity } from '../curriculum';
import { parseWordList } from '../curriculum/engelska';
import { SUBJECTS, type Activity, type ChoiceOption, type Grade, type SubjectId, type Visual } from '../curriculum/types';
import { seeded, shuffle, type Rng } from '../lib/random';
import { parseCustom } from './custom';

/**
 * Klassquiz: läraren visar frågorna på tavlan och eleverna svarar på sina
 * plattor. Allt här är rena funktioner – nätverket ligger i link.ts.
 */

export interface QuizQuestion {
  id: string;
  prompt: string;
  detail?: string;
  visual?: Visual;
  options: ChoiceOption[];
  answer: number;
  explain?: string;
  /** 'egen' = en fråga läraren har skrivit själv. */
  subject: SubjectId | 'egen';
  topic: string;
}

export interface QuizConfig {
  subject: SubjectId | 'alla';
  grade: Grade;
  /** Valda övningar. Tom lista = blanda alla övningar i ämnet. */
  activityIds: string[];
  count: number;
  seconds: number;
  /** Visa frågan och svaren på elevernas skärmar (inte bara på tavlan). */
  showOnDevice: boolean;
  /** Lärarens egna glosor, en per rad. Används av övningen "Egna glosor". */
  words: string;
  /** Lärarens egna frågor som text (se custom.ts). */
  custom: string;
  /** Bara egna frågor, inga från övningarna. */
  customOnly: boolean;
  seed: number;
}

export const DEFAULT_QUIZ: QuizConfig = { subject: 'alla', grade: 3, activityIds: [], count: 15, seconds: 20, showOnDevice: true, words: '', custom: '', customOnly: false, seed: 1 };
export const COUNTS = [10, 15, 20, 30, 40];
export const SECONDS = [10, 20, 30, 60];

/** Övningar som ger flervalsfrågor och därför passar i ett quiz. */
export function quizActivities(subject: SubjectId | 'alla', grade: Grade | 'alla'): Activity[] {
  return ACTIVITIES.filter(
    (a) =>
      (subject === 'alla' || a.subject === subject) &&
      (grade === 'alla' || (a.grades[0] <= grade && grade <= a.grades[1])) &&
      a.id !== 'ma-monster' &&
      choiceShare(a) > 0
  );
}

const shareCache = new Map<string, number>();
/** Hur stor del av övningens frågor som är flerval (ordna och stava passar inte i ett quiz). */
function choiceShare(a: Activity): number {
  if (a.needsWordList) return 1;
  let v = shareCache.get(a.id);
  if (v === undefined) {
    const qs = a.generate(a.defaultLevel ?? a.levels?.[0]?.value, 6, seeded(11));
    v = qs.length ? qs.filter((q) => q.kind === 'choice').length / qs.length : 0;
    shareCache.set(a.id, v);
  }
  return v;
}

/** Väljer nivå efter var i övningens årskursspann klassen är. */
export function levelFor(a: Activity, grade: Grade): string | undefined {
  if (!a.levels) return a.defaultLevel;
  const span = Math.max(1, a.grades[1] - a.grades[0]);
  const pos = Math.min(1, Math.max(0, (grade - a.grades[0]) / span));
  return a.levels[Math.round(pos * (a.levels.length - 1))].value;
}

const keyOf = (q: { prompt: string; detail?: string; visual?: Visual }) => `${q.prompt}|${q.detail ?? ''}|${q.visual ? JSON.stringify(q.visual) : ''}`;

/** Gör ett quiz: frågor från de valda övningarna, jämnt fördelade, utan dubbletter. */
export function buildQuiz(config: QuizConfig): QuizQuestion[] {
  const rng = seeded(config.seed * 2654435761);
  const wordList = config.words.trim() ? { id: 'egna', title: 'Egna glosor', pairs: parseWordList(config.words) } : undefined;
  let acts = config.activityIds.length
    ? config.activityIds.map((id) => getActivity(id)).filter((a): a is Activity => !!a)
    : quizActivities(config.subject, config.grade).filter((a) => !a.needsWordList);
  acts = acts.filter((a) => !a.needsWordList || (wordList && wordList.pairs.length >= 2));
  if (acts.length === 0) return [];

  // Ämnesblandning: lika många frågor per ämne, sedan jämnt mellan övningarna i ämnet.
  const bySubject = new Map<SubjectId, Activity[]>();
  for (const a of acts) bySubject.set(a.subject, [...(bySubject.get(a.subject) ?? []), a]);
  const order = shuffle([...bySubject.keys()], rng);
  const quota = new Map<Activity, number>();
  for (let i = 0, guard = 0; i < config.count && guard < 10000; guard++) {
    const subj = order[guard % order.length];
    const list = bySubject.get(subj)!;
    const a = list[Math.floor(guard / order.length) % list.length];
    quota.set(a, (quota.get(a) ?? 0) + 1);
    i++;
  }

  const seen = new Set<string>();
  const out: QuizQuestion[] = [];
  const pool: QuizQuestion[] = [];
  for (const [a, n] of shuffle([...quota.entries()], rng)) {
    // Först nivån som passar årskursen. Räcker inte den (t.ex. "stava", som inte är
    // flerval, eller få egna glosor) tas närmaste andra nivå.
    const preferred = levelFor(a, config.grade);
    const levels = a.levels ? [preferred, ...a.levels.map((l) => l.value).filter((v) => v !== preferred)] : [preferred];
    let taken = 0;
    for (const level of levels) {
      if (taken >= n) break;
      for (const q of a.generate(level, n * 3 + 4, rng, { wordList })) {
        if (q.kind !== 'choice') continue;
        const qq = toQuiz(q, a, rng, out.length + pool.length);
        if (!qq || seen.has(keyOf(qq))) continue;
        seen.add(keyOf(qq));
        if (taken < n) {
          out.push(qq);
          taken++;
        } else pool.push(qq);
      }
    }
  }
  // Fyll på om någon övning hade för få olika frågor.
  for (const q of shuffle(pool, rng)) {
    if (out.length >= config.count) break;
    out.push(q);
  }
  return interleave(shuffle(out, rng).slice(0, config.count));
}

function toQuiz(q: import('../curriculum/types').ChoiceQuestion, a: Activity, rng: Rng, n: number): QuizQuestion | null {
  if (q.options.length < 2) return null;
  // Högst fyra svar. Det rätta svaret följer alltid med.
  let options = q.options;
  let answer = q.answer;
  if (options.length > 4) {
    const right = options[answer];
    const others = shuffle(options.filter((_, i) => i !== answer), rng).slice(0, 3);
    options = shuffle([right, ...others], rng);
    answer = options.indexOf(right);
  }
  return {
    id: `${a.id}-${n}`,
    prompt: q.prompt,
    detail: q.detail,
    visual: q.visual,
    options,
    answer,
    explain: q.explain,
    subject: a.subject,
    topic: a.title,
  };
}

/**
 * Hela quizet: lärarens egna frågor först, i den ordning de är skrivna, sedan
 * frågor från övningarna upp till valt antal. "Bara egna" ger bara de egna.
 */
export function assembleQuiz(config: QuizConfig): QuizQuestion[] {
  const own = parseCustom(config.custom ?? '').questions;
  if (config.customOnly) return own;
  const rest = Math.max(0, config.count - own.length);
  return [...own, ...(rest ? buildQuiz({ ...config, count: rest }) : [])];
}

/** Undviker att samma övning kommer två gånger i rad när det går. */
function interleave(qs: QuizQuestion[]): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const rest = qs.slice();
  while (rest.length) {
    const prev = out[out.length - 1];
    const i = rest.findIndex((q) => !prev || q.topic !== prev.topic);
    out.push(rest.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}

export const subjectName = (s: SubjectId | 'egen') => (s === 'egen' ? 'Egen fråga' : SUBJECTS.find((x) => x.id === s)!.short);

/* ================= Poäng ================= */

/** Rätt svar ger 500–1000 poäng beroende på hur snabbt, plus 50 per rätt i rad (högst 250). */
export function pointsFor(correct: boolean, ms: number, limitMs: number, streak: number): number {
  if (!correct) return 0;
  const t = Math.min(1, Math.max(0, ms / limitMs));
  const base = Math.round(1000 - 500 * t);
  return base + Math.min(5, Math.max(0, streak - 1)) * 50;
}

/* ================= Spelets läge (hos läraren) ================= */

export type Phase = 'lobby' | 'ready' | 'question' | 'reveal' | 'scores' | 'end';

export interface PlayerAnswer {
  choice: number;
  ms: number;
  correct: boolean;
  gained: number;
}

export interface Player {
  id: string;
  name: string;
  /** Eleven var inloggad med sin elevkod i quizets klass. */
  studentId?: string;
  score: number;
  streak: number;
  answers: Record<number, PlayerAnswer>;
  removed?: boolean;
}

export interface Game {
  code: string;
  grade: Grade;
  title: string;
  questions: QuizQuestion[];
  limitMs: number;
  showOnDevice: boolean;
  phase: Phase;
  index: number;
  /** Ökar vid varje fasbyte, så att eleverna vet när något är nytt. */
  step: number;
  players: Record<string, Player>;
  /** Placeringar före senaste frågan, för att visa vem som klättrat. */
  prevRanks: Record<string, number>;
  /** Klassen som resultatet sparas på (läraren var inloggad). */
  classId?: string;
  className?: string;
  /** Resultatet är sparat på klassen. */
  saved?: boolean;
}

export function newGame(code: string, config: QuizConfig, questions: QuizQuestion[], title: string, cls?: { id: string; name: string }): Game {
  return {
    code,
    grade: config.grade,
    title,
    questions,
    limitMs: config.seconds * 1000,
    showOnDevice: config.showOnDevice,
    phase: 'lobby',
    index: 0,
    step: 0,
    players: {},
    prevRanks: {},
    classId: cls?.id,
    className: cls?.name,
  };
}

export const NAME_MAX = 16;
/** Städar ett namn: inga konstiga tecken, inte för långt. */
export function cleanName(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N} .\-_]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
}

export function activePlayers(g: Game): Player[] {
  return Object.values(g.players).filter((p) => !p.removed);
}

export function addPlayer(g: Game, id: string, rawName: string, studentId?: string): Game {
  const name = cleanName(rawName);
  if (!name) return g;
  const existing = g.players[id];
  if (existing?.removed) return g;
  // Elevkopplingen gäller bara om quizet hör till en klass.
  const sid = g.classId && studentId ? studentId : undefined;
  if (existing) return existing.name === name || g.phase !== 'lobby' ? g : { ...g, players: { ...g.players, [id]: { ...existing, name: uniqueName(g, name, id) } } };
  return { ...g, players: { ...g.players, [id]: { id, name: uniqueName(g, name, id), studentId: sid, score: 0, streak: 0, answers: {} } } };
}

function uniqueName(g: Game, name: string, id: string) {
  const taken = new Set(activePlayers(g).filter((p) => p.id !== id).map((p) => p.name.toLocaleLowerCase('sv')));
  if (!taken.has(name.toLocaleLowerCase('sv'))) return name;
  for (let n = 2; ; n++) {
    const candidate = `${name.slice(0, NAME_MAX - 2)} ${n}`;
    if (!taken.has(candidate.toLocaleLowerCase('sv'))) return candidate;
  }
}

export function removePlayer(g: Game, id: string): Game {
  const p = g.players[id];
  return p ? { ...g, players: { ...g.players, [id]: { ...p, removed: true } } } : g;
}

const go = (g: Game, phase: Phase, extra: Partial<Game> = {}): Game => ({ ...g, ...extra, phase, step: g.step + 1 });

export const startGame = (g: Game) => go(g, 'ready', { index: 0 });
export const openQuestion = (g: Game) => (g.phase === 'ready' ? go(g, 'question') : g);

export function answer(g: Game, id: string, index: number, choice: number, ms: number): Game {
  const p = g.players[id];
  if (!p || p.removed || g.phase !== 'question' || index !== g.index || p.answers[index]) return g;
  const q = g.questions[index];
  if (choice < 0 || choice >= q.options.length) return g;
  const correct = choice === q.answer;
  const streak = correct ? p.streak + 1 : 0;
  const gained = pointsFor(correct, ms, g.limitMs, streak);
  const answers = { ...p.answers, [index]: { choice, ms: Math.max(0, Math.round(ms)), correct, gained } };
  return { ...g, players: { ...g.players, [id]: { ...p, answers, streak, score: p.score + gained } } };
}

export function allAnswered(g: Game): boolean {
  const ps = activePlayers(g);
  return ps.length > 0 && ps.every((p) => p.answers[g.index]);
}

/** Tiden är ute eller alla har svarat. Den som inte svarade tappar sin svit. */
export function reveal(g: Game): Game {
  if (g.phase !== 'question') return g;
  const players = { ...g.players };
  for (const p of Object.values(players)) if (!p.answers[g.index] && p.streak) players[p.id] = { ...p, streak: 0 };
  return go(g, 'reveal', { players });
}

export const showScores = (g: Game) => (g.phase === 'reveal' ? go(g, 'scores') : g);

export function next(g: Game): Game {
  const prevRanks = Object.fromEntries(ranking(g).map((p) => [p.id, p.rank]));
  if (g.index + 1 >= g.questions.length) return go(g, 'end', { prevRanks });
  return go(g, 'ready', { index: g.index + 1, prevRanks });
}

export interface Ranked {
  id: string;
  name: string;
  score: number;
  rank: number;
  streak: number;
}

/** Placering. Lika poäng ger samma placering. */
export function ranking(g: Game): Ranked[] {
  const sorted = activePlayers(g).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'sv'));
  let rank = 0;
  let last = -1;
  return sorted.map((p, i) => {
    if (p.score !== last) rank = i + 1;
    last = p.score;
    return { id: p.id, name: p.name, score: p.score, rank, streak: p.streak };
  });
}

/** Hur många som valde varje svar på en fråga. */
export function counts(g: Game, index = g.index): number[] {
  const c = g.questions[index].options.map(() => 0);
  for (const p of activePlayers(g)) {
    const a = p.answers[index];
    if (a) c[a.choice]++;
  }
  return c;
}

/** Andel rätt per fråga, för lärarens sammanfattning. */
export function summary(g: Game) {
  const ps = activePlayers(g);
  return g.questions.map((q, i) => {
    const answered = ps.filter((p) => p.answers[i]);
    const right = answered.filter((p) => p.answers[i].correct).length;
    return { q, i, right, answered: answered.length, share: ps.length ? right / ps.length : 0 };
  });
}

/** Det som sparas på klassen när quizet är slut. */
export function quizResultFrom(g: Game, at = Date.now()) {
  const ranks = new Map(ranking(g).map((r) => [r.id, r.rank]));
  return {
    title: g.title,
    at,
    questions: summary(g).map((s) => ({
      prompt: s.q.prompt + (s.q.detail ? ` ${s.q.detail}` : ''),
      answer: s.q.options[s.q.answer].hideLabel ? `Svar ${s.q.answer + 1}` : s.q.options[s.q.answer].label,
      right: s.right,
      answered: s.answered,
    })),
    players: activePlayers(g)
      .map((p) => ({
        name: p.name,
        ...(p.studentId ? { studentId: p.studentId } : {}),
        score: p.score,
        right: Object.values(p.answers).filter((a) => a.correct).length,
        rank: ranks.get(p.id)!,
      }))
      .sort((a, b) => a.rank - b.rank),
  };
}

/* ================= Det som skickas till eleverna ================= */

/** Det eleverna får se. Rätt svar skickas först när frågan är avslutad. */
export interface PublicState {
  code: string;
  /** Klassen quizet hör till, så att inloggade elever kan kopplas till sitt elevkonto. */
  classId?: string;
  grade: Grade;
  title: string;
  phase: Phase;
  step: number;
  index: number;
  total: number;
  limitMs: number;
  question: Omit<QuizQuestion, 'answer' | 'explain'> & { answer?: number; explain?: string };
  showOnDevice: boolean;
  answered: number;
  playerCount: number;
  /** Per elev: namn, poäng, placering, svar på aktuell fråga. */
  players: Record<string, { name: string; score: number; rank: number; streak: number; answered: boolean; last?: { correct: boolean; gained: number } }>;
  removed: string[];
}

export function publicState(g: Game): PublicState {
  const q = g.questions[g.index];
  const done = g.phase === 'reveal' || g.phase === 'scores' || g.phase === 'end';
  const ranks = new Map(ranking(g).map((r) => [r.id, r]));
  const players: PublicState['players'] = {};
  for (const p of activePlayers(g)) {
    const a = p.answers[g.index];
    const r = ranks.get(p.id)!;
    players[p.id] = { name: p.name, score: p.score, rank: r.rank, streak: p.streak, answered: !!a, last: done ? { correct: !!a?.correct, gained: a?.gained ?? 0 } : undefined };
  }
  const { answer: ans, explain, ...rest } = q;
  return {
    code: g.code,
    classId: g.classId,
    grade: g.grade,
    title: g.title,
    phase: g.phase,
    step: g.step,
    index: g.index,
    total: g.questions.length,
    limitMs: g.limitMs,
    question: done ? { ...rest, answer: ans, explain } : rest,
    showOnDevice: g.showOnDevice,
    answered: activePlayers(g).filter((p) => p.answers[g.index]).length,
    playerCount: activePlayers(g).length,
    players,
    removed: Object.values(g.players)
      .filter((p) => p.removed)
      .map((p) => p.id),
  };
}

/** Sexsiffrig kod som är lätt att läsa upp. */
export function makeQuizCode(rng: Rng = Math.random): string {
  return String(100000 + Math.floor(rng() * 900000));
}
export const formatQuizCode = (c: string) => `${c.slice(0, 3)} ${c.slice(3)}`;
export const isQuizCode = (c: string) => /^\d{6}$/.test(c.replace(/\s/g, ''));

/** Roliga påhittade namn för elever som inte vill skriva sitt eget. */
const ADJ = ['Snabb', 'Klok', 'Glad', 'Modig', 'Lugn', 'Stark', 'Listig', 'Pigg', 'Smart', 'Vild'];
const NOUN = ['Uggla', 'Räv', 'Lo', 'Säl', 'Älg', 'Hare', 'Örn', 'Utter', 'Björn', 'Mus', 'Igelkott'];
export function funName(rng: Rng = Math.random): string {
  return `${ADJ[Math.floor(rng() * ADJ.length)]} ${NOUN[Math.floor(rng() * NOUN.length)]}`;
}
