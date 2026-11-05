import { useEffect, useRef, useState } from 'react';
import { ChoiceGroup, Feedback, GameEnd, GameIntro, GameTopBar, PauseOverlay, Stat, starsFrom, type Phase } from '../../components/GameShell';
import { IconBulb, IconUndo } from '../../components/Icons';
import { Picture } from '../../components/pictures';
import { play } from '../../lib/sound';
import { getRecord, saveResult, useSessionState } from '../../lib/storage';
import type { GameMeta } from '../registry';
import { applyHint, buildSpellRound, isComplete, isCorrect, nextHint, SPELL_LEVELS, type SpellLevel, type SpellTask } from './logic';

interface State {
  phase: Phase;
  level: SpellLevel;
  tasks: SpellTask[];
  index: number;
  placed: (number | null)[];
  glow: number | null; // bricka som lyser som ledtråd
  hints: number; // ledtrådar på aktuellt ord
  misses: number; // felaktiga försök på aktuellt ord
  wrongSlots: number[];
  solved: boolean;
  score: number; // ord klara utan ledtråd och utan fel
  totalHints: number;
  paused: boolean;
  record: boolean;
}

const fresh = (level: SpellLevel = 'stege'): State => ({
  phase: 'intro',
  level,
  tasks: [],
  index: 0,
  placed: [],
  glow: null,
  hints: 0,
  misses: 0,
  wrongSlots: [],
  solved: false,
  score: 0,
  totalHints: 0,
  paused: false,
  record: false,
});

