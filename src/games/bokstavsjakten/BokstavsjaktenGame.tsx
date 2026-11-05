import { ChoiceGroup, Feedback, GameEnd, GameIntro, GameTopBar, PauseOverlay, Stat, starsFrom } from '../../components/GameShell';
import { Picture, PICTURES, type PicId } from '../../components/pictures';
import { getRecord } from '../../lib/storage';
import type { GameMeta } from '../registry';
import { useRound } from '../useRound';
import { buildRound, displayLetter, firstLetter, LEVELS, type Level, type LetterQuestion } from './logic';

function Word({ id, highlight }: { id: PicId; highlight: boolean }) {
  const w = PICTURES[id].word;
  return (
    <span className="word">
      <b className={highlight ? 'hl' : undefined}>{w[0].toLocaleUpperCase('sv')}</b>
      {w.slice(1)}
    </span>
  );
}

export default function BokstavsjaktenGame({ meta }: { meta: GameMeta }) {
  const r = useRound<LetterQuestion, Level>({
    key: 'bokstavsjakten',
    gameId: meta.id,
    defaultLevel: 'latt',
    build: (level) => buildRound(level),
  });
  const { s, question: q } = r;

  if (s.phase === 'intro') {
    const best = getRecord(meta.id, s.level);
    return (
      <GameIntro meta={meta} onStart={() => r.start()}>
        <ChoiceGroup label="Svårighetsgrad" value={s.level} options={LEVELS} onChange={r.setLevel} />
        {best?.best !== undefined && <p className="setup-note">Ditt bästa: {best.best} av 10</p>}
      </GameIntro>
    );
  }

  if (s.phase === 'done' || !q) {
    return (
      <GameEnd
        meta={meta}
        stars={starsFrom(s.score, s.questions.length)}
        record={s.record}
        lines={[
          { label: 'Rätt direkt', value: `${s.score} av ${s.questions.length}` },
          { label: 'Längsta svit', value: s.bestStreak },
        ]}
        onAgain={() => r.start()}
        onSettings={r.toIntro}
      />
    );
  }

  const lastWrong = s.wrong.length ? q.options[s.wrong[s.wrong.length - 1]] : null;
  const cols = q.options.length === 6 ? 3 : q.options.length === 4 ? 2 : 3;

  return (
    <div className="game-screen" style={{ ['--game' as string]: meta.color, ['--game-soft' as string]: meta.soft }}>
      <GameTopBar
        meta={meta}
        progress={{ value: s.index + (s.solved ? 1 : 0), max: s.questions.length }}
        onPause={r.pause}
        onRestart={() => r.start()}
        stats={<Stat value={`${s.index + 1}/${s.questions.length}`} label="fråga" />}
      />
      <div className="game-stage letter-stage">
        <div className="letter-prompt">
          <div className="letter-big" key={s.index} aria-label={`Bokstaven ${q.letter}`}>
            {displayLetter(q.letter, s.level)}
          </div>
          <p className="prompt-text">Vilken bild börjar på {q.letter}?</p>
          <div className="feedback-slot">
            {s.solved ? (
              <Feedback kind="good">
                Ja! <Word id={q.answer} highlight /> börjar på {q.letter}.
              </Feedback>
            ) : lastWrong ? (
              <Feedback kind="oops">
                <Word id={lastWrong} highlight /> börjar på {firstLetter(lastWrong)}. Försök igen!
              </Feedback>
            ) : null}
          </div>
        </div>
        <div className={`pic-options cols-${cols}`} key={`o${s.index}`}>
          {q.options.map((id, i) => {
            const isWrong = s.wrong.includes(i);
            const isRight = s.solved && id === q.answer;
            return (
              <button
                key={id}
                className={`pic-option${isWrong ? ' wrong shake' : ''}${isRight ? ' right pop' : ''}`}
                onClick={() => r.answer(i, id === q.answer)}
                aria-label={PICTURES[id].word}
                disabled={isWrong || (s.solved && !isRight)}
              >
                <Picture id={id} />
                <span className="pic-label">{isWrong || isRight ? <Word id={id} highlight /> : ' '}</span>
              </button>
            );
          })}
        </div>
      </div>
      {s.paused && <PauseOverlay onResume={r.resume} onRestart={() => r.start()} onSettings={r.toIntro} />}
    </div>
  );
}
