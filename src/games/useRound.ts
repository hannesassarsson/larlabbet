import { useEffect, useRef, useState } from 'react';
import { starsFrom, type Phase } from '../components/GameShell';
import { play } from '../lib/sound';
import { saveResult, useSessionState } from '../lib/storage';

/**
 * Gemensam motor för frågebaserade spel (Bokstavsjakten, Matteäventyret,
 * Mönsterdetektiven, Sant eller falskt). Sköter omgång, poäng, återkoppling,
 * spärr mot dubbeltryck och sparande av resultat. Spelen ritar själva.
 */
export interface RoundState<Q, L> {
  phase: Phase;
  level: L;
  questions: Q[];
  index: number;
  score: number; // rätt på första försöket
  wrong: number[]; // felaktiga val på aktuell fråga
  solved: boolean;
  chosen: number | null;
  paused: boolean;
  record: boolean;
  streak: number;
  bestStreak: number;
}

export interface RoundOptions<Q, L> {
  key: string;
  gameId: string;
  defaultLevel: L;
  build: (level: L) => Q[];
  /** Sant eller falskt: bara ett försök, sedan visas förklaringen. */
  singleAttempt?: boolean;
  /** Gå vidare automatiskt efter rätt svar (ms). Sätt till 0 för manuell "Nästa". */
  autoAdvanceMs?: number;
}

export function useRound<Q, L extends string | number>(opts: RoundOptions<Q, L>) {
  const fresh = (level: L): RoundState<Q, L> => ({
    phase: 'intro',
    level,
    questions: [],
    index: 0,
    score: 0,
    wrong: [],
    solved: false,
    chosen: null,
    paused: false,
    record: false,
    streak: 0,
    bestStreak: 0,
  });
  const [s, setS] = useSessionState<RoundState<Q, L>>(opts.key, () => fresh(opts.defaultLevel));
  const [locked, setLocked] = useState(false);
  const timer = useRef<number>();
  const auto = opts.autoAdvanceMs ?? 1300;
  const latest = useRef(s);
  const guardUntil = useRef(0); // skydd mot dubbeltryck precis efter "Nästa"

  latest.current = s;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Om sidan laddades om precis efter ett rätt svar: gå vidare i stället för att fastna.
  useEffect(() => {
    if (s.phase === 'playing' && s.solved && auto > 0 && !s.paused) {
      timer.current = window.setTimeout(next, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = (level: L = s.level) => {
    window.clearTimeout(timer.current);
    setLocked(false);
    setS({ ...fresh(level), phase: 'playing', questions: opts.build(level) });
  };

  const finish = (st: RoundState<Q, L>) => {
    const stars = starsFrom(st.score, st.questions.length);
    const record = saveResult(opts.gameId, {
      key: String(st.level),
      score: st.score,
      better: 'higher',
      stars,
    });
    return { ...st, phase: 'done' as const, record };
  };

  function next(manual = false) {
    window.clearTimeout(timer.current);
    setLocked(false);
    const p = latest.current;
    if (p.phase !== 'playing') return;
    const index = p.index + 1;
    if (index >= p.questions.length) {
      setS(finish(p));
      return;
    }
    if (manual) guardUntil.current = Date.now() + 400;
    setS({ ...p, index, wrong: [], solved: false, chosen: null });
  }

  const answer = (optionIndex: number, correct: boolean) => {
    if (Date.now() < guardUntil.current) return;
    if (locked || s.solved || s.paused || s.phase !== 'playing' || s.wrong.includes(optionIndex)) return;
    if (correct) {
      play('good');
      const firstTry = s.wrong.length === 0;
      const streak = firstTry ? s.streak + 1 : 0;
      setS((p) => ({
        ...p,
        solved: true,
        chosen: optionIndex,
        score: p.score + (firstTry ? 1 : 0),
        streak,
        bestStreak: Math.max(p.bestStreak, streak),
      }));
      if (auto > 0) {
        setLocked(true);
        timer.current = window.setTimeout(next, auto);
      }
    } else {
      play('oops');
      if (opts.singleAttempt) {
        setS((p) => ({ ...p, solved: true, chosen: optionIndex, wrong: [optionIndex], streak: 0 }));
      } else {
        setS((p) => ({ ...p, wrong: [...p.wrong, optionIndex], streak: 0 }));
        // Kort spärr så att ett oavsiktligt dubbeltryck inte räknas som ett nytt försök.
        setLocked(true);
        timer.current = window.setTimeout(() => setLocked(false), 350);
      }
    }
  };

  return {
    s,
    setS,
    question: s.questions[s.index] as Q | undefined,
    start,
    next: () => next(true),
    answer,
    pause: () => {
      window.clearTimeout(timer.current);
      setLocked(false);
      setS((p) => ({ ...p, paused: true }));
    },
    resume: () => {
      setS((p) => ({ ...p, paused: false }));
      if (s.solved && auto > 0) timer.current = window.setTimeout(next, 500);
    },
    toIntro: () => {
      window.clearTimeout(timer.current);
      setS(fresh(s.level));
    },
    setLevel: (level: L) => setS((p) => ({ ...p, level })),
  };
}
