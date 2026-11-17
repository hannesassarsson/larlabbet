import { isFirebaseConfigured } from '../backend';
import type { PublicState } from './game';

/**
 * Kopplingen mellan lärarens skärm och elevernas plattor.
 *
 * - Med Firebase: lärarens skärm skriver läget till Firestore och eleverna
 *   lyssnar. Fungerar mellan olika enheter.
 * - Utan Firebase (demoläget): BroadcastChannel, alltså bara mellan flikar och
 *   fönster i samma webbläsare på samma enhet. Bra för att prova och för testerna.
 */
export type PlayerMsg = { t: 'join'; pid: string; name: string; studentId?: string } | { t: 'answer'; pid: string; index: number; choice: number; ms: number } | { t: 'leave'; pid: string };

export interface HostLink {
  /** Läraren: skicka ut nytt läge till alla. */
  publish(s: PublicState): void;
  onMessage(cb: (m: PlayerMsg) => void): () => void;
  /** Slutar lyssna (sidan stängs). Quizet finns kvar så att läraren kan ladda om. */
  close(): void;
  /** Avslutar quizet för alla. */
  end(): void;
}

export interface PlayerLink {
  pid: string;
  send(m: PlayerMsg): void;
  onState(cb: (s: PublicState) => void): () => void;
  close(): void;
}

export class QuizError extends Error {}

export const linkKind = (): 'firebase' | 'local' => (isFirebaseConfigured() ? 'firebase' : 'local');

/** Skapar ett quiz med en ledig kod. `makeCode` anropas igen om koden är upptagen. */
export async function hostQuiz(makeCode: () => string): Promise<{ code: string; link: HostLink }> {
  if (linkKind() === 'firebase') return (await import('./link-firebase')).hostFirebase(makeCode);
  return (await import('./link-local')).hostLocal(makeCode);
}

/** Återansluter lärarens skärm efter en omladdning. */
export async function rehostQuiz(code: string): Promise<HostLink> {
  if (linkKind() === 'firebase') return (await import('./link-firebase')).rehostFirebase(code);
  return (await import('./link-local')).rehostLocal(code);
}

/** Eleven: anslut till quizet. Kastar QuizError om koden inte finns. */
export async function joinQuiz(code: string): Promise<{ link: PlayerLink; state: PublicState }> {
  if (linkKind() === 'firebase') return (await import('./link-firebase')).joinFirebase(code);
  return (await import('./link-local')).joinLocal(code);
}
