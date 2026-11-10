import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  FieldPath,
  getDoc,
  getDocs,
  initializeFirestore,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore';
import type { Grade } from '../curriculum/types';
import {
  BackendError,
  makeCode,
  normalizeCode,
  type Assignment,
  type Backend,
  type ChildLink,
  type ClassRoom,
  type Session,
  type Student,
  type StudentCodes,
  type WordListDoc,
} from './types';

/**
 * Firebase-backend: Authentication (e-post/lösenord för vuxna, anonym inloggning
 * för elever som sedan kopplas till en elevkod) och Firestore. Behörigheter
 * upprätthålls av firestore.rules – klienten litas aldrig på.
 */
export function firebaseConfig(): FirebaseOptions | null {
  const env = import.meta.env;
  if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID) return null;
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  };
}

function mapError(e: unknown): never {
  const code = (e as { code?: string })?.code ?? '';
  if (e instanceof BackendError) throw e;
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) throw new BackendError('auth/invalid', 'Fel e-postadress eller lösenord.');
  if (/email-already-in-use/.test(code)) throw new BackendError('auth/exists', 'Det finns redan ett konto med den e-postadressen.');
  if (/weak-password/.test(code)) throw new BackendError('auth/weak', 'Lösenordet behöver vara minst 8 tecken.');
  if (/permission-denied/.test(code)) throw new BackendError('permission', 'Du har inte behörighet till det här.');
  if (/unavailable|network/.test(code)) throw new BackendError('network', 'Ingen kontakt med servern. Kontrollera internetanslutningen.');
  if (/admin-restricted-operation|operation-not-allowed/.test(code))
    throw new BackendError('config', 'Inloggningssättet är inte aktiverat i Firebase. Se installationsguiden i README.');
  console.error(e);
  throw new BackendError('network', 'Något gick fel. Försök igen om en stund.');
}

async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    mapError(e);
  }
}

export class FirebaseBackend implements Backend {
  mode = 'firebase' as const;
  private auth: Auth;
  private db: Firestore;
  private current: Session | null = null;
  private listeners = new Set<(s: Session | null) => void>();
  private ready = false;

  constructor(config: FirebaseOptions) {
    const app = initializeApp(config);
    this.auth = getAuth(app);
    // Lokal cache gör att resultat kan sparas även när nätet är borta en stund.
    // ignoreUndefinedProperties: fält som saknar värde hoppas över i stället för att hela skrivningen avvisas.
    this.db = initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
    onAuthStateChanged(this.auth, (u) => void this.resolve(u));
  }

  /** Klassquizet använder samma Firebase-app. Loggar in anonymt om ingen är inloggad. */
  async quizServices(): Promise<{ db: Firestore; uid: string }> {
    const u = this.auth.currentUser ?? (await signInAnonymously(this.auth)).user;
    return { db: this.db, uid: u.uid };
  }

  private emit(s: Session | null) {
    this.current = s;
    this.ready = true;
    this.listeners.forEach((l) => l(s));
  }

  private async resolve(u: User | null) {
    if (!u) return this.emit(null);
    try {
      if (u.isAnonymous) {
        const m = await getDoc(doc(this.db, 'members', u.uid));
        const d = m.data();
        return this.emit(d ? { role: 'student', uid: u.uid, classId: d.classId, studentId: d.studentId } : null);
      }
      const p = await getDoc(doc(this.db, 'users', u.uid));
      const d = p.data();
      if (!d) return this.emit(null); // profilen skapas strax efter registreringen
      this.emit({ role: d.role, uid: u.uid, name: d.name, email: d.email });
    } catch {
      this.emit(null);
    }
  }

