import type { PicId } from '../components/pictures';
import type { Grade, WordPair } from '../curriculum/types';

/**
 * Datamodell för klasser, elever, uppdrag och föräldrar.
 * Eleverna har inga namn eller e-postadresser i systemet – bara ett alias
 * som läraren väljer och en bild. Inloggning sker med en kod.
 */
export type Role = 'teacher' | 'parent' | 'student';

export type Session =
  | { role: 'teacher'; uid: string; name: string; email: string }
  | { role: 'parent'; uid: string; name: string; email: string }
  | { role: 'student'; uid: string; classId: string; studentId: string };

export interface ClassRoom {
  id: string;
  name: string;
  grade: Grade;
  teacherId: string;
  createdAt: number;
}

export interface ItemResult {
  best: number;
  max: number;
  tries: number;
  at: number;
}

export interface Student {
  id: string;
  classId: string;
  alias: string;
  avatar: PicId;
  /** progress[assignmentId][itemIndex] */
  progress: Record<string, Record<string, ItemResult>>;
  lastActive?: number;
  createdAt: number;
}

export interface StudentCodes {
  loginCode: string;
  parentCode: string;
}

export interface AssignmentItem {
  activityId: string;
  level?: string;
  count: number;
  /** Lärarens egen ordlista, för glosor. */
  wordListId?: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  message?: string;
  items: AssignmentItem[];
  /** Sista dag, YYYY-MM-DD. */
  due?: string;
  createdAt: number;
}

export interface WordListDoc {
  id: string;
  classId: string;
  title: string;
  pairs: WordPair[];
  createdAt: number;
}

/** Ett klassquiz som har spelats, sparat på klassen. Bara läraren ser det. */
export interface QuizResult {
  id: string;
  classId: string;
  title: string;
  at: number;
  /** Per fråga: hur många som svarade och hur många som hade rätt. */
  questions: { prompt: string; answer: string; right: number; answered: number }[];
  /** Per deltagare. studentId finns när eleven var inloggad med sin elevkod. */
  players: { name: string; studentId?: string; score: number; right: number; rank: number }[];
}

export interface ChildLink {
  classId: string;
  studentId: string;
  student: Student;
  className: string;
  grade: Grade;
}

export class BackendError extends Error {
  constructor(
    public code: 'auth/invalid' | 'auth/exists' | 'auth/weak' | 'code/unknown' | 'permission' | 'network' | 'not-found' | 'config',
    message: string
  ) {
    super(message);
  }
}

export interface Backend {
  mode: 'demo' | 'firebase';
  /** Prenumerera på inloggningsläget. Returnerar en avregistrering. */
  onSession(cb: (s: Session | null) => void): () => void;

  signUp(role: 'teacher' | 'parent', name: string, email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  studentSignIn(code: string): Promise<void>;
  signOut(): Promise<void>;

  // Lärare
  listClasses(): Promise<ClassRoom[]>;
  createClass(name: string, grade: Grade): Promise<ClassRoom>;
  updateClass(id: string, patch: Partial<Pick<ClassRoom, 'name' | 'grade'>>): Promise<void>;
  deleteClass(id: string): Promise<void>;
  getClass(id: string): Promise<ClassRoom | null>;

  listStudents(classId: string): Promise<Student[]>;
  addStudents(classId: string, students: { alias: string; avatar: PicId }[]): Promise<void>;
  updateStudent(classId: string, id: string, patch: Partial<Pick<Student, 'alias' | 'avatar'>>): Promise<void>;
  removeStudent(classId: string, id: string): Promise<void>;
  getCodes(classId: string): Promise<Record<string, StudentCodes>>;
  renewCodes(classId: string, studentId: string): Promise<StudentCodes>;

  listAssignments(classId: string): Promise<Assignment[]>;
  saveAssignment(classId: string, a: Omit<Assignment, 'id' | 'classId' | 'createdAt'> & { id?: string }): Promise<Assignment>;
  deleteAssignment(classId: string, id: string): Promise<void>;

  saveQuizResult(classId: string, r: Omit<QuizResult, 'id' | 'classId'>): Promise<void>;
  listQuizResults(classId: string): Promise<QuizResult[]>;

  listWordLists(classId: string): Promise<WordListDoc[]>;
  saveWordList(classId: string, w: Omit<WordListDoc, 'id' | 'classId' | 'createdAt'> & { id?: string }): Promise<WordListDoc>;
  deleteWordList(classId: string, id: string): Promise<void>;

  // Elev
  getStudent(classId: string, studentId: string): Promise<Student | null>;
  reportResult(classId: string, studentId: string, assignmentId: string, itemIndex: number, score: number, max: number): Promise<void>;

  // Förälder
  linkChild(code: string): Promise<void>;
  unlinkChild(studentId: string): Promise<void>;
  listChildren(): Promise<ChildLink[]>;
}

/** Koder utan förväxlingsbara tecken (0/O, 1/I/L). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function makeCode(length = 6): string {
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join('');
}

/** Normaliserar inmatad kod: versaler, inga mellanslag eller bindestreck. */
export const normalizeCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const formatCode = (c: string) => (c.length === 6 ? `${c.slice(0, 3)}-${c.slice(3)}` : c);

/** Sammanfattning av en elevs framsteg på ett uppdrag. */
export function assignmentProgress(student: Student, a: Assignment) {
  const p = student.progress?.[a.id] ?? {};
  const done = a.items.filter((_, i) => p[i]).length;
  const score = a.items.reduce((sum, _, i) => sum + (p[i]?.best ?? 0), 0);
  const max = a.items.reduce((sum, it, i) => sum + (p[i]?.max ?? it.count), 0);
  return { done, total: a.items.length, score, max, complete: done === a.items.length };
}
