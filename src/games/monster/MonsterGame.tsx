import { ChoiceGroup, Feedback, GameEnd, GameIntro, GameTopBar, PauseOverlay, Stat, starsFrom } from '../../components/GameShell';
import { Picture } from '../../components/pictures';
import { getRecord } from '../../lib/storage';
import type { GameAssignment, GameMeta } from '../registry';
import { useRound } from '../useRound';
import { buildPatternRound, describeToken, PATTERN_LEVELS, tokenKey, type PatternLevel, type PatternTask, type ShapeName, type Token } from './logic';

const SHAPE_PATHS: Record<ShapeName, (c: string) => JSX.Element> = {
  circle: (c) => <circle cx="50" cy="50" r="34" fill={c} />,
  square: (c) => <rect x="17" y="17" width="66" height="66" rx="14" fill={c} />,
  triangle: (c) => <path d="M50 14 86 80H14z" fill={c} stroke={c} strokeWidth="8" strokeLinejoin="round" />,
  star: (c) => (
    <path d="M50 10l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3z" fill={c} stroke={c} strokeWidth="5" strokeLinejoin="round" />
  ),
  heart: (c) => <path d="M50 84C20 64 12 48 12 36a18 18 0 0 1 38-8 18 18 0 0 1 38 8c0 12-8 28-38 48z" fill={c} />,
  diamond: (c) => <path d="M50 10 86 50 50 90 14 50z" fill={c} stroke={c} strokeWidth="6" strokeLinejoin="round" />,
  arrow: (c) => <path d="M50 12 82 46H62v40H38V46H18z" fill={c} stroke={c} strokeWidth="6" strokeLinejoin="round" />,
};

export function TokenView({ token }: { token: Token }) {
  if (token.t === 'pic') return <Picture id={token.pic} withBg={false} />;
  if (token.t === 'num') {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <text x="50" y="68" textAnchor="middle" fontSize={token.n > 99 ? 40 : 52} fontWeight="800" fill="#3B2F5C" fontFamily="ui-rounded, system-ui, sans-serif">
          {token.n}
        </text>
      </svg>
    );
  }
  if (token.t === 'dots') {
    const n = token.n;
    const cols = n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const cell = 76 / Math.max(cols, rows);
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {Array.from({ length: n }, (_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const inRow = Math.min(cols, n - r * cols);
          const ox = 50 - ((inRow - 1) * cell) / 2;
          const oy = 50 - ((rows - 1) * cell) / 2;
          return <circle key={i} cx={ox + c * cell} cy={oy + r * cell} r={cell * 0.36} fill="#FF8A5B" />;
        })}
      </svg>
    );
  }
  const scale = token.size === 1 ? 0.55 : token.size === 3 ? 1.08 : 0.82;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <g transform={`rotate(${token.rot ?? 0} 50 50) translate(50 50) scale(${scale}) translate(-50 -50)`}>
        {SHAPE_PATHS[token.shape](token.color)}
      </g>
    </svg>
  );
}

export default function MonsterGame({ meta, assignment }: { meta: GameMeta; assignment?: GameAssignment }) {
  const r = useRound<PatternTask, PatternLevel>({
    key: assignment ? `monster:${assignment.key}` : 'monster',
    gameId: meta.id,
    defaultLevel: (assignment?.level as never) ?? 'latt',
    onFinish: assignment?.onFinish,
    build: (level) => buildPatternRound(level),
    autoAdvanceMs: 1700,
  });
  const { s, question: q } = r;

  if (s.phase === 'intro') {
    const best = getRecord(meta.id, s.level);
    return (
      <GameIntro meta={meta} onStart={() => r.start()}>
        {!assignment && <ChoiceGroup label="Svårighetsgrad" value={s.level} options={PATTERN_LEVELS} onChange={r.setLevel} />}
        {best?.best !== undefined && <p className="setup-note">Ditt bästa: {best.best} av 10</p>}
      </GameIntro>
    );
  }

  if (s.phase === 'done' || !q) {
    return (
      <GameEnd
        meta={meta}
        stars={starsFrom(s.score, s.questions.length)}
        title="Mysteriet är löst!"
        record={s.record}
        lines={[
          { label: 'Rätt direkt', value: `${s.score} av ${s.questions.length}` },
          { label: 'Längsta svit', value: s.bestStreak },
        ]}
        onAgain={() => r.start()}
        onSettings={assignment ? undefined : r.toIntro}
      />
    );
  }

  const seqLabel = q.sequence.map(describeToken).join(', ');

  return (
    <div className="game-screen" style={{ ['--game' as string]: meta.color, ['--game-soft' as string]: meta.soft }}>
      <GameTopBar
        meta={meta}
        progress={{ value: s.index + (s.solved ? 1 : 0), max: s.questions.length }}
        onPause={r.pause}
        onRestart={() => r.start()}
        stats={<Stat value={`${s.index + 1}/${s.questions.length}`} label="mönster" />}
      />
      <div className="game-stage pattern-stage">
        <p className="prompt-text">Vad kommer sen?</p>
        <div
          className="pattern-row card pop"
          key={s.index}
          role="img"
          aria-label={`Mönster: ${seqLabel}, och sedan frågetecken`}
          style={{ ['--n' as string]: q.sequence.length + 1 }}
        >
          {q.sequence.map((t, i) => (
            <div className="pattern-cell" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
              <TokenView token={t} />
            </div>
          ))}
          <div className={`pattern-cell mystery${s.solved ? ' solved' : ''}`}>{s.solved ? <TokenView token={q.answer} /> : <span>?</span>}</div>
        </div>
        <div className="feedback-slot">
          {s.solved ? (
            <Feedback kind="good">Rätt! {q.explain}</Feedback>
          ) : s.wrong.length ? (
            <Feedback kind="oops">Inte riktigt. Titta på vad som upprepas och prova igen!</Feedback>
          ) : null}
        </div>
        <div className={`pattern-options n${q.options.length}`} key={`o${s.index}`}>
          {q.options.map((t, i) => {
            const correct = tokenKey(t) === tokenKey(q.answer);
            const wrong = s.wrong.includes(i);
            const right = s.solved && correct;
            return (
              <button
                key={tokenKey(t)}
                className={`pattern-option${wrong ? ' wrong shake' : ''}${right ? ' right pop' : ''}`}
                onClick={() => r.answer(i, correct)}
                aria-label={describeToken(t)}
                disabled={wrong || (s.solved && !right)}
              >
                <TokenView token={t} />
              </button>
            );
          })}
        </div>
      </div>
      {s.paused && <PauseOverlay onResume={r.resume} onRestart={() => r.start()} onSettings={assignment ? undefined : r.toIntro} />}
    </div>
  );
}
