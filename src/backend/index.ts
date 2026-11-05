import { useEffect, useState } from 'react';
import type { Backend, Session } from './types';

/**
 * Väljer backend: Firebase om det är konfigurerat (VITE_FIREBASE_*), annars
 * demoläget. Firebase-koden laddas bara när någon behöver den.
 */
let backendPromise: Promise<Backend> | null = null;

export function isFirebaseConfigured() {
  return !!(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);
}

export function loadBackend(): Promise<Backend> {
  if (!backendPromise) {
    backendPromise = isFirebaseConfigured()
      ? import('./firebase').then(({ FirebaseBackend, firebaseConfig }) => new FirebaseBackend(firebaseConfig()!))
      : import('./local').then(({ LocalBackend }) => new LocalBackend());
  }
  return backendPromise;
}

export interface BackendState {
  backend: Backend | null;
  session: Session | null;
  loading: boolean;
}

/** Laddar backend och följer inloggningen. */
export function useBackend(): BackendState {
  const [state, setState] = useState<BackendState>({ backend: null, session: null, loading: true });
  useEffect(() => {
    let off: (() => void) | undefined;
    let alive = true;
    loadBackend().then((backend) => {
      if (!alive) return;
      off = backend.onSession((session) => alive && setState({ backend, session, loading: false }));
    });
    return () => {
      alive = false;
      off?.();
    };
  }, []);
  return state;
}

/** Laddar data asynkront med omladdning och felmeddelande. */
export function useAsync<T>(fn: (() => Promise<T>) | null, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!fn) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((e: Error) => alive && setState({ data: null, error: e.message || 'Något gick fel.', loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, !!fn]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export * from './types';
