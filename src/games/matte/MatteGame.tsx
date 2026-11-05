import { ChoiceGroup, Feedback, GameEnd, GameIntro, GameTopBar, PauseOverlay, Stat, starsFrom } from '../../components/GameShell';
import { getRecord } from '../../lib/storage';
import type { GameMeta } from '../registry';
import { useRound } from '../useRound';
import { buildMathRound, OPS, RANGES, type MathTask, type Op } from './logic';

type Level = `${Op}-${number}`;
const parse = (l: Level) => {
  const [op, max] = l.split('-');
  return { op: op as Op, max: Number(max) };
};

function Dots({ task }: { task: MathTask }) {
  if (task.op === '+') {
    return (
      <div className="dots" aria-hidden="true">
        <span className="dot-group" style={{ gridTemplateColumns: `repeat(${Math.min(5, Math.max(1, task.a))}, 26px)` }}>
          {Array.from({ length: task.a }, (_, i) => (
            <i key={i} className="dot a" />
          ))}
        </span>
        <span className="dot-sign">+</span>
        <span className="dot-group" style={{ gridTemplateColumns: `repeat(${Math.min(5, Math.max(1, task.b))}, 26px)` }}>
          {Array.from({ length: task.b }, (_, i) => (
            <i key={i} className="dot b" />
          ))}
        </span>
      </div>
    );
  }
  return (
    <div className="dots" aria-hidden="true">
      <span className="dot-group" style={{ gridTemplateColumns: `repeat(${Math.min(5, Math.max(1, task.a))}, 26px)` }}>
        {Array.from({ length: task.a }, (_, i) => (
          <i key={i} className={i >= task.a - task.b ? 'dot gone' : 'dot a'} />
        ))}
      </span>
    </div>
  );
}

const NEXT_RANGE: Record<number, number> = { 5: 10, 10: 20, 20: 50, 50: 100 };

export default function MatteGame({ meta }: { meta: GameMeta }) {
  const r = useRound<MathTask, Level>({
    key: 'matte',
    gameId: meta.id,
    defaultLevel: 'plus-10',
    build: (level) => buildMathRound(parse(level)),
  });
  const { s, question: q } = r;
  const { op, max } = parse(s.level);

  if (s.phase === 'intro') {
    const best = getRecord(meta.id, s.level);
    return (
      <GameIntro meta={meta} onStart={() => r.start()}>
        <ChoiceGroup label="Räknesätt" value={op} options={OPS} onChange={(o) => r.setLevel(`${o}-${max}`)} />
        <ChoiceGroup label="Talområde" value={max} options={RANGES} onChange={(m) => r.setLevel(`${op}-${m}`)} />
        {best?.best !== undefined && <p className="setup-note">Ditt bästa här: {best.best} av 10</p>}
      </GameIntro>
    );
  }

  if (s.phase === 'done' || !q) {
    const stars = starsFrom(s.score, s.questions.length);
    const up = NEXT_RANGE[max];
    return (
      <GameEnd
        meta={meta}
        stars={stars}
        record={s.record}
        lines={[
          { label: 'Rätt direkt', value: `${s.score} av ${s.questions.length}` },
          { label: 'Längsta svit', value: s.bestStreak },
          ...(stars === 3 && up ? [{ label: 'Redo för mer?', value: `Prova upp till ${up}!` }] : []),
        ]}
        onAgain={() => r.start()}
        onSettings={r.toIntro}
      />
    );
  }

  const lastWrong = s.wrong.length ? q.options[s.wrong[s.wrong.length - 1]] : null;
  const showDots = max <= 10;

  return (
    <div className="game-screen" style={{ ['--game' as string]: meta.color, ['--game-soft' as string]: meta.soft }}>
      <GameTopBar
        meta={meta}
        progress={{ value: s.index + (s.solved ? 1 : 0), max: s.questions.length }}
        onPause={r.pause}
        onRestart={() => r.start()}
        stats={
          <>
            <Stat value={s.score} label="rätt" />
            {s.streak >= 2 && <Stat value={`${s.streak}×`} label="i rad" />}
          </>
        }
      />
      <div className="game-stage math-stage">
        <div className="math-card card pop" key={s.index}>
          <p className="math-problem" aria-live="polite">
            <span>{q.a}</span> <span className="op">{q.op}</span> <span>{q.b}</span> <span className="op">=</span>{' '}
            <span className={`math-answer${s.solved ? ' done' : ''}`}>{s.solved ? q.answer : '?'}</span>
          </p>
          {showDots && <Dots task={q} />}
        </div>
        <div className="feedback-slot">
          {s.solved ? (
            <Feedback kind="good">
              {s.wrong.length === 0 ? 'Rätt!' : 'Där satt den!'} {q.a} {q.op} {q.b} = {q.answer}
            </Feedback>
          ) : lastWrong !== null ? (
            <Feedback kind="oops">{lastWrong} var inte rätt. Räkna en gång till!</Feedback>
          ) : null}
        </div>
        <div className="num-options" key={`o${s.index}`}>
          {q.options.map((n, i) => {
            const wrong = s.wrong.includes(i);
            const right = s.solved && n === q.answer;
            return (
              <button
                key={n}
                className={`num-option${wrong ? ' wrong shake' : ''}${right ? ' right pop' : ''}`}
                onClick={() => r.answer(i, n === q.answer)}
                disabled={wrong || (s.solved && !right)}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
      {s.paused && <PauseOverlay onResume={r.resume} onRestart={() => r.start()} onSettings={r.toIntro} />}
    </div>
  );
}
