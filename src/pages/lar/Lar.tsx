import { useMemo, useState } from 'react';
import { ChoiceGroup } from '../../components/GameShell';
import { IconAddSquare, IconBack, IconPlay } from '../../components/Icons';
import { LarMark, LekMark, Logo } from '../../components/Logo';
import { activitiesFor, getActivity } from '../../curriculum';
import { SUBJECTS, subjectOf, type Activity, type Grade, type SubjectId } from '../../curriculum/types';
import { setLastPart } from '../../lib/mode';
import { useStandalone } from '../../lib/platform';
import { getLarGrade, getProgress, MASTERY_LABEL, masteryOf, recentActivities, recordProgress, setLarGrade, type ActivityProgress } from '../../lib/progress';
import { Link, useRouter } from '../../lib/router';
import { ActivityRunner } from '../../play/ActivityRunner';

const LAR_GRADES: Grade[] = [4, 5, 6];

/** Övningar som passar Lärlabbet: inga fristående lekspel och inga lärarglosor. */
function larActivities(subject: SubjectId | 'alla', grade: Grade | 'alla') {
  return activitiesFor(subject, grade).filter((a) => !a.game && !a.needsWordList && (grade !== 'alla' || a.grades[1] >= 4));
}

function Mastery({ p }: { p?: ActivityProgress }) {
  const m = masteryOf(p);
  return (
    <span className={`mastery m-${m}`}>
      {MASTERY_LABEL[m]}
      {p ? ` · ${p.best} %` : ''}
    </span>
  );
}

function LarHeader({ back }: { back?: string }) {
  const { navigate } = useRouter();
  return (
    <header className="lar-header">
      {back ? (
        <button className="icon-btn" onClick={() => navigate(back)} aria-label="Tillbaka">
          <IconBack />
        </button>
      ) : (
        <Link to="/lar" className="lar-home-link" aria-label="Lärlabbet, startsidan">
          <Logo mode="lar" />
        </Link>
      )}
      <nav className="lar-nav" aria-label="Lärlabbet">
        <Link to="/elev" className="lar-nav-link">
          Mina uppdrag
        </Link>
        <Link to="/arbetsblad" className="lar-nav-link">
          Arbetsblad
        </Link>
        <Link to="/skola" className="lar-nav-link">
          Lärare och föräldrar
        </Link>
        <Link to="/start" className="lar-nav-link subtle">
          Byt del
        </Link>
      </nav>
    </header>
  );
}

/* ================= Startval ================= */

export function StartPage() {
  const { navigate } = useRouter();
  const standalone = useStandalone();
  const go = (m: 'lek' | 'lar') => {
    setLastPart(m);
    navigate(m === 'lek' ? '/lek' : '/lar');
  };
  return (
    <div className="page start-page container">
      <header className="start-head">
        <LarMark size={64} />
        <div>
          <h1>Lärlabbet</h1>
          <p>Lek och lärande för förskoleklass till årskurs 6</p>
        </div>
      </header>
      <div className="doors">
        <button className="door door-lek" onClick={() => go('lek')}>
          <LekMark size={92} />
          <span className="door-text">
            <b>Leklabbet</b>
            <span className="door-grades">Förskoleklass till årskurs 3</span>
            <span>Spel med bokstäver, siffror, former och mönster. Rita, räkna och lek.</span>
          </span>
          <span className="door-go">
            <IconPlay /> Börja leka
          </span>
        </button>
        <button className="door door-lar" onClick={() => go('lar')}>
          <LarMark size={92} />
          <span className="door-text">
            <b>Lärlabbet</b>
            <span className="door-grades">Årskurs 4 till 6</span>
            <span>Övningar i matematik, svenska, engelska och SO enligt kursplanen. Se vad du kan och vad du behöver öva på.</span>
          </span>
          <span className="door-go">Börja öva</span>
        </button>
      </div>
      <nav className="start-adults" aria-label="För vuxna">
        <span>För vuxna:</span>
        <Link to="/larare">Lärare</Link>
        <Link to="/foralder">Föräldrar</Link>
        <Link to="/arbetsblad">Arbetsblad att skriva ut</Link>
        <Link to="/elev/logga-in">Elev med kod</Link>
        {!standalone && (
          <Link to="/installera">
            <IconAddSquare width={18} height={18} /> Lägg till på iPad
          </Link>
        )}
      </nav>
    </div>
  );
}

