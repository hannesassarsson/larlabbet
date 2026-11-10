import { useEffect, useRef, useState } from 'react';
import { assignmentProgress, useAsync, useBackend, type Assignment, type Backend, type Session, type Student, type WordListDoc } from '../../backend';
import { ExitContext } from '../../components/GameShell';
import { IconCheck, IconPlay, IconStar } from '../../components/Icons';
import { getActivity, levelLabel } from '../../curriculum';
import { subjectOf } from '../../curriculum/types';
import BokstavsjaktenGame from '../../games/bokstavsjakten/BokstavsjaktenGame';
import MonsterGame from '../../games/monster/MonsterGame';
import { getGame } from '../../games/registry';
import { useRouter } from '../../lib/router';
import { modeForGrade, setMode } from '../../lib/mode';
import { ActivityRunner } from '../../play/ActivityRunner';
import { Avatar, CodeForm, Empty, ErrorBox, formatDue, Loading, PortalShell } from '../skola/ui';

type StudentSession = Extract<Session, { role: 'student' }>;

/** Inloggning med elevkod. Används också av /in/KOD-länken på inloggningskortet. */
export function ElevLogin({ code }: { code?: string }) {
  const { backend, session, loading } = useBackend();
  const { navigate } = useRouter();
  const tried = useRef(false);
  const [autoError, setAutoError] = useState<string | null>(null);

  useEffect(() => {
    if (!backend || loading) return;
    if (session?.role === 'student' && !code) {
      navigate('/elev', { replace: true });
      return;
    }
    if (code && !tried.current) {
      tried.current = true;
      backend
        .studentSignIn(code)
        .then(() => navigate('/elev', { replace: true }))
        .catch((e: Error) => setAutoError(e.message));
    }
  }, [backend, loading, session, code, navigate]);

  if (!backend || loading || (code && !autoError)) return <Loading label="Loggar in …" />;
  return (
    <PortalShell title="Logga in som elev" kicker="Hej!" back="/skola" backend={backend}>
      <div className="card student-login">
        <div className="student-login-art" aria-hidden="true">
          <Avatar id="uggla" size={120} />
        </div>
        <div>
          <p className="lead">Skriv koden som står på ditt kort. Du kan också skanna QR-koden på kortet med kameran. Ska du vara med i ett quiz? Skriv sifferkoden från tavlan.</p>
          {autoError && <p className="form-error">{autoError}</p>}
          <CodeForm label="Din kod" button="Logga in" onSubmit={async (c) => {
            // Sex siffror är en quizkod från tavlan.
            if (/^\d{6}$/.test(c)) return navigate(`/quiz/${c}`);
            await backend.studentSignIn(c);
            navigate('/elev', { replace: true });
          }} initial={code ?? ''} />
        </div>
      </div>
    </PortalShell>
  );
}

function useStudentData(backend: Backend | null, s: StudentSession | null) {
  return useAsync(
    backend && s
      ? async () => {
          const [student, cls, assignments, wordlists] = await Promise.all([
            backend.getStudent(s.classId, s.studentId),
            backend.getClass(s.classId),
            backend.listAssignments(s.classId),
            backend.listWordLists(s.classId),
          ]);
          return { student, cls, assignments, wordlists };
        }
      : null,
    [backend, s?.studentId]
  );
}

export function ElevHome() {
  const { backend, session, loading } = useBackend();
  const { navigate } = useRouter();
  const s = session?.role === 'student' ? session : null;
  const data = useStudentData(backend, s);
  const grade = data.data?.cls?.grade;

  useEffect(() => {
    if (!loading && !s) navigate('/elev/logga-in', { replace: true });
  }, [loading, s, navigate]);
  // F–3 ser Leklabbet, 4–6 ser Lärlabbet.
  useEffect(() => setMode(grade !== undefined ? modeForGrade(grade) : 'lek'), [grade]);

  if (loading || !s || data.loading) return <Loading />;
  if (data.error || !data.data?.student) {
    return (
      <PortalShell title="Hoppsan" back="/" backend={backend}>
        <ErrorBox message={data.error ?? 'Vi hittar inte ditt elevkonto. Koden kan ha bytts ut – fråga din lärare om en ny.'} onRetry={data.reload} />
        <button className="btn btn-soft" onClick={() => backend?.signOut().then(() => navigate('/elev/logga-in'))}>
          Logga in med en annan kod
        </button>
      </PortalShell>
    );
  }
  const { student, cls, assignments } = data.data;
  const sorted = [...assignments].sort((a, b) => Number(assignmentProgress(student, a).complete) - Number(assignmentProgress(student, b).complete));

  return (
    <PortalShell
      title={`Hej ${student.alias}!`}
      kicker={cls?.name}
      back="/"
      backend={backend}
      actions={
        <button className="btn btn-soft" onClick={() => backend?.signOut().then(() => navigate('/elev/logga-in'))}>
          Byt elev
        </button>
      }
    >
      <div className="student-hero card">
        <Avatar id={student.avatar} size={96} />
        <div>
          <h2>Dina uppdrag</h2>
          <p className="muted">{assignments.length ? 'Tryck på en övning för att börja. Du kan göra om dem så många gånger du vill.' : 'Din lärare har inte lagt in några uppdrag än.'}</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <Empty title="Inga uppdrag just nu">
          <p>Under tiden kan du leka fritt bland spelen.</p>
          <button className="btn" onClick={() => navigate('/')}>
            <IconPlay /> Till spelen
          </button>
        </Empty>
      ) : (
        <div className="assignment-list">
          {sorted.map((a) => (
            <AssignmentCard key={a.id} a={a} student={student} onOpen={(i) => navigate(`/elev/uppdrag/${a.id}/${i}`)} />
          ))}
        </div>
      )}
    </PortalShell>
  );
}

