import { readJSON, writeJSON } from './storage';
import type { Grade } from '../curriculum/types';

/**
 * Lokala framsteg i Lärlabbet: bästa resultat per övning och senast övade.
 * Sparas bara på enheten (ingen inloggning krävs för att öva).
 */
export interface ActivityProgress {
  best: number; // andel rätt 0–100
  last: number;
  tries: number;
  at: number;
}

const KEY = 'lar-framsteg';
const GRADE_KEY = 'lar-arskurs';

export function getProgress(): Record<string, ActivityProgress> {
  return readJSON<Record<string, ActivityProgress>>(KEY, {});
}

export function recordProgress(activityId: string, score: number, max: number) {
  const pct = max ? Math.round((score / max) * 100) : 0;
  const all = getProgress();
  const prev = all[activityId];
  all[activityId] = { best: Math.max(prev?.best ?? 0, pct), last: pct, tries: (prev?.tries ?? 0) + 1, at: Date.now() };
  writeJSON(KEY, all);
}

export function recentActivities(limit = 4): [string, ActivityProgress][] {
  return Object.entries(getProgress())
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, limit);
}

export function clearProgress() {
  writeJSON(KEY, {});
}

export const getLarGrade = (): Grade => readJSON<Grade>(GRADE_KEY, 4);
export const setLarGrade = (g: Grade) => writeJSON(GRADE_KEY, g);

/** Nivå för en övning utifrån bästa resultatet. */
export function masteryOf(p?: ActivityProgress): 'ny' | 'ova' | 'nastan' | 'klar' {
  if (!p) return 'ny';
  if (p.best >= 90) return 'klar';
  if (p.best >= 70) return 'nastan';
  return 'ova';
}

export const MASTERY_LABEL = { ny: 'Inte övad', ova: 'Öva mer', nastan: 'Nästan', klar: 'Kan' } as const;
