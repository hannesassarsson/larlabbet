import type { Grade } from '../curriculum/types';
import { readJSON, writeJSON } from '../lib/storage';
import {
  BackendError,
  makeCode,
  normalizeCode,
  type Assignment,
  type Backend,
  type ChildLink,
  type ClassRoom,
  type Session,
  type QuizResult,
  type Student,
  type StudentCodes,
  type WordListDoc,
} from './types';

/**
 * Demoläge: samma funktioner som Firebase-versionen, men allt sparas i
 * webbläsaren på den här enheten. Används när Firebase inte är konfigurerat,
 * så att lärare, elever och föräldrar kan provas direkt.
 */
interface User {
  uid: string;
  role: 'teacher' | 'parent';
  name: string;
  email: string;
  pw: string; // SHA-256 av lösenordet
}
interface DB {
  users: User[];
  classes: ClassRoom[];
  students: Student[];
  codes: Record<string, StudentCodes & { classId: string }>; // per studentId
  assignments: Assignment[];
  wordlists: WordListDoc[];
  quizResults: QuizResult[];
  parentLinks: { uid: string; classId: string; studentId: string }[];
}

const KEY = 'demo-db';
const SESSION_KEY = 'demo-session';
const empty = (): DB => ({ users: [], classes: [], students: [], codes: {}, assignments: [], wordlists: [], quizResults: [], parentLinks: [] });
const id = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

async function hash(pw: string) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('leklandet-demo:' + pw));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // crypto.subtle kräver säker anslutning; i demoläge räcker en enkel kontrollsumma.
    let h = 0;
    for (const c of pw) h = (h * 31 + c.charCodeAt(0)) | 0;
    return 'x' + h;
  }
}

export class LocalBackend implements Backend {
  mode = 'demo' as const;
  private listeners = new Set<(s: Session | null) => void>();

  private db(): DB {
    return { ...empty(), ...readJSON<DB>(KEY, empty()) };
  }
  private save(db: DB) {
    writeJSON(KEY, db);
  }
  private session(): Session | null {
    return readJSON<Session | null>(SESSION_KEY, null);
  }
  private setSession(s: Session | null) {
    writeJSON(SESSION_KEY, s);
    this.listeners.forEach((l) => l(s));
  }
  private need<R extends Session['role']>(role: R): Extract<Session, { role: R }> {
    const s = this.session();
    if (!s || s.role !== role) throw new BackendError('permission', 'Du behöver logga in igen.');
    return s as Extract<Session, { role: R }>;
  }
  private teacherClass(db: DB, classId: string) {
    const t = this.need('teacher');
    const c = db.classes.find((x) => x.id === classId);
    if (!c || c.teacherId !== t.uid) throw new BackendError('permission', 'Du har inte tillgång till klassen.');
    return c;
  }

  onSession(cb: (s: Session | null) => void) {
    this.listeners.add(cb);
    cb(this.session());
    return () => {
      this.listeners.delete(cb);
    };
  }

  async signUp(role: 'teacher' | 'parent', name: string, email: string, password: string) {
    const db = this.db();
    const e = email.trim().toLowerCase();
    if (db.users.some((u) => u.email === e)) throw new BackendError('auth/exists', 'Det finns redan ett konto med den e-postadressen.');
    if (password.length < 8) throw new BackendError('auth/weak', 'Lösenordet behöver vara minst 8 tecken.');
    const user: User = { uid: id(), role, name: name.trim(), email: e, pw: await hash(password) };
    db.users.push(user);
    this.save(db);
    this.setSession({ role, uid: user.uid, name: user.name, email: e });
  }

