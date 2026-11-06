import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Feedback, Overlay, Stars, starsFrom } from '../components/GameShell';
import { IconBack, IconBulb, IconPause, IconPlay, IconRestart, IconSoundOn } from '../components/Icons';
import { SoundToggle } from '../components/SoundToggle';
import { levelLabel } from '../curriculum';
import { gradeRange, subjectOf, type Activity, type ChoiceQuestion, type OrderQuestion, type Question, type SpellQuestion, type WordList } from '../curriculum/types';
import { shuffle } from '../lib/random';
import { play } from '../lib/sound';
import { canSpeak, speak, stopSpeaking } from '../lib/speech';
import { useSessionState } from '../lib/storage';
import { useMode } from '../lib/mode';
import { VisualView } from './VisualView';

export interface RunResult {
  score: number;
  max: number;
}

interface RunState {
  phase: 'intro' | 'playing' | 'done';
  questions: Question[];
  index: number;
  score: number;
  wrong: number[]; // flerval: felaktiga val på aktuell fråga
  revealed: boolean; // rätt svar visat efter två fel
  solved: boolean;
  mistakes: number; // ordning och stavning: fel på aktuell fråga
  placed: number[]; // ordning: placerade index; stavning: bricka per ruta (−1 = tom)
  tiles: string[]; // stavning: bokstäverna som brickor
  hints: number;
  paused: boolean;
  bestStreak: number;
  streak: number;
  /** Frågor som inte blev rätt på första försöket (index). */
  misses: number[];
}

const fresh = (): RunState => ({
  phase: 'intro',
  questions: [],
  index: 0,
  score: 0,
  wrong: [],
  revealed: false,
  solved: false,
  mistakes: 0,
  placed: [],
  tiles: [],
  hints: 0,
  paused: false,
  bestStreak: 0,
  streak: 0,
  misses: [],
});

const SPELL_EXTRA = 'abdefghijklmnoprstuvy'.split('');

/** Rätt svar som text, för genomgången efter en övning. */
function answerText(q: Question): string {
  if (q.kind === 'choice') return q.options[q.answer].label || 'bild';
  if (q.kind === 'order') return q.items.join(' → ');
  return q.answer;
}

function setupQuestion(q: Question | undefined): Pick<RunState, 'placed' | 'tiles'> {
  if (!q) return { placed: [], tiles: [] };
  if (q.kind === 'spell') {
    const letters = q.answer.toLocaleUpperCase('sv').split('');
    const extra = shuffle(SPELL_EXTRA.filter((l) => !q.answer.includes(l)))
      .slice(0, q.extra)
      .map((l) => l.toLocaleUpperCase('sv'));
    let tiles = shuffle([...letters, ...extra]);
    for (let i = 0; i < 4 && tiles.join('').startsWith(letters.join('')) && letters.length > 1; i++) tiles = shuffle(tiles);
    return { placed: letters.map(() => -1), tiles };
  }
  return { placed: [], tiles: [] };
}

/**
 * Spelar en aktivitet ur kursplanekatalogen: flerval, ordning eller stavning.
 * Poäng = antal frågor rätt på första försöket (utan ledtråd).
 */
