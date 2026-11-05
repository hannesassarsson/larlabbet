import { ChoiceGroup, GameEnd, GameIntro, GameTopBar, PauseOverlay, Stat, starsFrom } from '../../components/GameShell';
import { IconCheck, IconClose } from '../../components/Icons';
import { getRecord } from '../../lib/storage';
import type { GameMeta } from '../registry';
import { useRound } from '../useRound';
import { buildQuizRound, TOPIC_NAMES, TOPICS, type QuizTopic, type Statement } from './questions';

type Level = QuizTopic | 'alla';

export default function SantFalsktGame({ meta }: { meta: GameMeta }) {
  const r = useRound<Statement, Level>({
    key: 'santfalskt',
    gameId: meta.id,
    defaultLevel: 'alla',
    build: (level) => buildQuizRound(level),
    singleAttempt: true,
    autoAdvanceMs: 0,
  });
  const { s, question: q } = r;

  if (s.phase === 'intro') {
    const best = getRecord(meta.id, s.level);
    return (
      <GameIntro meta={meta} onStart={() => r.start()}>
        <ChoiceGroup label="Vad vill du ha frågor om?" value={s.level} options={TOPICS} onChange={r.setLevel} />
        {best?.best !== undefined && <p className="setup-note">Ditt bästa: {best.best} av 10</p>}
      </GameIntro>
    );
  }

  if (s.phase === 'done' || !q) {
    return (
      <GameEnd
        meta={meta}
        stars={starsFrom(s.score, s.questions.length)}
        title={s.score >= s.questions.length * 0.8 ? 'Du är en riktig kunskapsstjärna!' : 'Bra kämpat – nu vet du ännu mer!'}
        record={s.record}
        lines={[
          { label: 'Rätt svar', value: `${s.score} av ${s.questions.length}` },
          { label: 'Längsta svit', value: s.bestStreak },
        ]}
        onAgain={() => r.start()}
        onSettings={r.toIntro}
      />
    );
  }

  const chosenTrue = s.chosen === 0;
  const correct = s.solved && chosenTrue === q.answer;

  return (
    <div className="game-screen" style={{ ['--game' as string]: meta.color, ['--game-soft' as string]: meta.soft }}>
      <GameTopBar
        meta={meta}
        progress={{ value: s.index + (s.solved ? 1 : 0), max: s.questions.length }}
        onPause={r.pause}
        onRestart={() => r.start()}
        stats={<Stat value={s.score} label="rätt" />}
      />
      <div className="game-stage quiz-stage">
        <article className="quiz-card card pop" key={s.index}>
          <span className={`quiz-topic topic-${q.topic}`}>{TOPIC_NAMES[q.topic]}</span>
          <p className="quiz-text">{q.text}</p>
          {s.solved && (
            <div className={`quiz-result pop ${correct ? 'good' : 'oops'}`} role="status" aria-live="polite">
              <strong>
                {correct ? 'Rätt!' : 'Inte riktigt.'} Det är {q.answer ? 'sant' : 'falskt'}.
              </strong>
              <p>{q.explain}</p>
            </div>
          )}
        </article>

        {s.solved ? (
          <button className="btn btn-big next-btn pop" onClick={r.next} autoFocus>
            {s.index + 1 === s.questions.length ? 'Se resultatet' : 'Nästa fråga'}
          </button>
        ) : (
          <div className="tf-buttons">
            <button className="tf-btn tf-true" onClick={() => r.answer(0, q.answer === true)}>
              <IconCheck /> Sant
            </button>
            <button className="tf-btn tf-false" onClick={() => r.answer(1, q.answer === false)}>
              <IconClose /> Falskt
            </button>
          </div>
        )}
      </div>
      {s.paused && <PauseOverlay onResume={r.resume} onRestart={() => r.start()} onSettings={r.toIntro} />}
    </div>
  );
}
