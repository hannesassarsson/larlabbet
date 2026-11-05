import { useEffect, useRef, useState } from 'react';
import { ChoiceGroup, GameEnd, GameIntro, GameTopBar, PauseOverlay, Stat, type Phase } from '../../components/GameShell';
import { IconClock } from '../../components/Icons';
import { Picture, PICTURES } from '../../components/pictures';
import { play } from '../../lib/sound';
import { getRecord, saveResult, useSessionState } from '../../lib/storage';
import { bestColumns, useElementSize } from '../../lib/useFit';
import type { GameMeta } from '../registry';
import { createDeck, flipCard, formatTime, MEMORY_SIZES, memoryStars, type MemoryCard } from './logic';

interface State {
  phase: Phase;
  pairs: number;
  cards: MemoryCard[];
  flipped: number[];
  moves: number;
  seconds: number;
  paused: boolean;
  record: boolean;
}

const initial = (pairs = 6): State => ({
  phase: 'intro',
  pairs,
  cards: [],
  flipped: [],
  moves: 0,
  seconds: 0,
  paused: false,
  record: false,
});

export default function MemoryGame({ meta }: { meta: GameMeta }) {
  const [s, setS] = useSessionState<State>('memory', () => initial());
  const [busy, setBusy] = useState(false);
  const timer = useRef<number>();

  // Efter en omladdning: släpp halvvända kort så att spelet inte fastnar.
  useEffect(() => {
    setS((p) => (p.flipped.length === 2 ? { ...p, flipped: [] } : p));
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Klocka som bara går när man spelar (och inte när appen ligger i bakgrunden).
  useEffect(() => {
    if (s.phase !== 'playing' || s.paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setS((p) => ({ ...p, seconds: p.seconds + 1 }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [s.phase, s.paused, setS]);

  const start = (pairs = s.pairs) => {
    window.clearTimeout(timer.current);
    setBusy(false);
    setS({ ...initial(pairs), phase: 'playing', cards: createDeck(pairs) });
  };

  const onFlip = (index: number) => {
    if (busy || s.paused) return;
    const res = flipCard(s.cards, s.flipped, index);
    if (res.kind === 'ignored') return;
    play('flip');
    if (res.kind === 'first') {
      setS((p) => ({ ...p, flipped: res.flipped }));
      return;
    }
    setBusy(true);
    const moves = s.moves + 1;
    setS((p) => ({ ...p, flipped: res.flipped, moves }));
    if (res.kind === 'match') {
      const cards = s.cards.map((c, i) => (res.flipped.includes(i) ? { ...c, matched: true } : c));
      const done = cards.every((c) => c.matched);
      timer.current = window.setTimeout(() => {
        play('good');
        setBusy(false);
        if (!done) {
          setS((p) => ({ ...p, cards, flipped: [] }));
          return;
        }
        const record = saveResult(meta.id, {
          key: String(s.pairs),
          score: moves,
          better: 'lower',
          stars: memoryStars(moves, s.pairs),
        });
        setS((p) => ({ ...p, cards, flipped: [], phase: 'done', record }));
      }, 450);
    } else {
      timer.current = window.setTimeout(() => {
        setBusy(false);
        setS((p) => ({ ...p, flipped: [] }));
      }, 1000);
    }
  };

  const [boardRef, box] = useElementSize<HTMLDivElement>();

  if (s.phase === 'intro') {
    const best = getRecord(meta.id, String(s.pairs));
    return (
      <GameIntro meta={meta} onStart={() => start()}>
        <ChoiceGroup
          label="Hur många kort?"
          value={s.pairs}
          options={MEMORY_SIZES.map((o) => ({ value: o.pairs, label: o.label, hint: o.hint }))}
          onChange={(pairs) => setS((p) => ({ ...p, pairs }))}
        />
        {best?.best !== undefined && <p className="setup-note">Ditt bästa: {best.best} drag</p>}
      </GameIntro>
    );
  }

  if (s.phase === 'done') {
    return (
      <GameEnd
        meta={meta}
        stars={memoryStars(s.moves, s.pairs)}
        title="Alla par hittade!"
        record={s.record}
        lines={[
          { label: 'Drag', value: s.moves },
          { label: 'Tid', value: formatTime(s.seconds) },
          { label: 'Par', value: s.pairs },
        ]}
        onAgain={() => start()}
        onSettings={() => setS(initial(s.pairs))}
      />
    );
  }

  const found = s.cards.filter((c) => c.matched).length / 2;
  const gap = box.width > 700 ? 16 : 10;
  const fit = bestColumns(s.cards.length, box.width, box.height, gap);
  const size = Math.max(60, Math.floor(fit.size));

  return (
    <div className="game-screen" style={{ ['--game' as string]: meta.color, ['--game-soft' as string]: meta.soft }}>
      <GameTopBar
        meta={meta}
        progress={{ value: found, max: s.pairs }}
        onPause={() => setS((p) => ({ ...p, paused: true }))}
        onRestart={() => start()}
        stats={
          <>
            <Stat value={s.moves} label="drag" />
            <Stat value={`${found}/${s.pairs}`} label="par" />
            <Stat icon={<IconClock width={20} height={20} />} value={formatTime(s.seconds)} label="tid" />
          </>
        }
      />
      <div className="game-stage" ref={boardRef}>
        <div
          className="memory-grid"
          style={{ gridTemplateColumns: `repeat(${fit.cols}, ${size}px)`, gap }}
          aria-label={`Memory med ${s.cards.length} kort`}
        >
          {s.cards.map((c, i) => {
            const up = c.matched || s.flipped.includes(i);
            return (
              <button
                key={c.key}
                className={`memory-card${up ? ' up' : ''}${c.matched ? ' matched' : ''}`}
                style={{ width: size, height: size }}
                onClick={() => onFlip(i)}
                aria-label={up ? PICTURES[c.pic].word : `Kort ${i + 1}, vänt nedåt`}
                aria-pressed={up}
                disabled={c.matched}
              >
                <span className="memory-inner">
                  <span className="memory-face memory-back" aria-hidden="true">
                    <svg viewBox="0 0 40 40">
                      <path d="M20 9l3.3 6.8 7.5 1-5.4 5.3 1.3 7.4L20 26l-6.7 3.5 1.3-7.4-5.4-5.3 7.5-1z" fill="#fff" opacity=".9" />
                    </svg>
                  </span>
                  <span className="memory-face memory-front" aria-hidden="true">
                    <Picture id={c.pic} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {s.paused && (
        <PauseOverlay
          onResume={() => setS((p) => ({ ...p, paused: false }))}
          onRestart={() => start()}
          onSettings={() => setS(initial(s.pairs))}
        />
      )}
    </div>
  );
}
