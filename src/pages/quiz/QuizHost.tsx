import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { play } from '../../lib/sound';
import { readJSON, writeJSON } from '../../lib/storage';
import { hrefFor, useRouter } from '../../lib/router';
import { VisualView } from '../../play/VisualView';
import {
  activePlayers,
  addPlayer,
  allAnswered,
  answer,
  counts,
  formatQuizCode,
  next,
  openQuestion,
  publicState,
  ranking,
  removePlayer,
  reveal,
  showScores,
  startGame,
  subjectName,
  summary,
  type Game,
} from '../../quiz/game';
import { rehostQuiz, type HostLink } from '../../quiz/link';
import { ANSWER_NAMES, OptionContent, Shape, TimeBar } from './parts';

export const HOST_KEY = 'quiz-vard';
const READY_MS = 3000;

/** Lärarens skärm (tavlan): kod, frågor, svar och ställning. */
export default function QuizHost() {
  const { navigate } = useRouter();
  const [game, setGame] = useState<Game | null>(() => readJSON<Game | null>(HOST_KEY, null, 'session'));
  const link = useRef<HostLink | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Anslut till kanalen och ta emot elevernas namn och svar.
  const code = game?.code;
  useEffect(() => {
    if (!code) return;
    let alive = true;
    let off: (() => void) | undefined;
    rehostQuiz(code)
      .then((l) => {
        if (!alive) return l.close();
        link.current = l;
        off = l.onMessage((m) => {
          setGame((g) => {
            if (!g) return g;
            if (m.t === 'join') {
              const n = addPlayer(g, m.pid, m.name);
              if (n !== g && !g.players[m.pid]) play('pop');
              return n;
            }
            if (m.t === 'answer') return answer(g, m.pid, m.index, m.choice, m.ms);
            return g;
          });
        });
        setGame((g) => (g ? { ...g } : g)); // skicka ut läget direkt
      })
      .catch((e: Error) => setLinkError(e.message || 'Kunde inte ansluta.'));
    return () => {
      alive = false;
      off?.();
      link.current?.close();
      link.current = null;
    };
  }, [code]);

  // Varje ändring skickas till eleverna och sparas, så att en omladdning inte förstör quizet.
  useEffect(() => {
    if (!game) return;
    writeJSON(HOST_KEY, game, 'session');
    link.current?.publish(publicState(game));
  }, [game]);

  // Tider: "gör er redo" → fråga → tiden ute.
  const phase = game?.phase;
  const step = game?.step;
  useEffect(() => {
    if (!game) return;
    if (phase === 'ready') {
      const t = setTimeout(() => setGame((g) => (g ? openQuestion(g) : g)), READY_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'question') {
      const t = setTimeout(() => setGame((g) => (g && g.step === step ? reveal(g) : g)), game.limitMs);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step]);

  // Alla har svarat: visa svaret direkt i stället för att vänta ut tiden.
  const everyone = game ? game.phase === 'question' && allAnswered(game) : false;
  useEffect(() => {
    if (!everyone) return;
    const t = setTimeout(() => setGame((g) => (g ? reveal(g) : g)), 700);
    return () => clearTimeout(t);
  }, [everyone]);

  useEffect(() => {
    if (phase === 'end') play('win');
  }, [phase]);

  const advance = () =>
    setGame((g) => {
      if (!g) return g;
      if (g.phase === 'lobby') return startGame(g);
      if (g.phase === 'question') return reveal(g);
      if (g.phase === 'reveal') return showScores(g);
      if (g.phase === 'scores') return next(g);
      return g;
    });

  // Mellanslag, Enter eller en presentationsklicker går vidare.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, button, a')) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const quit = () => {
    link.current?.end();
    link.current = null;
    try {
      sessionStorage.removeItem('leklandet:' + HOST_KEY);
    } catch {
      /* inget att göra */
    }
    setGame(null);
    navigate('/quiz');
  };

  if (!game) {
    return (
      <div className="qz qz-host qz-center">
        <h1>Inget quiz pågår</h1>
        <button className="btn btn-big" onClick={() => navigate('/quiz')}>
          Skapa ett quiz
        </button>
      </div>
    );
  }

  const q = game.questions[game.index];
  const players = activePlayers(game);
  const answeredCount = players.filter((p) => p.answers[game.index]).length;

  return (
    <div className={`qz qz-host phase-${game.phase}`}>
      <header className="qz-bar">
        <span className="qz-brand">Lärlabbet · Klassquiz</span>
        {game.phase !== 'lobby' && game.phase !== 'end' && (
          <span className="qz-progress">
            Fråga {game.index + 1} av {game.questions.length}
          </span>
        )}
        <span className="qz-code-small">
          Kod <b>{formatQuizCode(game.code)}</b>
        </span>
        <button className="qz-quit" onClick={() => (game.phase === 'end' || confirmQuit() ? quit() : undefined)}>
          Avsluta
        </button>
      </header>
      {linkError && <p className="qz-error">{linkError}</p>}

      {game.phase === 'lobby' && <Lobby game={game} onRemove={(id) => setGame((g) => (g ? removePlayer(g, id) : g))} onStart={advance} />}

      {game.phase === 'ready' && (
        <main className="qz-center qz-ready">
          <p className="qz-kicker">
            {subjectName(q.subject)} · {q.topic}
          </p>
          <h1 className="qz-big-prompt">{q.prompt}</h1>
          <div className="qz-count-ring" aria-hidden="true">
            <span key={game.step} />
          </div>
        </main>
      )}

      {(game.phase === 'question' || game.phase === 'reveal') && (
        <main className={`qz-question${q.visual ? '' : ' no-visual'}`}>
          <div className="qz-q-head">
            <h1 className="qz-prompt">{q.prompt}</h1>
            {q.detail && <p className="qz-detail">{q.detail.replace(/__/g, '___')}</p>}
          </div>
          <div className="qz-q-middle">
            {game.phase === 'question' ? (
              <Countdown ms={game.limitMs} k={game.step} />
            ) : (
              <span className="qz-side-stat" />
            )}
            {q.visual ? (
              <div className="qz-visual">
                <VisualView v={q.visual} />
              </div>
            ) : game.phase === 'reveal' ? (
              <Distribution game={game} />
            ) : (
              <span />
            )}
            <div className="qz-side-stat">
              <b>{answeredCount}</b>
              <span>av {players.length} har svarat</span>
            </div>
          </div>
          {game.phase === 'question' && <TimeBar ms={game.limitMs} k={game.step} />}
          {game.phase === 'reveal' && q.visual && <Distribution game={game} />}
          <ol className={`qz-answers n${q.options.length}${game.phase === 'reveal' ? ' revealed' : ''}`}>
            {q.options.map((o, i) => (
              <li key={i} className={`qz-ans a${i}${game.phase === 'reveal' ? (i === q.answer ? ' right' : ' wrong') : ''}`} aria-label={`${ANSWER_NAMES[i]}: ${o.label}`}>
                <Shape i={i} />
                <OptionContent o={o} />
                {game.phase === 'reveal' && i === q.answer && <span className="qz-check">Rätt svar</span>}
              </li>
            ))}
          </ol>
          {game.phase === 'reveal' && q.explain && <p className="qz-explain">{q.explain}</p>}
          <div className="qz-actions">
            {game.phase === 'question' ? (
              <button className="qz-btn ghost" onClick={advance}>
                Visa svaret nu
              </button>
            ) : (
              <button className="qz-btn" onClick={advance} autoFocus>
                Visa ställningen
              </button>
            )}
          </div>
        </main>
      )}

      {game.phase === 'scores' && (
        <main className="qz-center qz-scores">
          <h1>Ställning</h1>
          <Leaderboard game={game} limit={5} />
          <button className="qz-btn" onClick={advance} autoFocus>
            {game.index + 1 >= game.questions.length ? 'Visa vinnarna' : 'Nästa fråga'}
          </button>
        </main>
      )}

      {game.phase === 'end' && <End game={game} onNew={quit} onAgain={() => setGame((g) => (g ? { ...g, phase: 'lobby', index: 0, step: g.step + 1, prevRanks: {}, players: Object.fromEntries(Object.entries(g.players).map(([id, p]) => [id, { ...p, score: 0, streak: 0, answers: {} }])) } : g))} />}
    </div>
  );
}

function confirmQuit() {
  // window.confirm är okej här: det är lärarens skärm och ett medvetet val.
  return window.confirm('Avsluta quizet för alla?');
}

function Countdown({ ms, k }: { ms: number; k: number }) {
  const [left, setLeft] = useState(Math.ceil(ms / 1000));
  useEffect(() => {
    const start = Date.now();
    setLeft(Math.ceil(ms / 1000));
    const t = setInterval(() => setLeft(Math.max(0, Math.ceil((ms - (Date.now() - start)) / 1000))), 200);
    return () => clearInterval(t);
  }, [ms, k]);
  return (
    <div className={`qz-timer${left <= 5 ? ' low' : ''}`} role="timer" aria-label={`${left} sekunder kvar`}>
      {left}
    </div>
  );
}

function Lobby({ game, onRemove, onStart }: { game: Game; onRemove: (id: string) => void; onStart: () => void }) {
  const players = activePlayers(game);
  const joinPath = `/quiz/${game.code}`;
  const url = new URL(hrefFor(joinPath), window.location.href).href;
  const shortUrl = new URL(hrefFor('/quiz/spela'), window.location.href).href.replace(/^https?:\/\//, '');
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#1E1442', light: '#FFFFFF' } }).then(setQr);
  }, [url]);
  return (
    <main className="qz-lobby">
      <div className="qz-join">
        <div>
          <p className="qz-kicker">Gå in på</p>
          <p className="qz-url">{shortUrl}</p>
          <p className="qz-kicker">och skriv koden</p>
          <p className="qz-code" aria-label={`Koden är ${game.code.split('').join(' ')}`}>
            {formatQuizCode(game.code)}
          </p>
        </div>
        {qr && <span className="qz-qr" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR-kod till quizet" role="img" />}
      </div>
      <div className="qz-lobby-info">
        <h1>{game.title}</h1>
        <p>
          {game.questions.length} frågor · {game.limitMs / 1000} sekunder per fråga
        </p>
      </div>
      <div className="qz-players" aria-live="polite">
        {players.length === 0 ? (
          <p className="qz-wait">Väntar på att eleverna ska gå med …</p>
        ) : (
          <ul>
            {players.map((p) => (
              <li key={p.id} className="pop">
                <span>{p.name}</span>
                <button className="qz-kick" aria-label={`Ta bort ${p.name}`} onClick={() => onRemove(p.id)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="qz-lobby-foot">
        <span className="qz-count">
          <b>{players.length}</b> {players.length === 1 ? 'elev' : 'elever'}
        </span>
        <button className="qz-btn big" onClick={onStart} disabled={players.length === 0}>
          Starta
        </button>
      </div>
    </main>
  );
}

function Distribution({ game }: { game: Game }) {
  const c = counts(game);
  const max = Math.max(1, ...c);
  const q = game.questions[game.index];
  return (
    <div className={`qz-dist n${c.length}`} aria-label="Så här svarade klassen">
      {c.map((n, i) => (
        <div key={i} className={`qz-dist-col a${i}${i === q.answer ? ' right' : ''}`}>
          <span className="qz-dist-n">{n}</span>
          <span className="qz-dist-bar" style={{ height: `${8 + (n / max) * 100}px` }} />
          <Shape i={i} size={22} />
        </div>
      ))}
    </div>
  );
}

function Leaderboard({ game, limit }: { game: Game; limit: number }) {
  const rows = ranking(game).slice(0, limit);
  return (
    <ol className="qz-board">
      {rows.map((r) => {
        const before = game.prevRanks[r.id];
        const climbed = before && before > r.rank;
        const last = game.players[r.id].answers[game.index];
        return (
          <li key={r.id} className="slide-in">
            <span className="qz-rank">{r.rank}</span>
            <span className="qz-name">
              {r.name}
              {r.streak >= 3 && <small className="qz-streak">{r.streak} rätt i rad</small>}
              {climbed && <small className="qz-up">upp {before - r.rank}</small>}
            </span>
            {last?.gained ? <span className="qz-gain">+{last.gained}</span> : <span />}
            <span className="qz-score">{r.score}</span>
          </li>
        );
      })}
    </ol>
  );
}

function End({ game, onNew, onAgain }: { game: Game; onNew: () => void; onAgain: () => void }) {
  const top = ranking(game).slice(0, 3);
  const [showSummary, setShowSummary] = useState(false);
  const sum = summary(game);
  const hard = sum.filter((s) => s.share < 0.5);
  const order = [1, 0, 2].filter((i) => top[i]);
  return (
    <main className="qz-end">
      <h1>Bra jobbat, alla!</h1>
      <div className="qz-podium">
        {order.map((i) => (
          <div key={top[i].id} className={`qz-step p${i + 1}`}>
            <span className="qz-step-name">{top[i].name}</span>
            <span className="qz-step-score">{top[i].score} poäng</span>
            <span className="qz-step-block">{top[i].rank}</span>
          </div>
        ))}
      </div>
      <div className="qz-actions">
        <button className="qz-btn ghost" onClick={() => setShowSummary(!showSummary)} aria-expanded={showSummary}>
          {showSummary ? 'Dölj' : 'Visa'} resultat per fråga
        </button>
        <button className="qz-btn ghost" onClick={onAgain}>
          Spela samma frågor igen
        </button>
        <button className="qz-btn" onClick={onNew}>
          Nytt quiz
        </button>
      </div>
      {showSummary && (
        <section className="qz-summary" aria-label="Resultat per fråga">
          <p>
            {hard.length === 0 ? 'Mer än hälften av klassen hade rätt på alla frågor.' : `${hard.length} ${hard.length === 1 ? 'fråga' : 'frågor'} hade färre än hälften rätt på. De kan vara bra att gå igenom.`}
          </p>
          <ol>
            {sum.map((s) => (
              <li key={s.i} className={s.share < 0.5 ? 'hard' : ''}>
                <span className="qz-sum-bar" style={{ ['--share' as string]: s.share }} aria-hidden="true" />
                <span className="qz-sum-text">
                  {s.q.prompt}
                  {s.q.detail ? ` ${s.q.detail}` : ''} <small>Svar: {s.q.options[s.q.answer].hideLabel ? ANSWER_NAMES[s.q.answer] : s.q.options[s.q.answer].label}</small>
                </span>
                <b>{Math.round(s.share * 100)} %</b>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