/** Ett uppdrag med sina övningar och elevens framsteg. Används av elev och förälder. */
export function AssignmentCard({ a, student, onOpen }: { a: Assignment; student: Student; onOpen?: (item: number) => void }) {
  const p = assignmentProgress(student, a);
  const due = formatDue(a.due);
  const prog = student.progress?.[a.id] ?? {};
  return (
    <article className={`card assignment-card${p.complete ? ' complete' : ''}`}>
      <header>
        <div>
          <h3>{a.title}</h3>
          {due && <p className={due.late && !p.complete ? 'due late' : 'due'}>{due.text}</p>}
        </div>
        <span className={`progress-pill${p.complete ? ' done' : ''}`}>
          {p.complete ? <IconCheck width={18} height={18} /> : null}
          {p.done} av {p.total} klara
        </span>
      </header>
      {a.message && <p className="assignment-message">{a.message}</p>}
      <ol className="item-list">
        {a.items.map((it, i) => {
          const act = getActivity(it.activityId);
          if (!act) return null;
          const subject = subjectOf(act.subject);
          const r = prog[i];
          const stars = r ? Math.round((r.best / Math.max(1, r.max)) * 3) : 0;
          const body = (
            <>
              <span className="item-dot" style={{ background: subject.color }} aria-hidden="true" />
              <span className="item-text">
                <b>{act.title}</b>
                <small>
                  {subject.short}
                  {it.level ? ` · ${levelLabel(act, it.level)}` : ''} · {it.count} frågor
                </small>
              </span>
              {r ? (
                <span className="item-stars" aria-label={`${r.best} av ${r.max} rätt`}>
                  {Array.from({ length: 3 }, (_, k) => (
                    <IconStar key={k} width={20} height={20} filled={k < stars} />
                  ))}
                </span>
              ) : onOpen ? (
                <span className="item-go" aria-hidden="true">
                  <IconPlay />
                </span>
              ) : (
                <span className="muted small">Inte gjord</span>
              )}
            </>
          );
          return (
            <li key={i}>
              {onOpen ? (
                <button className={`item-row${r ? ' done' : ''}`} onClick={() => onOpen(i)}>
                  {body}
                </button>
              ) : (
                <div className={`item-row${r ? ' done' : ''}`}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </article>
  );
}

/** Kör en övning ur ett uppdrag och sparar resultatet. */
export function ElevUppgift({ assignmentId, item }: { assignmentId: string; item: number }) {
  const { backend, session, loading } = useBackend();
  const { navigate } = useRouter();
  const s = session?.role === 'student' ? session : null;
  const data = useStudentData(backend, s);
  const [saveError, setSaveError] = useState<string | null>(null);
  const grade = data.data?.cls?.grade;

  useEffect(() => {
    if (!loading && !s) navigate('/elev/logga-in', { replace: true });
  }, [loading, s, navigate]);
  useEffect(() => setMode(grade !== undefined ? modeForGrade(grade) : 'lek'), [grade]);

  if (loading || !s || data.loading) return <Loading />;
  const a = data.data?.assignments.find((x) => x.id === assignmentId);
  const it = a?.items[item];
  const act = it && getActivity(it.activityId);
  if (!a || !it || !act || !backend) {
    return (
      <PortalShell title="Övningen finns inte" back="/elev" backend={backend}>
        <ErrorBox message="Uppdraget kan ha ändrats av läraren. Gå tillbaka och välj igen." />
      </PortalShell>
    );
  }
  const wordList = it.wordListId ? (data.data!.wordlists as WordListDoc[]).find((w) => w.id === it.wordListId) : undefined;
  const report = (score: number, max: number) => {
    backend.reportResult(s.classId, s.studentId, a.id, item, score, max).catch((e: Error) => setSaveError(e.message));
  };
  const key = `${s.studentId}:${a.id}:${item}`;

  return (
    <ExitContext.Provider value="/elev">
      {saveError && <p className="save-error" role="alert">Resultatet kunde inte sparas: {saveError}</p>}
      {act.game ? (
        act.game === 'bokstavsjakten' ? (
          <BokstavsjaktenGame meta={getGame('bokstavsjakten')!} assignment={{ key, level: it.level, onFinish: report }} />
        ) : (
          <MonsterGame meta={getGame('monster')!} assignment={{ key, level: it.level, onFinish: report }} />
        )
      ) : (
        <ActivityRunner
          activity={act}
          level={it.level}
          count={it.count}
          wordList={wordList}
          runKey={key}
          heading={a.title}
          onExit={() => navigate('/elev')}
          onFinish={(r) => report(r.score, r.max)}
          exitLabel="Till mina uppdrag"
        />
      )}
    </ExitContext.Provider>
  );
}
