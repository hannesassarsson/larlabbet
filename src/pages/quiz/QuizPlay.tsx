import { useEffect, useRef, useState, type FormEvent } from 'react';
import { modeForGrade, setMode } from '../../lib/mode';
import { play } from '../../lib/sound';
import { Link, useRouter } from '../../lib/router';
import { VisualView } from '../../play/VisualView';
import { cleanName, formatQuizCode, funName, isQuizCode, NAME_MAX, type PublicState } from '../../quiz/game';
import { joinQuiz, type PlayerLink } from '../../quiz/link';
import { ANSWER_NAMES, OptionContent, Shape, TimeBar } from './parts';

const nameKey = (code: string) => `larlabbet-quiz-namn-${code}`;
function savedName(code: string) {
  try {
    return sessionStorage.getItem(nameKey(code)) ?? '';
  } catch {
    return '';
  }
}

/** Startsidan för elever: skriv in sifferkoden. */
export function QuizJoin() {
  const { navigate } = useRouter();
  const [code, setCode] = useState('');
  const clean = code.replace(/\D/g, '').slice(0, 6);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (isQuizCode(clean)) navigate(`/quiz/${clean}`);
  };
  return (
    <div className="qz qz-player qz-center">
      <form className="qz-join-form" onSubmit={submit}>
        <h1>Gå med i quiz</h1>
        <label htmlFor="qz-code">Skriv koden som står på tavlan</label>
        <input
          id="qz-code"
          className="qz-code-input"
          inputMode="numeric"
          autoComplete="off"
          placeholder="123 456"
          value={clean.length > 3 ? formatQuizCode(clean.padEnd(6, ' ')).trim() : clean}
          onChange={(e) => setCode(e.target.value)}
          maxLength={7}
          autoFocus
        />
        <button className="qz-btn big" type="submit" disabled={!isQuizCode(clean)}>
          Gå med
        </button>
        <Link to="/start" className="qz-link">
          Tillbaka
        </Link>
      </form>
    </div>
  );
}

