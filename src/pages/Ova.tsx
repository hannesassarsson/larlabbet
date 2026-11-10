import { useMemo, useState } from 'react';
import { ChoiceGroup } from '../components/GameShell';
import { IconPlay } from '../components/Icons';
import { activitiesFor, getActivity } from '../curriculum';
import { gradeRange, SUBJECTS, subjectOf, type Grade, type SubjectId } from '../curriculum/types';
import { Link, useRouter } from '../lib/router';
import { ActivityRunner } from '../play/ActivityRunner';
import { PortalShell } from './skola/ui';

/** Övningsbiblioteket: alla kursplaneövningar, fritt att öva utan konto. */
export function OvaLibrary({ grade: initialGrade, subject: initialSubject }: { grade?: Grade; subject?: SubjectId }) {
  const [subject, setSubject] = useState<SubjectId>(initialSubject ?? 'matematik');
  const [grade, setGrade] = useState<Grade | 'alla'>(initialGrade ?? 'alla');
  // Leklabbet visar förskoleklass till årskurs 3. Äldre elever övar i Lärlabbet.
  const list = useMemo(() => activitiesFor(subject, grade).filter((a) => a.grades[0] <= 3 && !a.needsWordList), [subject, grade]);
  const subj = subjectOf(subject);
  const byArea = useMemo(() => {
    const m = new Map<string, typeof list>();
    for (const a of list) m.set(a.area, [...(m.get(a.area) ?? []), a]);
    return [...m.entries()].sort((x, y) => subj.areas.indexOf(x[0]) - subj.areas.indexOf(y[0]));
  }, [list, subj]);
  const flat = byArea.length > 1 && list.length / byArea.length < 1.5;
  const card = (a: (typeof list)[number], showArea: boolean) => (
    <Link key={a.id} to={a.game ? `/spel/${a.game}` : `/ova/${a.id}`} className="card activity-card" style={{ ['--subject' as string]: subj.color, ['--subject-soft' as string]: subj.soft }}>
      <span className="activity-grades">åk {gradeRange(a.grades)}</span>
      <b>{a.title}</b>
      <span className="muted">{a.description}</span>
      {showArea && <span className="activity-area">{a.area.replace(/\s*\(åk [^)]*\)/, '')}</span>}
      <span className="activity-go" aria-hidden="true">
        <IconPlay />
      </span>
    </Link>
  );

  return (
    <PortalShell title="Öva skolämnen" kicker="Förskoleklass till årskurs 3" back="/lek">
      <p className="lead muted">Övningar som följer kursplanen. Välj ämne och årskurs – allt går att öva fritt, utan konto.</p>
      <div className="subject-tabs" role="tablist" aria-label="Ämne">
        {SUBJECTS.map((s) => (
          <button key={s.id} role="tab" aria-selected={subject === s.id} className="subject-tab" style={{ ['--subject' as string]: s.color, ['--subject-soft' as string]: s.soft }} onClick={() => setSubject(s.id)}>
            {s.short}
          </button>
        ))}
      </div>
      <div className="chip-row wrap" role="group" aria-label="Årskurs">
        <button className="chip" aria-pressed={grade === 'alla'} onClick={() => setGrade('alla')}>
          F–3
        </button>
        {([0, 1, 2, 3] as Grade[]).map((g) => (
          <button key={g} className="chip" aria-pressed={grade === g} onClick={() => setGrade(g)}>
            {g === 0 ? 'F' : `Åk ${g}`}
          </button>
        ))}
      </div>
      {byArea.length === 0 ? (
        <p className="notice">Här finns inga övningar för den årskursen. {subject === 'engelska' && grade === 0 ? 'Engelska börjar i årskurs 1.' : ''}</p>
      ) : flat ? (
        // Nästan bara en övning per område: ett rutnät, med området på kortet.
        <section className="area-section">
          <div className="activity-grid">{list.map((a) => card(a, true))}</div>
        </section>
      ) : (
        byArea.map(([area, acts]) => (
          <section key={area} className="area-section">
            <h2 className="area-title">{area}</h2>
            <div className="activity-grid">{acts.map((a) => card(a, false))}</div>
          </section>
        ))
      )}
      <p className="muted small">
        Går du i årskurs 4–6? Öva i <Link to="/lar">Lärlabbet</Link>.
      </p>
    </PortalShell>
  );
}

export function OvaActivity({ id }: { id: string }) {
  const { navigate } = useRouter();
  const activity = getActivity(id);
  const [level, setLevel] = useState(activity?.defaultLevel);
  if (!activity || activity.needsWordList) {
    return (
      <PortalShell title="Övningen finns inte" back="/ova">
        <p>Den här övningen finns inte, eller kräver glosor från en lärare.</p>
      </PortalShell>
    );
  }
  return (
    <ActivityRunner
      key={id}
      activity={activity}
      level={level}
      runKey={`ova:${id}`}
      onExit={() => navigate('/ova')}
      exitLabel="Till övningarna"
      introExtra={activity.levels && <ChoiceGroup label="Nivå" value={level ?? activity.levels[0].value} options={activity.levels} onChange={setLevel} />}
    />
  );
}

