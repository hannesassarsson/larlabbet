import { useCallback, useEffect, useState } from 'react';

/**
 * All data sparas lokalt på enheten. Inget skickas någonstans.
 * localStorage: inställningar, bästa resultat, spelhistorik.
 * sessionStorage: pågående spelomgång, så att den överlever en oavsiktlig omladdning.
 */
const PREFIX = 'leklandet:';

function safeGet(store: Storage | undefined, key: string): string | null {
  try {
    return store ? store.getItem(PREFIX + key) : null;
  } catch {
    return null;
  }
}

function safeSet(store: Storage | undefined, key: string, value: string | null) {
  try {
    if (!store) return;
    if (value === null) store.removeItem(PREFIX + key);
    else store.setItem(PREFIX + key, value);
  } catch {
    /* privat läge eller full lagring – appen fungerar ändå */
  }
}

const local = typeof localStorage !== 'undefined' ? localStorage : undefined;
const session = typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;

export function readJSON<T>(key: string, fallback: T, store: 'local' | 'session' = 'local'): T {
  const raw = safeGet(store === 'local' ? local : session, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, store: 'local' | 'session' = 'local') {
  safeSet(store === 'local' ? local : session, key, value === undefined ? null : JSON.stringify(value));
}

export function removeKey(key: string, store: 'local' | 'session' = 'local') {
  safeSet(store === 'local' ? local : session, key, null);
}

/* ---------- Inställningar ---------- */
export interface Settings {
  sound: boolean;
}

const SETTINGS_KEY = 'settings';
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return { sound: true, ...readJSON<Partial<Settings>>(SETTINGS_KEY, {}) };
}

export function setSettings(patch: Partial<Settings>) {
  writeJSON(SETTINGS_KEY, { ...getSettings(), ...patch });
  listeners.forEach((l) => l());
}

export function useSettings(): [Settings, (p: Partial<Settings>) => void] {
  const [s, setS] = useState(getSettings);
  useEffect(() => {
    const l = () => setS(getSettings());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return [s, setSettings];
}

/* ---------- Historik och resultat ---------- */
export interface HistoryEntry {
  gameId: string;
  at: number;
}

export interface GameRecord {
  plays: number;
  best?: number; // spelspecifikt "bästa" (högst poäng eller lägst antal drag)
  bestLabel?: string;
  stars?: number; // flest stjärnor någon gång (0–3)
}

export function getHistory(): HistoryEntry[] {
  return readJSON<HistoryEntry[]>('history', []);
}

export function markPlayed(gameId: string) {
  const list = getHistory().filter((h) => h.gameId !== gameId);
  list.unshift({ gameId, at: Date.now() });
  writeJSON('history', list.slice(0, 8));
}

export function getRecords(): Record<string, GameRecord> {
  return readJSON<Record<string, GameRecord>>('records', {});
}

/**
 * Sparar ett avslutat resultat. `score` jämförs med tidigare bästa enligt `better`.
 * Returnerar true om det var nytt rekord.
 */
export function saveResult(
  gameId: string,
  opts: { score?: number; better?: 'higher' | 'lower'; label?: string; stars?: number; key?: string }
): boolean {
  const records = getRecords();
  const id = opts.key ? `${gameId}:${opts.key}` : gameId;
  const prev: GameRecord = records[id] ?? { plays: 0 };
  const next: GameRecord = { ...prev, plays: prev.plays + 1 };
  let isRecord = false;
  if (opts.score !== undefined) {
    const better = opts.better ?? 'higher';
    if (
      prev.best === undefined ||
      (better === 'higher' && opts.score > prev.best) ||
      (better === 'lower' && opts.score < prev.best)
    ) {
      isRecord = prev.best !== undefined;
      next.best = opts.score;
      next.bestLabel = opts.label;
    }
  }
  if (opts.stars !== undefined) next.stars = Math.max(prev.stars ?? 0, opts.stars);
  records[id] = next;
  if (opts.key) {
    const base = records[gameId] ?? { plays: 0 };
    records[gameId] = { ...base, plays: base.plays + 1, stars: Math.max(base.stars ?? 0, opts.stars ?? 0) };
  }
  writeJSON('records', records);
  return isRecord;
}

export function getRecord(gameId: string, key?: string): GameRecord | undefined {
  return getRecords()[key ? `${gameId}:${key}` : gameId];
}

/** Nollställer resultat och historik (inte inställningar). */
export function resetProgress() {
  removeKey('history');
  removeKey('records');
  try {
    if (session) {
      Object.keys(session)
        .filter((k) => k.startsWith(PREFIX + 'game:'))
        .forEach((k) => session.removeItem(k));
    }
  } catch {
    /* ignorera */
  }
}

/**
 * useState som speglas i sessionStorage. Används för pågående spelomgångar
 * så att en omladdning inte nollställer spelet.
 */
export function useSessionState<T>(key: string, initial: () => T): [T, (v: T | ((p: T) => T)) => void, () => void] {
  const fullKey = 'game:' + key;
  const [value, setValue] = useState<T>(() => readJSON<T | null>(fullKey, null, 'session') ?? initial());
  useEffect(() => {
    writeJSON(fullKey, value, 'session');
  }, [fullKey, value]);
  const clear = useCallback(() => removeKey(fullKey, 'session'), [fullKey]);
  return [value, setValue, clear];
}
