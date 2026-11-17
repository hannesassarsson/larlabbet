import { collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { loadBackend } from '../backend';
import type { FirebaseBackend } from '../backend/firebase';
import type { PublicState } from './game';
import { QuizError, type HostLink, type PlayerLink, type PlayerMsg } from './link';

/**
 * Klassquiz via Firestore (se firestore.rules, avsnittet quizzes):
 *   quizzes/{kod}                 lärarens skärm skriver läget, eleverna lyssnar
 *   quizzes/{kod}/players/{uid}   eleven skriver sitt namn
 *   quizzes/{kod}/answers/{uid_n} eleven skriver ett svar per fråga, kan inte ändras
 *
 * OBS: inte provat mot ett riktigt Firebase-projekt ännu.
 */
async function services() {
  const backend = (await loadBackend()) as FirebaseBackend;
  return backend.quizServices();
}

export async function hostFirebase(makeCode: () => string) {
  const { db, uid } = await services();
  for (let i = 0; i < 20; i++) {
    const code = makeCode();
    const ref = doc(db, 'quizzes', code);
    const existing = await getDoc(ref).catch(() => null);
    if (existing?.exists()) continue;
    await setDoc(ref, { hostUid: uid, state: null, createdAt: serverTimestamp() });
    return { code, link: await rehostFirebase(code) };
  }
  throw new QuizError('Kunde inte skapa en kod. Försök igen.');
}

export async function rehostFirebase(code: string): Promise<HostLink> {
  const { db } = await services();
  const ref = doc(db, 'quizzes', code);
  const subs = new Set<(m: PlayerMsg) => void>();
  const emit = (m: PlayerMsg) => subs.forEach((cb) => cb(m));
  const offPlayers = onSnapshot(collection(ref, 'players'), (snap) => {
    for (const ch of snap.docChanges()) {
      if (ch.type === 'removed') continue;
      const d = ch.doc.data();
      emit({ t: 'join', pid: ch.doc.id, name: String(d.name ?? ''), studentId: typeof d.studentId === 'string' ? d.studentId : undefined });
    }
  });
  const offAnswers = onSnapshot(collection(ref, 'answers'), (snap) => {
    for (const ch of snap.docChanges()) {
      if (ch.type !== 'added') continue;
      const d = ch.doc.data();
      emit({ t: 'answer', pid: String(d.pid), index: Number(d.index), choice: Number(d.choice), ms: Number(d.ms) });
    }
  });
  let pending: PublicState | null = null;
  let writing = false;
  // Skriv bara det senaste läget om flera ändringar kommer tätt.
  const flush = async () => {
    if (writing || !pending) return;
    writing = true;
    const s = pending;
    pending = null;
    try {
      // JSON-rundan tar bort fält som är undefined – Firestore vägrar annars hela skrivningen.
      const clean = JSON.parse(JSON.stringify(s)) as PublicState;
      await updateDoc(ref, { state: clean, phase: s.phase, index: s.index, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Kunde inte skicka quizläget', e);
    } finally {
      writing = false;
      void flush();
    }
  };
  return {
    publish(s) {
      pending = s;
      void flush();
    },
    onMessage(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    close() {
      offPlayers();
      offAnswers();
    },
    end() {
      offPlayers();
      offAnswers();
      void deleteDoc(ref).catch(() => undefined);
    },
  };
}

export async function joinFirebase(code: string): Promise<{ link: PlayerLink; state: PublicState }> {
  const { db, uid } = await services();
  const ref = doc(db, 'quizzes', code);
  const first = await getDoc(ref).catch(() => null);
  const state = first?.data()?.state as PublicState | null | undefined;
  if (!first?.exists() || !state) throw new QuizError('Det finns inget quiz med den koden just nu. Kontrollera siffrorna.');
  const subs = new Set<(s: PublicState) => void>();
  let latest = state;
  const off = onSnapshot(ref, (snap) => {
    const s = snap.data()?.state as PublicState | undefined;
    if (!s) return;
    latest = s;
    subs.forEach((cb) => cb(s));
  });
  return {
    state,
    link: {
      pid: uid,
      send(m) {
        if (m.t === 'join') void setDoc(doc(ref, 'players', uid), { name: m.name, at: serverTimestamp(), ...(m.studentId ? { studentId: m.studentId } : {}) });
        else if (m.t === 'answer') void setDoc(doc(ref, 'answers', `${uid}_${m.index}`), { pid: uid, index: m.index, choice: m.choice, ms: m.ms }).catch(() => undefined);
      },
      onState(cb) {
        subs.add(cb);
        cb(latest);
        return () => subs.delete(cb);
      },
      close: off,
    },
  };
}
