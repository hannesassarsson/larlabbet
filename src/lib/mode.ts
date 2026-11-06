import { useEffect, useState } from 'react';
import { readJSON, writeJSON } from './storage';

/**
 * Lärlabbet har två delar som delar innehåll och motor men ser olika ut:
 * - Leklabbet ("lek"): lekfullt, för förskoleklass till årskurs 3.
 * - Lärlabbet ("lar"): skolmässigt, för årskurs 4–6, lärare och föräldrar.
 */
export type Mode = 'lek' | 'lar';

export const BRAND: Record<Mode, { name: string; first: string; rest: string; grades: string; bg: string }> = {
  lek: { name: 'Leklabbet', first: 'Lek', rest: 'labbet', grades: 'F–3', bg: '#FFF8EE' },
  lar: { name: 'Lärlabbet', first: 'Lär', rest: 'labbet', grades: '4–6', bg: '#F4F5F1' },
};

export const APP_NAME = 'Lärlabbet';

let current: Mode = 'lek';
const listeners = new Set<(m: Mode) => void>();

export function setMode(m: Mode) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.mode = m;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BRAND[m].bg);
  }
  if (current === m) return;
  current = m;
  listeners.forEach((l) => l(m));
}

export function getMode() {
  return current;
}

export function useMode(): Mode {
  const [m, setM] = useState(current);
  useEffect(() => {
    listeners.add(setM);
    setM(current);
    return () => {
      listeners.delete(setM);
    };
  }, []);
  return m;
}

/** Vilket läge en sökväg hör till. Elevsidorna justerar efter klassens årskurs. */
export function modeForPath(path: string): Mode {
  if (path === '/lek' || path.startsWith('/spel/') || path === '/ova' || path.startsWith('/ova/')) return 'lek';
  return 'lar';
}

/** Läget för en årskurs: F–3 är Leklabbet, 4–6 Lärlabbet. */
export const modeForGrade = (grade: number): Mode => (grade <= 3 ? 'lek' : 'lar');

/* ---------- Senast valda del ---------- */
const LAST_KEY = 'senaste-del';
export const getLastPart = () => readJSON<Mode | null>(LAST_KEY, null);
export const setLastPart = (m: Mode) => writeJSON(LAST_KEY, m);