export default function StavningGame({ meta }: { meta: GameMeta }) {
  const [s, setS] = useSessionState<State>('stavning', () => fresh());
  const [busy, setBusy] = useState(false);
  const timer = useRef<number>();
  const guardUntil = useRef(0); // skydd mot dubbeltryck direkt efter "Nästa ord"
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const task = s.tasks[s.index];

  const start = (level = s.level) => {
    window.clearTimeout(timer.current);
    setBusy(false);
    const tasks = buildSpellRound(level);
    setS({ ...fresh(level), phase: 'playing', tasks, placed: tasks[0].word.split('').map(() => null) });
  };

  const goNext = () => {
    window.clearTimeout(timer.current);
    setBusy(false);
    const index = s.index + 1;
    guardUntil.current = Date.now() + 450;
    if (index >= s.tasks.length) {
      const stars = starsFrom(s.score, s.tasks.length);
      const record = saveResult(meta.id, { key: s.level, score: s.score, better: 'higher', stars });
      setS({ ...s, phase: 'done', record });
      return;
    }
    setS({
      ...s,
      index,
      placed: s.tasks[index].word.split('').map(() => null),
      glow: null,
      hints: 0,
      misses: 0,
      wrongSlots: [],
      solved: false,
    });
  };

  const evaluate = (placed: (number | null)[], st: State) => {
    if (!isComplete(placed)) return { ...st, placed };
    if (isCorrect(task, placed)) {
      play('good');
      const clean = st.hints === 0 && st.misses === 0;
      return { ...st, placed, solved: true, glow: null, wrongSlots: [], score: st.score + (clean ? 1 : 0) };
    }
    play('oops');
    const wrongSlots = placed.flatMap((id, i) => (id !== null && task.tiles[id].ch !== task.word[i] ? [i] : []));
    setBusy(true);
    // Felaktiga bokstäver hoppar tillbaka efter en stund – de rätta ligger kvar.
    timer.current = window.setTimeout(() => {
      setBusy(false);
      setS((p) => ({ ...p, placed: p.placed.map((id, i) => (wrongSlots.includes(i) ? null : id)), wrongSlots: [] }));
    }, 1100);
    return { ...st, placed, wrongSlots, misses: st.misses + 1 };
  };

  const tapTile = (tileId: number) => {
    if (busy || s.solved || s.paused || Date.now() < guardUntil.current) return;
    if (s.placed.includes(tileId)) return;
    const slot = s.placed.indexOf(null);
    if (slot === -1) return;
    play('tap');
    const placed = s.placed.slice();
    placed[slot] = tileId;
    setS(evaluate(placed, { ...s, glow: s.glow === tileId ? null : s.glow }));
  };

  const tapSlot = (slot: number) => {
    if (busy || s.solved || s.paused || s.placed[slot] === null) return;
    play('tap');
    const placed = s.placed.slice();
    placed[slot] = null;
    setS({ ...s, placed });
  };

  const undo = () => {
    if (busy || s.solved) return;
    const last = s.placed.map((x, i) => (x !== null ? i : -1)).filter((i) => i >= 0).pop();
    if (last !== undefined) tapSlot(last);
  };

  const hint = () => {
    if (busy || s.solved || s.paused) return;
    const h = nextHint(task, s.placed);
    if (!h) return;
    play('pop');
    if (s.glow !== h.tileId) {
      // Första ledtråden: visa vilken bokstav som kommer härnäst.
      setS({ ...s, glow: h.tileId, hints: s.hints + 1, totalHints: s.totalHints + 1 });
    } else {
      // Andra trycket: lägg bokstaven på rätt plats.
      setS(evaluate(applyHint(s.placed, h), { ...s, glow: null, hints: s.hints + 1, totalHints: s.totalHints + 1 }));
    }
  };

  if (s.phase === 'intro') {
    const best = getRecord(meta.id, s.level);
    return (
      <GameIntro meta={meta} onStart={() => start()}>
        <ChoiceGroup label="Vilka ord?" value={s.level} options={SPELL_LEVELS} onChange={(level) => setS({ ...s, level })} />
        {best?.best !== undefined && <p className="setup-note">Ditt bästa: {best.best} av 8 ord utan hjälp</p>}
      </GameIntro>
    );
  }

  if (s.phase === 'done' || !task) {
    return (
      <GameEnd
        meta={meta}
        stars={starsFrom(s.score, s.tasks.length)}
        title="Du är en stavningsmästare!"
        record={s.record}
        lines={[
          { label: 'Ord stavade', value: s.tasks.length },
          { label: 'Utan hjälp', value: `${s.score} av ${s.tasks.length}` },
          { label: 'Ledtrådar', value: s.totalHints },
        ]}
        onAgain={() => start()}
        onSettings={() => setS(fresh(s.level))}
      />
    );
  }

  const hasAny = s.placed.some((x) => x !== null);
  const len = task.word.length;
  const slotSize = `min(${len > 7 ? 11 : 14}vw, ${len > 7 ? 9 : 11}vh, 96px)`;

  return (
    <div className="game-screen" style={{ ['--game' as string]: meta.color, ['--game-soft' as string]: meta.soft }}>
      <GameTopBar
        meta={meta}
        progress={{ value: s.index + (s.solved ? 1 : 0), max: s.tasks.length }}
        onPause={() => setS({ ...s, paused: true })}
        onRestart={() => start()}
        stats={<Stat value={`${s.index + 1}/${s.tasks.length}`} label="ord" />}
      />
      <div className="game-stage spell-stage" style={{ ['--slot' as string]: slotSize }}>
        <div className="spell-picture pop" key={s.index}>
          <Picture id={task.pic} title={s.solved ? task.word.toLowerCase() : 'Vad är det här?'} />
        </div>

        <div className="spell-slots" aria-label={`Ordet har ${len} bokstäver`}>
          {s.placed.map((id, i) => (
            <button
              key={i}
              className={`slot${id !== null ? ' filled' : ''}${s.wrongSlots.includes(i) ? ' wrong shake' : ''}${s.solved ? ' right' : ''}`}
              onClick={() => tapSlot(i)}
              aria-label={id !== null ? `Bokstav ${task.tiles[id].ch}, tryck för att ta bort` : `Tom ruta ${i + 1}`}
            >
              {id !== null ? task.tiles[id].ch : ''}
            </button>
          ))}
        </div>

        <div className="feedback-slot">
          {s.solved ? (
            <Feedback kind="good">Rätt! Det står {task.word.toLowerCase()}.</Feedback>
          ) : s.wrongSlots.length ? (
            <Feedback kind="oops">Nästan! De röda bokstäverna hoppar tillbaka.</Feedback>
          ) : s.glow !== null ? (
            <Feedback kind="info">Den lysande bokstaven kommer härnäst. Tryck på lampan igen så lägger jag dit den.</Feedback>
          ) : null}
        </div>

        {s.solved ? (
          <button className="btn btn-big next-btn pop" onClick={goNext} autoFocus>
            {s.index + 1 === s.tasks.length ? 'Se resultatet' : 'Nästa ord'}
          </button>
        ) : (
          <>
            <div className="spell-tiles">
              {task.tiles.map((t) => {
                const used = s.placed.includes(t.id);
                return (
                  <button
                    key={t.id}
                    className={`tile${used ? ' used' : ''}${s.glow === t.id ? ' glow' : ''}`}
                    onClick={() => tapTile(t.id)}
                    disabled={used}
                    aria-label={`Bokstaven ${t.ch}`}
                  >
                    {t.ch}
                  </button>
                );
              })}
            </div>
            <div className="spell-tools">
              <button className="btn btn-soft" onClick={undo} disabled={!hasAny || busy}>
                <IconUndo /> Ångra
              </button>
              <button className="btn btn-soft" onClick={hint} disabled={busy}>
                <IconBulb /> Ledtråd
              </button>
            </div>
          </>
        )}
      </div>
      {s.paused && (
        <PauseOverlay onResume={() => setS({ ...s, paused: false })} onRestart={() => start()} onSettings={() => setS(fresh(s.level))} />
      )}
    </div>
  );
}