  async signIn(email: string, password: string) {
    const db = this.db();
    const u = db.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u || u.pw !== (await hash(password))) throw new BackendError('auth/invalid', 'Fel e-postadress eller lösenord.');
    this.setSession({ role: u.role, uid: u.uid, name: u.name, email: u.email });
  }

  async resetPassword() {
    throw new BackendError('config', 'I demoläget finns ingen e-post. Skapa ett nytt konto i stället.');
  }

  async studentSignIn(code: string) {
    const db = this.db();
    const c = normalizeCode(code);
    const entry = Object.entries(db.codes).find(([, v]) => v.loginCode === c);
    if (!entry) throw new BackendError('code/unknown', 'Koden finns inte. Kontrollera att den är rätt skriven.');
    this.setSession({ role: 'student', uid: 'elev-' + entry[0], classId: entry[1].classId, studentId: entry[0] });
  }

  async signOut() {
    this.setSession(null);
  }

  /* ---------- Lärare ---------- */
  async listClasses() {
    const t = this.need('teacher');
    return this.db()
      .classes.filter((c) => c.teacherId === t.uid)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
  async createClass(name: string, grade: Grade) {
    const t = this.need('teacher');
    const db = this.db();
    const c: ClassRoom = { id: id(), name: name.trim(), grade, teacherId: t.uid, createdAt: Date.now() };
    db.classes.push(c);
    this.save(db);
    return c;
  }
  async updateClass(classId: string, patch: Partial<Pick<ClassRoom, 'name' | 'grade'>>) {
    const db = this.db();
    Object.assign(this.teacherClass(db, classId), patch);
    this.save(db);
  }
  async deleteClass(classId: string) {
    const db = this.db();
    this.teacherClass(db, classId);
    const sids = db.students.filter((s) => s.classId === classId).map((s) => s.id);
    db.classes = db.classes.filter((c) => c.id !== classId);
    db.students = db.students.filter((s) => s.classId !== classId);
    db.assignments = db.assignments.filter((a) => a.classId !== classId);
    db.wordlists = db.wordlists.filter((w) => w.classId !== classId);
    db.parentLinks = db.parentLinks.filter((p) => p.classId !== classId);
    sids.forEach((s) => delete db.codes[s]);
    this.save(db);
  }
  async getClass(classId: string) {
    const s = this.session();
    const db = this.db();
    const c = db.classes.find((x) => x.id === classId) ?? null;
    if (!c || !s) return null;
    if (s.role === 'teacher' && c.teacherId !== s.uid) return null;
    if (s.role === 'student' && s.classId !== classId) return null;
    if (s.role === 'parent' && !db.parentLinks.some((p) => p.uid === s.uid && p.classId === classId)) return null;
    return c;
  }

  async listStudents(classId: string) {
    const db = this.db();
    this.teacherClass(db, classId);
    return db.students.filter((s) => s.classId === classId).sort((a, b) => a.alias.localeCompare(b.alias, 'sv'));
  }
  async addStudents(classId: string, list: { alias: string; avatar: Student['avatar'] }[]) {
    const db = this.db();
    this.teacherClass(db, classId);
    for (const s of list) {
      const st: Student = { id: id(), classId, alias: s.alias.trim(), avatar: s.avatar, progress: {}, createdAt: Date.now() };
      db.students.push(st);
      db.codes[st.id] = { classId, loginCode: makeCode(), parentCode: makeCode() };
    }
    this.save(db);
  }
  async updateStudent(classId: string, sid: string, patch: Partial<Pick<Student, 'alias' | 'avatar'>>) {
    const db = this.db();
    this.teacherClass(db, classId);
    const st = db.students.find((s) => s.id === sid && s.classId === classId);
    if (st) Object.assign(st, patch);
    this.save(db);
  }
  async removeStudent(classId: string, sid: string) {
    const db = this.db();
    this.teacherClass(db, classId);
    db.students = db.students.filter((s) => s.id !== sid);
    db.parentLinks = db.parentLinks.filter((p) => p.studentId !== sid);
    delete db.codes[sid];
    this.save(db);
  }
  async getCodes(classId: string) {
    const db = this.db();
    this.teacherClass(db, classId);
    const out: Record<string, StudentCodes> = {};
    for (const [sid, c] of Object.entries(db.codes)) if (c.classId === classId) out[sid] = { loginCode: c.loginCode, parentCode: c.parentCode };
    return out;
  }
  async renewCodes(classId: string, sid: string) {
    const db = this.db();
    this.teacherClass(db, classId);
    const codes = { loginCode: makeCode(), parentCode: makeCode() };
    db.codes[sid] = { classId, ...codes };
    this.save(db);
    return codes;
  }

  private canRead(db: DB, classId: string) {
    const s = this.session();
    if (!s) return false;
    if (s.role === 'teacher') return db.classes.some((c) => c.id === classId && c.teacherId === s.uid);
    if (s.role === 'student') return s.classId === classId;
    return db.parentLinks.some((p) => p.uid === s.uid && p.classId === classId);
  }

  async listAssignments(classId: string) {
    const db = this.db();
    if (!this.canRead(db, classId)) throw new BackendError('permission', 'Ingen tillgång.');
    return db.assignments.filter((a) => a.classId === classId).sort((a, b) => b.createdAt - a.createdAt);
  }
  async saveAssignment(classId: string, a: Omit<Assignment, 'id' | 'classId' | 'createdAt'> & { id?: string }) {
    const db = this.db();
    this.teacherClass(db, classId);
    const existing = a.id ? db.assignments.find((x) => x.id === a.id) : undefined;
    const out: Assignment = { ...existing, ...a, id: a.id ?? id(), classId, createdAt: existing?.createdAt ?? Date.now() } as Assignment;
    db.assignments = [...db.assignments.filter((x) => x.id !== out.id), out];
    this.save(db);
    return out;
  }
  async deleteAssignment(classId: string, aid: string) {
    const db = this.db();
    this.teacherClass(db, classId);
    db.assignments = db.assignments.filter((a) => a.id !== aid);
    this.save(db);
  }

  async saveQuizResult(classId: string, r: Omit<QuizResult, 'id' | 'classId'>) {
    const db = this.db();
    this.teacherClass(db, classId);
    db.quizResults = [...db.quizResults, { ...r, id: id(), classId }];
    this.save(db);
  }
  async listQuizResults(classId: string) {
    const db = this.db();
    this.teacherClass(db, classId);
    return db.quizResults.filter((q) => q.classId === classId).sort((a, b) => b.at - a.at);
  }

  async listWordLists(classId: string) {
    const db = this.db();
    if (!this.canRead(db, classId)) throw new BackendError('permission', 'Ingen tillgång.');
    return db.wordlists.filter((w) => w.classId === classId).sort((a, b) => b.createdAt - a.createdAt);
  }
  async saveWordList(classId: string, w: Omit<WordListDoc, 'id' | 'classId' | 'createdAt'> & { id?: string }) {
    const db = this.db();
    this.teacherClass(db, classId);
    const existing = w.id ? db.wordlists.find((x) => x.id === w.id) : undefined;
    const out: WordListDoc = { ...w, id: w.id ?? id(), classId, createdAt: existing?.createdAt ?? Date.now() };
    db.wordlists = [...db.wordlists.filter((x) => x.id !== out.id), out];
    this.save(db);
    return out;
  }
  async deleteWordList(classId: string, wid: string) {
    const db = this.db();
    this.teacherClass(db, classId);
    db.wordlists = db.wordlists.filter((w) => w.id !== wid);
    this.save(db);
  }

  /* ---------- Elev ---------- */
  async getStudent(classId: string, sid: string) {
    const db = this.db();
    const s = this.session();
    const st = db.students.find((x) => x.id === sid && x.classId === classId) ?? null;
    if (!st || !s) return null;
    if (s.role === 'student' && s.studentId !== sid) return null;
    if (s.role === 'parent' && !db.parentLinks.some((p) => p.uid === s.uid && p.studentId === sid)) return null;
    if (s.role === 'teacher' && !db.classes.some((c) => c.id === classId && c.teacherId === s.uid)) return null;
    return st;
  }
  async reportResult(classId: string, sid: string, aid: string, item: number, score: number, max: number) {
    const me = this.need('student');
    if (me.studentId !== sid) throw new BackendError('permission', 'Ingen tillgång.');
    const db = this.db();
    const st = db.students.find((x) => x.id === sid && x.classId === classId);
    if (!st) return;
    const prev = st.progress[aid]?.[item];
    st.progress[aid] = { ...st.progress[aid], [item]: { best: Math.max(prev?.best ?? 0, score), max, tries: (prev?.tries ?? 0) + 1, at: Date.now() } };
    st.lastActive = Date.now();
    this.save(db);
  }

  /* ---------- Förälder ---------- */
  async linkChild(code: string) {
    const p = this.need('parent');
    const db = this.db();
    const c = normalizeCode(code);
    const entry = Object.entries(db.codes).find(([, v]) => v.parentCode === c);
    if (!entry) throw new BackendError('code/unknown', 'Föräldrakoden finns inte. Kontrollera att den är rätt skriven.');
    if (!db.parentLinks.some((l) => l.uid === p.uid && l.studentId === entry[0])) db.parentLinks.push({ uid: p.uid, classId: entry[1].classId, studentId: entry[0] });
    this.save(db);
  }
  async unlinkChild(sid: string) {
    const p = this.need('parent');
    const db = this.db();
    db.parentLinks = db.parentLinks.filter((l) => !(l.uid === p.uid && l.studentId === sid));
    this.save(db);
  }
  async listChildren(): Promise<ChildLink[]> {
    const p = this.need('parent');
    const db = this.db();
    return db.parentLinks
      .filter((l) => l.uid === p.uid)
      .map((l) => {
        const student = db.students.find((s) => s.id === l.studentId);
        const cls = db.classes.find((c) => c.id === l.classId);
        return student && cls ? { classId: l.classId, studentId: l.studentId, student, className: cls.name, grade: cls.grade } : null;
      })
      .filter((x): x is ChildLink => !!x);
  }
}