/** Elevens platta under quizet. */
export default function QuizPlay({ code }: { code: string }) {
  const [state, setState] = useState<PublicState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const link = useRef<PlayerLink | null>(null);
  const [name, setName] = useState(() => savedName(code));
  const [sentName, setSentName] = useState(() => savedName(code));
  // Elevens val per fråga, och när frågan dök upp på den här plattan.
  const [chosen, setChosen] = useState<Record<number, number>>({});
  const shownAt = useRef<{ step: number; at: number }>({ step: -1, at: 0 });

  useEffect(() => {
    let alive = true;
    let off: (() => void) | undefined;
    joinQuiz(code)
      .then(({ link: l, state: s }) => {
        if (!alive) return l.close();
        link.current = l;
        setState(s);
        off = l.onState((st) => alive && setState(st));
        const n = savedName(code);
        if (n) l.send({ t: 'join', pid: l.pid, name: n });
      })
      .catch((e: Error) => alive && setError(e.message || 'Kunde inte ansluta.'));
    return () => {
      alive = false;
      off?.();
      link.current?.close();
    };
  }, [code]);

  // Samma utseende som delen eleverna går i: Leklabbet för F–3, Lärlabbet för 4–6.
  useEffect(() => {
    if (state) setMode(modeForGrade(state.grade));
  }, [state?.grade]); // eslint-disable-line react-hooks/exhaustive-deps

  const pid = link.current?.pid ?? '';
  const me = state?.players[pid];

  // Starttid för frågan räknas från när den syns här, så att klockorna inte behöver gå lika.
  if (state && state.phase === 'question' && shownAt.current.step !== state.step) shownAt.current = { step: state.step, at: Date.now() };

  // Ny omgång (läraren spelar samma frågor igen): glöm förra omgångens svar.
  useEffect(() => {
    if (state?.phase === 'lobby') setChosen({});
  }, [state?.phase]);

  // Ljud när svaret visas.
  const lastStep = useRef(-1);
  useEffect(() => {
    if (!state || !me || state.phase !== 'reveal' || lastStep.current === state.step) return;
    lastStep.current = state.step;
    play(me.last?.correct ? 'good' : 'oops');
  }, [state, me]);

  if (error) {
    return (
      <div className="qz qz-player qz-center">
        <h1>Hittade inget quiz</h1>
        <p role="alert">{error}</p>
        <Link to="/quiz/spela" className="qz-btn big">
          Försök igen
        </Link>
      </div>
    );
  }
  if (!state) {
    return (
      <div className="qz qz-player qz-center">
        <p className="qz-wait">Ansluter till quiz {formatQuizCode(code)} …</p>
      </div>
    );
  }

  if (state.removed.includes(pid)) {
    return (
      <div className="qz qz-player qz-center">
        <h1>Du är inte med i quizet</h1>
        <p>Läraren har tagit bort dig. Prata med din lärare om du vill vara med.</p>
      </div>
    );
  }

  const sendName = (e: FormEvent) => {
    e.preventDefault();
    const n = cleanName(name);
    if (!n || !link.current) return;
    try {
      sessionStorage.setItem(nameKey(code), n);
    } catch {
      /* fungerar ändå */
    }
    setSentName(n);
    link.current.send({ t: 'join', pid, name: n });
  };

  if (!me) {
    if (sentName && state.phase !== 'lobby') {
      return (
        <div className="qz qz-player qz-center">
          <p className="qz-wait">Quizet har redan börjat. Du kommer med från nästa fråga …</p>
        </div>
      );
    }
    return (
      <div className="qz qz-player qz-center">
        <form className="qz-join-form" onSubmit={sendName}>
          <p className="qz-kicker">Quiz {formatQuizCode(code)}</p>
          <h1>Vad heter du?</h1>
          <label htmlFor="qz-name" className="sr-only">
            Ditt namn
          </label>
          <input id="qz-name" className="qz-name-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} autoComplete="off" autoFocus placeholder="Ditt namn" />
          <button type="button" className="qz-link" onClick={() => setName(funName())}>
            Hitta på ett namn åt mig
          </button>
          <button className="qz-btn big" type="submit" disabled={!cleanName(name) || (!!sentName && sentName === cleanName(name))}>
            {sentName && sentName === cleanName(name) ? 'Går med …' : 'Kör!'}
          </button>
        </form>
      </div>
    );
  }

  const q = state.question;
  const mine = chosen[state.index];
  const pick = (i: number) => {
    if (state.phase !== 'question' || mine !== undefined || !link.current) return;
    play('tap');
    setChosen({ ...chosen, [state.index]: i });
    link.current.send({ t: 'answer', pid, index: state.index, choice: i, ms: Date.now() - shownAt.current.at });
  };

  return (
    <div className={`qz qz-player phase-${state.phase}`}>
      <header className="qz-bar">
        <span className="qz-me">{me.name}</span>
        {state.phase !== 'lobby' && state.phase !== 'end' && (
          <span className="qz-progress">
            {state.index + 1} / {state.total}
          </span>
        )}
        <span className="qz-points">{me.score} p</span>
      </header>

      {state.phase === 'lobby' && (
        <main className="qz-center">
          <h1>Du är med!</h1>
          <p>Ser du ditt namn på tavlan? Snart börjar det.</p>
          <p className="qz-wait">Väntar på läraren …</p>
        </main>
      )}

      {state.phase === 'ready' && (
        <main className="qz-center">
          <p className="qz-kicker">Fråga {state.index + 1}</p>
          <h1>Gör dig redo!</h1>
          {state.showOnDevice && <p className="qz-device-prompt">{q.prompt}</p>}
        </main>
      )}

      {state.phase === 'question' &&
        (mine === undefined ? (
          <main className="qz-pick">
            {state.showOnDevice && (
              <div className="qz-pick-head">
                <p className="qz-device-prompt">{q.prompt}</p>
                {q.detail && <p className="qz-detail">{q.detail.replace(/__/g, '___')}</p>}
                {q.visual && (
                  <div className="qz-visual small">
                    <VisualView v={q.visual} />
                  </div>
                )}
              </div>
            )}
            <TimeBar ms={state.limitMs} k={state.step} />
            <div className={`qz-pick-grid n${q.options.length}`}>
              {q.options.map((o, i) => (
                <button key={i} className={`qz-ans a${i}`} onClick={() => pick(i)} aria-label={state.showOnDevice ? `${ANSWER_NAMES[i]}: ${o.label}` : ANSWER_NAMES[i]}>
                  <Shape i={i} size={44} />
                  {state.showOnDevice && <OptionContent o={o} />}
                </button>
              ))}
            </div>
          </main>
        ) : (
          <main className="qz-center">
            <div className={`qz-picked a${mine}`}>
              <Shape i={mine} size={64} />
            </div>
            <h1>Svar skickat!</h1>
            <p className="qz-wait">Väntar på de andra …</p>
          </main>
        ))}

      {(state.phase === 'reveal' || state.phase === 'scores') && (
        <main className={`qz-center qz-result ${me.last?.correct ? 'right' : 'wrong'}`} aria-live="polite">
          <h1>{me.last?.correct ? 'Rätt!' : mine === undefined ? 'Tiden tog slut' : 'Fel den här gången'}</h1>
          {me.last?.correct ? (
            <p className="qz-gained">+{me.last.gained} poäng</p>
          ) : (
            q.answer !== undefined && (
              <p className="qz-right-was">
                Rätt svar: <Shape i={q.answer} size={22} /> {q.options[q.answer].hideLabel ? ANSWER_NAMES[q.answer] : q.options[q.answer].label}
              </p>
            )
          )}
          {me.streak >= 2 && <p className="qz-streak">{me.streak} rätt i rad!</p>}
          <p className="qz-place">
            Du är på plats <b>{me.rank}</b> av {state.playerCount}
          </p>
        </main>
      )}

      {state.phase === 'end' && (
        <main className="qz-center qz-final">
          <p className="qz-kicker">Quizet är slut</p>
          <h1>{me.rank === 1 ? 'Du vann!' : me.rank <= 3 ? `Plats ${me.rank}!` : 'Bra kämpat!'}</h1>
          <p className="qz-place">
            <b>{me.score}</b> poäng · plats {me.rank} av {state.playerCount}
          </p>
          <Link to={state.grade <= 3 ? '/lek' : '/lar'} className="qz-btn">
            Till startsidan
          </Link>
        </main>
      )}
    </div>
  );
}