export function ActivityRunner({
  activity,
  level,
  count = 10,
  wordList,
  runKey,
  heading,
  onExit,
  onFinish,
  exitLabel = 'Tillbaka',
  introExtra,
}: {
  introExtra?: ReactNode;
  activity: Activity;
  level?: string;
  count?: number;
  wordList?: WordList;
  runKey: string;
  heading?: string;
  onExit: () => void;
  onFinish?: (r: RunResult) => void;
  exitLabel?: string;
}) {
  const subject = subjectOf(activity.subject);
  const [s, setS, clear] = useSessionState<RunState>(`run:${runKey}`, fresh);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const timer = useRef<number>();
  const guard = useRef(0);
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      stopSpeaking();
    },
    []
  );

  const q = s.questions[s.index];
  const lvl = level ?? activity.defaultLevel;

  const mode = useMode();

  const startWith = (questions: Question[]) => {
    window.clearTimeout(timer.current);
    setBusy(false);
    play('pop');
    setS({ ...fresh(), phase: 'playing', questions, ...setupQuestion(questions[0]) });
  };
  const start = () => startWith(activity.generate(lvl, count, undefined, { wordList }));

  const finish = (st: RunState) => {
    const result = { score: st.score, max: st.questions.length };
    onFinish?.(result);
    setS({ ...st, phase: 'done' });
  };

  const latest = useRef(s);
  latest.current = s;

  const advance = (st: RunState) => {
    window.clearTimeout(timer.current);
    setBusy(false);
    stopSpeaking();
    const index = st.index + 1;
    if (index >= st.questions.length) return finish(st);
    setS({ ...st, index, wrong: [], revealed: false, solved: false, mistakes: 0, hints: 0, ...setupQuestion(st.questions[index]) });
  };

  const next = () => {
    if (Date.now() < guard.current) return;
    guard.current = Date.now() + 400;
    advance(s);
  };

  const markSolved = (st: RunState, clean: boolean, auto: boolean) => {
    play('good');
    const streak = clean ? st.streak + 1 : 0;
    const out = {
      ...st,
      solved: true,
      score: st.score + (clean ? 1 : 0),
      streak,
      bestStreak: Math.max(st.bestStreak, streak),
      misses: clean ? st.misses : [...st.misses, st.index],
    };
    setS(out);
    if (auto) {
      setBusy(true);
      // Läs senaste läget när tiden har gått, så att vi aldrig använder ett gammalt index.
      timer.current = window.setTimeout(() => advance(latest.current), 1200);
    }
  };

  /* ---------- Flerval ---------- */
  const choose = (i: number) => {
    if (!q || q.kind !== 'choice' || busy || s.solved || s.paused || s.wrong.includes(i) || Date.now() < guard.current) return;
    if (i === q.answer) return markSolved(s, s.wrong.length === 0, !q.explain && s.wrong.length === 0);
    play('oops');
    const wrong = [...s.wrong, i];
    // Efter två fel visas rätt svar, så att ingen fastnar.
    const reveal = wrong.length >= Math.min(2, q.options.length - 1);
    setS({ ...s, wrong, revealed: reveal, solved: reveal, streak: 0, misses: reveal ? [...s.misses, s.index] : s.misses });
    setBusy(true);
    timer.current = window.setTimeout(() => setBusy(false), 350);
  };

  /* ---------- Ordning ---------- */
  const placeOrder = (itemIndex: number) => {
    if (!q || q.kind !== 'order' || busy || s.solved || s.paused) return;
    const expected = s.placed.length;
    if (itemIndex === expected) {
      play('tap');
      const placed = [...s.placed, itemIndex];
      if (placed.length === q.items.length) return markSolved({ ...s, placed }, s.mistakes === 0, false);
      setS({ ...s, placed });
    } else {
      play('oops');
      setS({ ...s, mistakes: s.mistakes + 1, wrong: [itemIndex], streak: 0 });
      setBusy(true);
      timer.current = window.setTimeout(() => {
        setBusy(false);
        setS((p) => ({ ...p, wrong: [] }));
      }, 600);
    }
  };

  /* ---------- Stavning ---------- */
  const spellWord = (st: RunState) => st.placed.map((t) => (t >= 0 ? st.tiles[t] : '')).join('');
  const tapTile = (tile: number) => {
    if (!q || q.kind !== 'spell' || busy || s.solved || s.paused || s.placed.includes(tile) || Date.now() < guard.current) return;
    const slot = s.placed.indexOf(-1);
    if (slot < 0) return;
    play('tap');
    const placed = s.placed.slice();
    placed[slot] = tile;
    const st = { ...s, placed };
    if (placed.includes(-1)) return setS(st);
    const target = q.answer.toLocaleUpperCase('sv');
    if (spellWord(st) === target) return markSolved(st, s.mistakes === 0 && s.hints === 0, false);
    play('oops');
    const bad = placed.map((t, i) => (st.tiles[t] !== target[i] ? i : -1)).filter((i) => i >= 0);
    setS({ ...st, mistakes: s.mistakes + 1, wrong: bad, streak: 0 });
    setBusy(true);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      setS((p) => ({ ...p, placed: p.placed.map((t, i) => (bad.includes(i) ? -1 : t)), wrong: [] }));
    }, 1000);
  };
  const tapSlot = (slot: number) => {
    if (!q || q.kind !== 'spell' || busy || s.solved || s.placed[slot] < 0) return;
    play('tap');
    const placed = s.placed.slice();
    placed[slot] = -1;
    setS({ ...s, placed });
  };
  const spellHint = () => {
    if (!q || q.kind !== 'spell' || busy || s.solved) return;
    const target = q.answer.toLocaleUpperCase('sv');
    const slot = s.placed.findIndex((t, i) => t < 0 || s.tiles[t] !== target[i]);
    if (slot < 0) return;
    const locked = new Set(s.placed.filter((t, i) => t >= 0 && s.tiles[t] === target[i]));
    const tile = s.tiles.findIndex((ch, i) => ch === target[slot] && !locked.has(i));
    if (tile < 0) return;
    play('pop');
    const placed = s.placed.map((t) => (t === tile ? -1 : t));
    placed[slot] = tile;
    const st = { ...s, placed, hints: s.hints + 1 };
    if (!placed.includes(-1) && spellWord(st) === target) return markSolved(st, false, false);
    setS(st);
  };

  const sayIt = () => {
    if (!q) return;
    const parts = [q.prompt, 'detail' in q && q.detail ? q.detail : ''];
    if (q.kind === 'choice' && q.options.every((o) => o.label && !o.hideLabel)) parts.push('Är det ' + q.options.map((o) => o.label).join(', eller ') + '?');
    speak(parts.filter(Boolean).join('. '));
  };

  const accent = { ['--game' as string]: subject.color, ['--game-soft' as string]: subject.soft };

  /* ---------- Intro ---------- */
  if (s.phase === 'intro' || !q) {
    if (s.phase === 'done') return null;
    return (
      <div className="page run-intro" style={accent}>
        <div className="game-intro-top">
          <button className="icon-btn" onClick={onExit} aria-label={exitLabel}>
            <IconBack />
          </button>
          <SoundToggle />
        </div>
        <div className="card run-intro-card">
          <span className="subject-pill" style={{ background: subject.soft }}>
            {subject.short} · åk {gradeRange(activity.grades)}
          </span>
          {heading && <p className="run-heading">{heading}</p>}
          <h1>{activity.title}</h1>
          <p className="game-intro-lead">{activity.description}</p>
          <dl className="run-facts">
            <div>
              <dt>Frågor</dt>
              <dd>{count}</dd>
            </div>
            {activity.levels && !introExtra && (
              <div>
                <dt>Nivå</dt>
                <dd>{levelLabel(activity, lvl)}</dd>
              </div>
            )}
            <div>
              <dt>Kursplanen</dt>
              <dd>{activity.area}</dd>
            </div>
          </dl>
          {introExtra}
          {activity.needsWordList && !wordList?.pairs.length ? (
            <p className="notice notice-warn">Den här övningen behöver en ordlista från läraren.</p>
          ) : (
            <button className="btn btn-big" onClick={start}>
              <IconPlay /> Börja
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ---------- Slut i Lärlabbet: resultat och genomgång av fel ---------- */
  if (s.phase === 'done' && mode === 'lar') {
    const total = s.questions.length;
    const pct = total ? Math.round((s.score / total) * 100) : 0;
    const verdict = pct >= 90 ? 'Det här kan du.' : pct >= 70 ? 'Nästan där.' : 'Det här behöver du öva mer på.';
    const missed = s.misses.filter((i, k, arr) => arr.indexOf(i) === k).map((i) => s.questions[i]).filter(Boolean);
    return (
      <div className="page lar-result" style={accent}>
        <section className="card lar-result-card">
          <p className="hero-kicker">
            {subject.short} · {activity.area}
          </p>
          <h1>{activity.title}</h1>
          <div className="lar-score">
            <div className="lar-score-big">
              <b>{pct} %</b>
              <span>
                {s.score} av {total} rätt på första försöket
              </span>
            </div>
            <div className="lar-meter" role="img" aria-label={`${pct} procent rätt`}>
              <span style={{ width: `${pct}%` }} className={pct >= 90 ? 'good' : pct >= 70 ? 'mid' : 'low'} />
            </div>
            <p className="lar-verdict">{verdict}</p>
          </div>
          <div className="lar-result-actions">
            {missed.length > 0 && (
              <button className="btn btn-big" onClick={() => startWith(missed)}>
                <IconRestart /> Öva på de {missed.length} du missade
              </button>
            )}
            <button className={`btn btn-big${missed.length ? ' btn-soft' : ''}`} onClick={() => (clear(), start())}>
              Nya frågor
            </button>
            <button className="btn btn-big btn-soft" onClick={() => (clear(), onExit())}>
              <IconBack /> {exitLabel}
            </button>
          </div>
        </section>
        {missed.length > 0 && (
          <section className="card lar-review" aria-labelledby="review-h">
            <h2 id="review-h">Att titta på igen</h2>
            <ol>
              {missed.map((mq, i) => (
                <li key={i}>
                  <p className="review-q">{mq.prompt}</p>
                  {'detail' in mq && mq.detail && <p className="review-detail">{mq.detail}</p>}
                  <p className="review-a">
                    Rätt svar: <b>{answerText(mq)}</b>
                  </p>
                  {'explain' in mq && mq.explain && <p className="review-explain">{mq.explain}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    );
  }

  /* ---------- Slut ---------- */
  if (s.phase === 'done') {
    const stars = starsFrom(s.score, s.questions.length);
    return (
      <div className="game-end page" style={accent}>
        <div className="game-end-card card pop">
          <Stars count={stars} />
          <h1>{stars === 3 ? 'Toppen!' : stars === 2 ? 'Snyggt jobbat!' : 'Bra kämpat!'}</h1>
          <dl className="end-lines">
            <div>
              <dt>Rätt direkt</dt>
              <dd>
                {s.score} av {s.questions.length}
              </dd>
            </div>
            <div>
              <dt>Längsta svit</dt>
              <dd>{s.bestStreak}</dd>
            </div>
          </dl>
          <div className="overlay-actions">
            <button
              className="btn btn-big"
              onClick={() => {
                clear();
                start();
              }}
            >
              <IconRestart /> Öva igen
            </button>
            <button
              className="btn btn-big btn-soft"
              onClick={() => {
                clear();
                onExit();
              }}
            >
              <IconBack /> {exitLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Spelet ---------- */
  return (
    <div className="game-screen" style={accent}>
      <header className="game-topbar">
        <button className="icon-btn" onClick={onExit} aria-label={exitLabel}>
          <IconBack />
        </button>
        <div className="game-topbar-mid">
          <h1 className="game-topbar-title">{activity.title}</h1>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={s.questions.length} aria-valuenow={s.index + (s.solved ? 1 : 0)} aria-label="Hur långt du har kommit">
            <span style={{ width: `${((s.index + (s.solved ? 1 : 0)) / s.questions.length) * 100}%` }} />
          </div>
        </div>
        <div className="game-stats">
          <div className="stat">
            <b>
              {s.index + 1}/{s.questions.length}
            </b>
            <span>fråga</span>
          </div>
        </div>
        {canSpeak() && (
          <button className="icon-btn" onClick={sayIt} aria-label="Läs upp frågan">
            <IconSoundOn />
          </button>
        )}
        <button className="icon-btn" onClick={() => setConfirm(true)} aria-label="Börja om">
          <IconRestart />
        </button>
        <button className="icon-btn" onClick={() => setS({ ...s, paused: true })} aria-label="Pausa">
          <IconPause />
        </button>
      </header>

      <div className="game-stage run-stage" key={s.index}>
        <div className="run-prompt pop">
          <p className="run-question">{q.prompt}</p>
          {'detail' in q && q.detail && <p className="run-detail">{q.detail}</p>}
          {'visual' in q && q.visual && (
            <div className={`run-visual v-${q.visual.t}`}>
              <VisualView v={q.visual} />
            </div>
          )}
        </div>

        {q.kind === 'choice' && <ChoiceView q={q} s={s} onChoose={choose} />}
        {q.kind === 'order' && <OrderView q={q} s={s} onPick={placeOrder} />}
        {q.kind === 'spell' && <SpellView q={q} s={s} onTile={tapTile} onSlot={tapSlot} onHint={spellHint} busy={busy} />}

        <div className="feedback-slot">
          {s.solved && !s.revealed && <Feedback kind="good">{q.kind === 'choice' && q.explain ? `Rätt! ${q.explain}` : q.kind === 'order' && q.explain ? q.explain : 'Rätt!'}</Feedback>}
          {s.revealed && q.kind === 'choice' && (
            <Feedback kind="info">
              Rätt svar är {q.options[q.answer].label || 'den gröna'}. {q.explain ?? ''}
            </Feedback>
          )}
          {!s.solved && s.wrong.length > 0 && q.kind === 'choice' && <Feedback kind="oops">Inte riktigt – försök igen!</Feedback>}
          {!s.solved && s.wrong.length > 0 && q.kind === 'order' && <Feedback kind="oops">Den kommer inte än. Vilken är äldst – eller först?</Feedback>}
          {!s.solved && s.wrong.length > 0 && q.kind === 'spell' && <Feedback kind="oops">Nästan! De röda bokstäverna hoppar tillbaka.</Feedback>}
        </div>

        {s.solved && !busy && (
          <button className="btn btn-big next-btn pop" onClick={next} autoFocus>
            {s.index + 1 === s.questions.length ? 'Se resultatet' : 'Nästa'}
          </button>
        )}
      </div>

      {s.paused && (
        <Overlay label="Paus" onClose={() => setS({ ...s, paused: false })}>
          <div className="pause-badge" aria-hidden="true">
            <IconPause />
          </div>
          <h2>Paus</h2>
          <p>Övningen väntar på dig.</p>
          <div className="overlay-actions">
            <button className="btn btn-big" onClick={() => setS({ ...s, paused: false })} autoFocus>
              <IconPlay /> Fortsätt
            </button>
            <button className="btn btn-big btn-soft" onClick={onExit}>
              <IconBack /> {exitLabel}
            </button>
          </div>
        </Overlay>
      )}
      {confirm && (
        <Overlay label="Börja om?" onClose={() => setConfirm(false)}>
          <h2>Börja om?</h2>
          <p>Du får nya frågor och börjar från början.</p>
          <div className="overlay-actions">
            <button
              className="btn btn-big"
              onClick={() => {
                setConfirm(false);
                start();
              }}
            >
              <IconRestart /> Ja, börja om
            </button>
            <button className="btn btn-big btn-soft" onClick={() => setConfirm(false)}>
              Nej
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function ChoiceView({ q, s, onChoose }: { q: ChoiceQuestion; s: RunState; onChoose: (i: number) => void }) {
  const visual = q.options.some((o) => o.visual);
  const long = q.options.some((o) => o.label.length > 22);
  return (
    <div className={`run-options${visual ? ' with-visual' : ''}${long ? ' long' : ''} n${q.options.length}`}>
      {q.options.map((o, i) => {
        const wrong = s.wrong.includes(i);
        const right = s.solved && i === q.answer;
        return (
          <button
            key={i}
            className={`run-option${wrong ? ' wrong shake' : ''}${right ? ' right pop' : ''}`}
            onClick={() => onChoose(i)}
            disabled={wrong || (s.solved && !right)}
            aria-label={o.label}
          >
            {o.visual && (
              <span className="run-option-visual">
                <VisualView v={o.visual} />
              </span>
            )}
            {!o.hideLabel && o.label && <span className="run-option-label">{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

function OrderView({ q, s, onPick }: { q: OrderQuestion; s: RunState; onPick: (i: number) => void }) {
  // Visa sakerna i en blandad men stabil ordning för den här frågan.
  const [order] = useState(() => shuffle(q.items.map((_, i) => i)));
  return (
    <div className="order-wrap">
      <ol className="order-line" aria-label="Din ordning">
        {q.items.map((_, pos) => {
          const idx = s.placed[pos];
          return (
            <li key={pos} className={`order-slot${idx !== undefined ? ' filled pop' : ''}`}>
              <span className="order-num">{pos + 1}</span>
              {idx !== undefined ? (
                <span>
                  <b>{q.items[idx]}</b>
                  {q.notes?.[idx] && <small>{q.notes[idx]}</small>}
                </span>
              ) : (
                <span className="order-empty">?</span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="order-choices">
        {order.map((i) =>
          s.placed.includes(i) ? null : (
            <button key={i} className={`run-option order-choice${s.wrong.includes(i) ? ' wrong shake' : ''}`} onClick={() => onPick(i)}>
              <span className="run-option-label">{q.items[i]}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

function SpellView({
  q,
  s,
  onTile,
  onSlot,
  onHint,
  busy,
}: {
  q: SpellQuestion;
  s: RunState;
  onTile: (i: number) => void;
  onSlot: (i: number) => void;
  onHint: () => void;
  busy: boolean;
}) {
  const len = q.answer.length;
  const size = `min(${len > 7 ? 10 : 13}vw, ${len > 7 ? 8.5 : 10}vh, 88px)`;
  return (
    <div className="spell-wrap" style={{ ['--slot' as string]: size }}>
      <div className="spell-slots" aria-label={`Ordet har ${len} bokstäver`}>
        {s.placed.map((t, i) => (
          <button
            key={i}
            className={`slot${t >= 0 ? ' filled' : ''}${s.wrong.includes(i) ? ' wrong shake' : ''}${s.solved ? ' right' : ''}`}
            onClick={() => onSlot(i)}
            aria-label={t >= 0 ? `Bokstav ${s.tiles[t]}, tryck för att ta bort` : `Tom ruta ${i + 1}`}
          >
            {t >= 0 ? s.tiles[t] : ''}
          </button>
        ))}
      </div>
      {!s.solved && (
        <>
          <div className="spell-tiles">
            {s.tiles.map((ch, i) => (
              <button key={i} className={`tile${s.placed.includes(i) ? ' used' : ''}`} onClick={() => onTile(i)} disabled={s.placed.includes(i)} aria-label={`Bokstaven ${ch}`}>
                {ch}
              </button>
            ))}
          </div>
          <div className="spell-tools">
            <button className="btn btn-soft" onClick={onHint} disabled={busy}>
              <IconBulb /> Ledtråd
            </button>
          </div>
        </>
      )}
    </div>
  );
}