  onSession(cb: (s: Session | null) => void) {
    this.listeners.add(cb);
    if (this.ready) cb(this.current);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private uid() {
    const u = this.auth.currentUser;
    if (!u) throw new BackendError('permission', 'Du behöver logga in igen.');
    return u.uid;
  }

  async signUp(role: 'teacher' | 'parent', name: string, email: string, password: string) {
    await wrap(async () => {
      if (password.length < 8) throw new BackendError('auth/weak', 'Lösenordet behöver vara minst 8 tecken.');
      const cred = await createUserWithEmailAndPassword(this.auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await setDoc(doc(this.db, 'users', cred.user.uid), { role, name: name.trim(), email: email.trim().toLowerCase(), createdAt: Date.now() });
      await this.resolve(cred.user);
    });
  }

  async signIn(email: string, password: string) {
    await wrap(async () => {
      const cred = await signInWithEmailAndPassword(this.auth, email.trim(), password);
      await this.resolve(cred.user);
    });
  }

  async resetPassword(email: string) {
    await wrap(() => sendPasswordResetEmail(this.auth, email.trim()));
  }

  async studentSignIn(code: string) {
    await wrap(async () => {
      const c = normalizeCode(code);
      if (this.auth.currentUser && !this.auth.currentUser.isAnonymous) await fbSignOut(this.auth);
      const cred = this.auth.currentUser ?? (await signInAnonymously(this.auth)).user;
      const key = await getDoc(doc(this.db, 'loginKeys', c));
      if (!key.exists()) throw new BackendError('code/unknown', 'Koden finns inte. Kontrollera att den är rätt skriven.');
      const { classId, studentId } = key.data();
      await setDoc(doc(this.db, 'members', cred.uid), { classId, studentId, code: c, at: Date.now() });
      await this.resolve(cred);
    });
  }

  async signOut() {
    await wrap(async () => {
      const u = this.auth.currentUser;
      if (u?.isAnonymous) {
        await deleteDoc(doc(this.db, 'members', u.uid)).catch(() => {});
        await u.delete().catch(() => {});
      }
      await fbSignOut(this.auth);
      this.emit(null);
    });
  }

  /* ---------- Lärare ---------- */
  private classRef = (id: string) => doc(this.db, 'classes', id);
  private sub = (classId: string, name: string) => collection(this.db, 'classes', classId, name);

  async listClasses() {
    return wrap(async () => {
      const snap = await getDocs(query(collection(this.db, 'classes'), where('teacherId', '==', this.uid())));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassRoom).sort((a, b) => a.createdAt - b.createdAt);
    });
  }
  async createClass(name: string, grade: Grade) {
    return wrap(async () => {
      const ref = doc(collection(this.db, 'classes'));
      const c = { name: name.trim(), grade, teacherId: this.uid(), createdAt: Date.now() };
      await setDoc(ref, c);
      return { id: ref.id, ...c };
    });
  }
  async updateClass(id: string, patch: Partial<Pick<ClassRoom, 'name' | 'grade'>>) {
    await wrap(() => updateDoc(this.classRef(id), patch));
  }
  async getClass(id: string) {
    return wrap(async () => {
      const d = await getDoc(this.classRef(id));
      return d.exists() ? ({ id: d.id, ...d.data() } as ClassRoom) : null;
    });
  }
  async deleteClass(classId: string) {
    await wrap(async () => {
      const codes = await this.getCodes(classId);
      let batch = writeBatch(this.db);
      let n = 0;
      const op = async (fn: (b: WriteBatch) => void) => {
        fn(batch);
        if (++n >= 400) {
          await batch.commit();
          batch = writeBatch(this.db);
          n = 0;
        }
      };
      for (const [sid, c] of Object.entries(codes)) {
        await op((b) => b.delete(doc(this.db, 'loginKeys', c.loginCode)));
        await op((b) => b.delete(doc(this.db, 'parentKeys', c.parentCode)));
        await op((b) => b.delete(doc(this.sub(classId, 'studentCodes'), sid)));
      }
      for (const name of ['students', 'assignments', 'wordlists']) {
        const snap = await getDocs(this.sub(classId, name));
        for (const d of snap.docs) await op((b) => b.delete(d.ref));
      }
      await batch.commit();
      await deleteDoc(this.classRef(classId));
    });
  }

  async listStudents(classId: string) {
    return wrap(async () => {
      const snap = await getDocs(this.sub(classId, 'students'));
      return snap.docs.map((d) => ({ id: d.id, classId, progress: {}, ...d.data() }) as Student).sort((a, b) => a.alias.localeCompare(b.alias, 'sv'));
    });
  }
  async addStudents(classId: string, list: { alias: string; avatar: Student['avatar'] }[]) {
    await wrap(async () => {
      const teacherId = this.uid();
      const batch = writeBatch(this.db);
      for (const s of list) {
        const ref = doc(this.sub(classId, 'students'));
        const codes = { loginCode: makeCode(), parentCode: makeCode() };
        batch.set(ref, { alias: s.alias.trim(), avatar: s.avatar, progress: {}, createdAt: Date.now() });
        batch.set(doc(this.sub(classId, 'studentCodes'), ref.id), codes);
        batch.set(doc(this.db, 'loginKeys', codes.loginCode), { classId, studentId: ref.id, teacherId });
        batch.set(doc(this.db, 'parentKeys', codes.parentCode), { classId, studentId: ref.id, teacherId });
      }
      await batch.commit();
    });
  }
  async updateStudent(classId: string, id: string, patch: Partial<Pick<Student, 'alias' | 'avatar'>>) {
    await wrap(() => updateDoc(doc(this.sub(classId, 'students'), id), patch));
  }
  async removeStudent(classId: string, id: string) {
    await wrap(async () => {
      const codes = (await getDoc(doc(this.sub(classId, 'studentCodes'), id))).data() as StudentCodes | undefined;
      const batch = writeBatch(this.db);
      if (codes) {
        batch.delete(doc(this.db, 'loginKeys', codes.loginCode));
        batch.delete(doc(this.db, 'parentKeys', codes.parentCode));
      }
      batch.delete(doc(this.sub(classId, 'studentCodes'), id));
      batch.delete(doc(this.sub(classId, 'students'), id));
      await batch.commit();
    });
  }
  async getCodes(classId: string) {
    return wrap(async () => {
      const snap = await getDocs(this.sub(classId, 'studentCodes'));
      return Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as StudentCodes]));
    });
  }
  async renewCodes(classId: string, id: string) {
    return wrap(async () => {
      const teacherId = this.uid();
      const old = (await getDoc(doc(this.sub(classId, 'studentCodes'), id))).data() as StudentCodes | undefined;
      const codes = { loginCode: makeCode(), parentCode: makeCode() };
      const batch = writeBatch(this.db);
      // Den gamla koden slutar fungera direkt, även på enheter som redan är inloggade.
      if (old) {
        batch.delete(doc(this.db, 'loginKeys', old.loginCode));
        batch.delete(doc(this.db, 'parentKeys', old.parentCode));
      }
      batch.set(doc(this.sub(classId, 'studentCodes'), id), codes);
      batch.set(doc(this.db, 'loginKeys', codes.loginCode), { classId, studentId: id, teacherId });
      batch.set(doc(this.db, 'parentKeys', codes.parentCode), { classId, studentId: id, teacherId });
      await batch.commit();
      return codes;
    });
  }

  async listAssignments(classId: string) {
    return wrap(async () => {
      const snap = await getDocs(query(this.sub(classId, 'assignments'), orderBy('createdAt', 'desc')));
      return snap.docs.map((d) => ({ id: d.id, classId, ...d.data() }) as Assignment);
    });
  }
  async saveAssignment(classId: string, a: Omit<Assignment, 'id' | 'classId' | 'createdAt'> & { id?: string }) {
    return wrap(async () => {
      const ref = a.id ? doc(this.sub(classId, 'assignments'), a.id) : doc(this.sub(classId, 'assignments'));
      const prev = a.id ? (await getDoc(ref)).data() : undefined;
      const { id: _drop, ...rest } = a;
      void _drop;
      const data = JSON.parse(JSON.stringify({ ...rest, createdAt: prev?.createdAt ?? Date.now() })); // tar bort undefined
      await setDoc(ref, data);
      return { ...data, id: ref.id, classId } as Assignment;
    });
  }
  async deleteAssignment(classId: string, id: string) {
    await wrap(() => deleteDoc(doc(this.sub(classId, 'assignments'), id)));
  }

  async listWordLists(classId: string) {
    return wrap(async () => {
      const snap = await getDocs(this.sub(classId, 'wordlists'));
      return snap.docs.map((d) => ({ id: d.id, classId, ...d.data() }) as WordListDoc).sort((a, b) => b.createdAt - a.createdAt);
    });
  }
  async saveWordList(classId: string, w: Omit<WordListDoc, 'id' | 'classId' | 'createdAt'> & { id?: string }) {
    return wrap(async () => {
      const ref = w.id ? doc(this.sub(classId, 'wordlists'), w.id) : doc(this.sub(classId, 'wordlists'));
      const prev = w.id ? (await getDoc(ref)).data() : undefined;
      const data = { title: w.title, pairs: w.pairs, createdAt: prev?.createdAt ?? Date.now() };
      await setDoc(ref, data);
      return { ...data, id: ref.id, classId };
    });
  }
  async deleteWordList(classId: string, id: string) {
    await wrap(() => deleteDoc(doc(this.sub(classId, 'wordlists'), id)));
  }

  /* ---------- Elev ---------- */
  async getStudent(classId: string, studentId: string) {
    return wrap(async () => {
      const d = await getDoc(doc(this.sub(classId, 'students'), studentId));
      return d.exists() ? ({ id: d.id, classId, progress: {}, ...d.data() } as Student) : null;
    });
  }
  async reportResult(classId: string, studentId: string, assignmentId: string, itemIndex: number, score: number, max: number) {
    await wrap(async () => {
      const ref = doc(this.sub(classId, 'students'), studentId);
      const cur = (await getDoc(ref)).data() as Student | undefined;
      const prev = cur?.progress?.[assignmentId]?.[itemIndex];
      const value = { best: Math.max(prev?.best ?? 0, score), max, tries: (prev?.tries ?? 0) + 1, at: Date.now() };
      await updateDoc(ref, new FieldPath('progress', assignmentId, String(itemIndex)), value, 'lastActive', Date.now());
    });
  }

  /* ---------- Förälder ---------- */
  async linkChild(code: string) {
    await wrap(async () => {
      const uid = this.uid();
      const c = normalizeCode(code);
      const key = await getDoc(doc(this.db, 'parentKeys', c));
      if (!key.exists()) throw new BackendError('code/unknown', 'Föräldrakoden finns inte. Kontrollera att den är rätt skriven.');
      const { classId, studentId } = key.data();
      const batch = writeBatch(this.db);
      batch.set(doc(this.db, 'parents', uid, 'children', studentId), { classId, code: c, at: Date.now() });
      batch.set(doc(this.db, 'parents', uid, 'classes', classId), { code: c, at: Date.now() });
      await batch.commit();
    });
  }
  async unlinkChild(studentId: string) {
    await wrap(() => deleteDoc(doc(this.db, 'parents', this.uid(), 'children', studentId)));
  }
  async listChildren(): Promise<ChildLink[]> {
    return wrap(async () => {
      const snap = await getDocs(collection(this.db, 'parents', this.uid(), 'children'));
      const out: ChildLink[] = [];
      for (const d of snap.docs) {
        const { classId } = d.data();
        try {
          const [student, cls] = await Promise.all([this.getStudent(classId, d.id), this.getClass(classId)]);
          if (student && cls) out.push({ classId, studentId: d.id, student, className: cls.name, grade: cls.grade });
        } catch {
          // Eleven kan ha tagits bort eller fått ny kod – hoppa över.
        }
      }
      return out;
    });
  }
}