/* ================= Lärlabbets start ================= */

export function LarHome() {
  const [grade, setGrade] = useState<Grade>(getLarGrade);
  const progress = useMemo(getProgress, []);
  const recent = useMemo(() => recentActivities(4).filter(([id]) => getActivity(id)), []);
  const weak = useMemo(
    () =>
      Object.entries(progress)
        .filter(([id, p]) => p.best < 70 && getActivity(id))
        .sort((a, b) => a[1].best - b[1].best)
        .slice(0, 4),
    [progress]
  );
  const pick = (g: Grade) => {
    setGrade(g);
    setLarGrade(g);
  };

  return (
    <div className="page lar-page container">
      <LarHeader />
      <section className="lar-hero">
        <div>
          <p className="hero-kicker">Årskurs {grade}</p>
          <h1>Vad vill du öva idag?</h1>
          <p className="lar-lead">Välj ett ämne. Övningarna följer kursplanen, och efter varje övning ser du vad du behöver titta på igen.</p>
        </div>
        <div className="lar-grade" role="radiogroup" aria-label="Årskurs">
          {LAR_GRADES.map((g) => (
            <button key={g} role="radio" aria-checked={grade === g} onClick={() => pick(g)}>
              Åk {g}
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="lar-section" aria-labelledby="recent-h">
          <h2 id="recent-h">Fortsätt öva</h2>
          <div className="lar-rows">
            {recent.map(([id, p]) => (
              <ActivityRow key={id} a={getActivity(id)!} p={p} />
            ))}
          </div>
        </section>
      )}

      <section className="lar-section" aria-labelledby="subjects-h">
        <h2 id="subjects-h">Ämnen</h2>
        <div className="lar-subjects">
          {SUBJECTS.map((sub) => {
            const acts = larActivities(sub.id, grade);
            const done = acts.filter((a) => masteryOf(progress[a.id]) === 'klar').length;
            const started = acts.filter((a) => progress[a.id]).length;
            return (
              <Link key={sub.id} to={`/lar/amne/${sub.id}`} className="card lar-subject" style={{ ['--subject' as string]: sub.color }}>
                <span className="lar-subject-name">{sub.name}</span>
                <span className="muted">
                  {acts.length} övningar för åk {grade}
                </span>
                <span className="lar-subject-bar" aria-hidden="true">
                  <span style={{ width: `${acts.length ? (done / acts.length) * 100 : 0}%` }} />
                </span>
                <span className="lar-subject-stats">
                  {started ? `${done} kan · ${started - done} påbörjade` : 'Inte påbörjat'}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {weak.length > 0 && (
        <section className="lar-section" aria-labelledby="weak-h">
          <h2 id="weak-h">Bra att öva mer på</h2>
          <div className="lar-rows">
            {weak.map(([id, p]) => (
              <ActivityRow key={id} a={getActivity(id)!} p={p} />
            ))}
          </div>
        </section>
      )}

      <section className="lar-section lar-adults" aria-labelledby="adults-h">
        <h2 id="adults-h">För lärare och föräldrar</h2>
        <div className="lar-tools">
          <Link to="/arbetsblad" className="card lar-tool">
            <b>Arbetsblad</b>
            <span>Skriv ut övningar med facit.</span>
          </Link>
          <Link to="/larare" className="card lar-tool">
            <b>Lärare</b>
            <span>Klasser, uppdrag och resultat.</span>
          </Link>
          <Link to="/foralder" className="card lar-tool">
            <b>Föräldrar</b>
            <span>Följ ditt barns uppdrag.</span>
          </Link>
          <Link to="/hjalp" className="card lar-tool">
            <b>Om Lärlabbet</b>
            <span>Integritet, offline och installation.</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function ActivityRow({ a, p }: { a: Activity; p?: ActivityProgress }) {
  const sub = subjectOf(a.subject);
  return (
    <Link to={`/lar/ova/${a.id}`} className="card lar-row" style={{ ['--subject' as string]: sub.color }}>
      <span className="lar-row-text">
        <b>{a.title}</b>
        <small>
          {sub.short} · {a.area}
        </small>
      </span>
      <Mastery p={p} />
      <span className="lar-row-go" aria-hidden="true">
        <IconPlay />
      </span>
    </Link>
  );
}

/* ================= Ett ämne ================= */

export function LarSubject({ id }: { id: string }) {
  const sub = SUBJECTS.find((s) => s.id === id);
  const [grade, setGrade] = useState<Grade | 'alla'>(getLarGrade);
  const progress = useMemo(getProgress, []);
  const acts = useMemo(() => (sub ? larActivities(sub.id, grade) : []), [sub, grade]);
  const byArea = useMemo(() => {
    const m = new Map<string, Activity[]>();
    for (const a of acts) m.set(a.area, [...(m.get(a.area) ?? []), a]);
    return [...m.entries()].sort((x, y) => (sub ? sub.areas.indexOf(x[0]) - sub.areas.indexOf(y[0]) : 0));
  }, [acts, sub]);

  if (!sub) {
    return (
      <div className="page lar-page container">
        <LarHeader back="/lar" />
        <p>Ämnet finns inte.</p>
      </div>
    );
  }
  return (
    <div className="page lar-page container" style={{ ['--subject' as string]: sub.color }}>
      <LarHeader back="/lar" />
      <section className="lar-subject-head">
        <p className="hero-kicker">Ämne</p>
        <h1>{sub.name}</h1>
        <div className="chip-row wrap" role="group" aria-label="Årskurs">
          {LAR_GRADES.map((g) => (
            <button key={g} className="chip" aria-pressed={grade === g} onClick={() => (setGrade(g), setLarGrade(g))}>
              Åk {g}
            </button>
          ))}
          <button className="chip" aria-pressed={grade === 'alla'} onClick={() => setGrade('alla')}>
            Alla, även repetition
          </button>
        </div>
      </section>
      {byArea.length === 0 ? (
        <p className="notice">Här finns inga övningar för den årskursen ännu.</p>
      ) : (
        byArea.map(([area, list]) => (
          <section key={area} className="lar-section">
            <h2 className="lar-area">{area}</h2>
            <div className="lar-rows">
              {list.map((a) => (
                <Link key={a.id} to={`/lar/ova/${a.id}`} className="card lar-row" style={{ ['--subject' as string]: sub.color }}>
                  <span className="lar-row-text">
                    <b>{a.title}</b>
                    <small>{a.description}</small>
                  </span>
                  <span className="lar-row-grade">åk {a.grades[0] === 0 ? 'F' : a.grades[0]}–{a.grades[1]}</span>
                  <Mastery p={progress[a.id]} />
                  <span className="lar-row-go" aria-hidden="true">
                    <IconPlay />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
      <p className="muted small">Områdena kommer från det centrala innehållet i kursplanen (Lgr22).</p>
    </div>
  );
}

/* ================= En övning ================= */

export function LarActivity({ id }: { id: string }) {
  const { navigate } = useRouter();
  const activity = getActivity(id);
  const [level, setLevel] = useState(() => {
    if (!activity?.levels) return activity?.defaultLevel;
    // Börja på en nivå som passar årskursen.
    const g = getLarGrade();
    const span = Math.max(1, activity.grades[1] - activity.grades[0]);
    const idx = Math.round(((Math.min(Math.max(g, activity.grades[0]), activity.grades[1]) - activity.grades[0]) / span) * (activity.levels.length - 1));
    return activity.levels[Math.max(0, Math.min(activity.levels.length - 1, idx))].value;
  });
  if (!activity || activity.needsWordList || activity.game) {
    return (
      <div className="page lar-page container">
        <LarHeader back="/lar" />
        <p>Övningen finns inte i Lärlabbet.</p>
      </div>
    );
  }
  return (
    <ActivityRunner
      key={id}
      activity={activity}
      level={level}
      runKey={`lar:${id}`}
      onExit={() => navigate(`/lar/amne/${activity.subject}`)}
      onFinish={(r) => recordProgress(activity.id, r.score, r.max)}
      exitLabel="Till ämnet"
      introExtra={activity.levels && <ChoiceGroup label="Nivå" value={level ?? activity.levels[0].value} options={activity.levels} onChange={setLevel} />}
    />
  );
}

