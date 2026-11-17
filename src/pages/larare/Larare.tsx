import { useEffect, useMemo, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import {
  assignmentProgress,
  formatCode,
  useAsync,
  useBackend,
  type Assignment,
  type Backend,
  type ClassRoom,
  type Student,
  type StudentCodes,
  type QuizResult,
  type WordListDoc,
} from '../../backend';
import { ChoiceGroup, Overlay } from '../../components/GameShell';
import { IconCheck, IconRestart, IconTrash } from '../../components/Icons';
import { parseWordList } from '../../curriculum/engelska';
import { GRADES, gradeLong, type Grade } from '../../curriculum/types';
import { getActivity } from '../../curriculum';
import { Link, useRouter } from '../../lib/router';
import { openWorksheet } from '../Arbetsblad';
import { AuthForm, AVATARS, Avatar, Empty, ErrorBox, errorText, formatDue, Loading, PortalShell } from '../skola/ui';

const GRADE_OPTIONS = GRADES.map((g) => ({ value: g, label: g === 0 ? 'F' : `Åk ${g}` }));

/** Skyddar lärarsidorna: visar inloggning om man inte är inloggad som lärare. */
function useTeacher() {
  const st = useBackend();
  const teacher = st.session?.role === 'teacher' ? st.session : null;
  return { ...st, teacher };
}

function TeacherGate({ children, title = 'För lärare' }: { children: (b: Backend) => JSX.Element; title?: string }) {
  const { backend, session, loading, teacher } = useTeacher();
  if (loading || !backend) return <Loading />;
  if (!teacher) {
    return (
      <PortalShell title={title} kicker="Lärlabbet i skolan" back="/skola" backend={backend} session={session}>
        {session && session.role !== 'teacher' && (
          <p className="notice notice-warn">Du är inloggad som {session.role === 'parent' ? 'förälder' : 'elev'}. Logga ut först om du vill logga in som lärare.</p>
        )}
        <div className="auth-layout">
          <AuthForm role="teacher" backend={backend} />
          <div className="card info-box">
            <h2>Så fungerar det</h2>
            <ol className="steps-list">
              <li>Skapa en klass och lägg till eleverna med ett alias – inga riktiga namn behövs.</li>
              <li>Skriv ut inloggningskorten. Varje elev får en egen kod och QR-kod.</li>
              <li>Ge klassen uppdrag med övningar ur kursplanen för F–6.</li>
              <li>Följ resultaten. Föräldrar kan koppla sig med en egen föräldrakod.</li>
            </ol>
          </div>
        </div>
      </PortalShell>
    );
  }
  return children(backend);
}

/* ================= Klasser ================= */

export function LarareHome() {
  return <TeacherGate>{(backend) => <ClassList backend={backend} />}</TeacherGate>;
}

function ClassList({ backend }: { backend: Backend }) {
  const { session } = useBackend();
  const { navigate } = useRouter();
  const classes = useAsync(() => backend.listClasses(), [backend]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const c = await backend.createClass(name, grade);
      navigate(`/larare/klass/${c.id}`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <PortalShell title="Mina klasser" kicker={session && session.role === 'teacher' ? `Hej ${session.name}` : undefined} back="/skola" backend={backend} session={session}>
      {classes.error && <ErrorBox message={classes.error} onRetry={classes.reload} />}
      {classes.loading ? (
        <Loading />
      ) : classes.data?.length ? (
        <div className="class-grid">
          {classes.data.map((c) => (
            <Link key={c.id} to={`/larare/klass/${c.id}`} className="card class-card">
              <span className="class-grade">{c.grade === 0 ? 'F' : c.grade}</span>
              <span>
                <b>{c.name}</b>
                <small>{gradeLong(c.grade)}</small>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="muted">Du har inga klasser än. Skapa den första nedan.</p>
      )}

      <form className="card form-card" onSubmit={create}>
        <h2>Ny klass</h2>
        <label className="field">
          <span>Namn på klassen</span>
          <input id="class-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="t.ex. 2B eller Ugglorna" required />
        </label>
        <ChoiceGroup label="Årskurs" value={grade} options={GRADE_OPTIONS} onChange={setGrade} />
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-big" disabled={busy || !name.trim()}>
          Skapa klass
        </button>
      </form>
    </PortalShell>
  );
}

/* ================= En klass ================= */

type Tab = 'elever' | 'uppdrag' | 'glosor' | 'resultat';
const TABS: { id: Tab; label: string }[] = [
  { id: 'uppdrag', label: 'Uppdrag' },
  { id: 'elever', label: 'Elever' },
  { id: 'resultat', label: 'Resultat' },
  { id: 'glosor', label: 'Glosor' },
];

export function KlassPage({ classId, tab }: { classId: string; tab?: string }) {
  return <TeacherGate>{(backend) => <Klass backend={backend} classId={classId} tab={(TABS.find((t) => t.id === tab)?.id ?? 'uppdrag') as Tab} />}</TeacherGate>;
}

function useClassData(backend: Backend, classId: string) {
  return useAsync(async () => {
    const [cls, students, codes, assignments, wordlists, quizResults] = await Promise.all([
      backend.getClass(classId),
      backend.listStudents(classId),
      backend.getCodes(classId),
      backend.listAssignments(classId),
      backend.listWordLists(classId),
      backend.listQuizResults(classId),
    ]);
    return { cls, students, codes, assignments, wordlists, quizResults };
  }, [backend, classId]);
}

function Klass({ backend, classId, tab }: { backend: Backend; classId: string; tab: Tab }) {
  const { session } = useBackend();
  const { navigate } = useRouter();
  const data = useClassData(backend, classId);
  const [settings, setSettings] = useState(false);

  if (data.loading && !data.data) return <Loading />;
  if (data.error || !data.data?.cls) {
    return (
      <PortalShell title="Klassen hittades inte" back="/larare" backend={backend} session={session}>
        <ErrorBox message={data.error ?? 'Klassen finns inte eller tillhör en annan lärare.'} onRetry={data.reload} />
      </PortalShell>
    );
  }
  const { cls, students, codes, assignments, wordlists, quizResults } = data.data;

  return (
    <PortalShell
      title={cls.name}
      kicker={gradeLong(cls.grade)}
      back="/larare"
      backend={backend}
      session={session}
      actions={
        <button className="btn btn-soft" onClick={() => setSettings(true)}>
          Inställningar
        </button>
      }
    >
      <nav className="tabs" aria-label="Klassens delar">
        {TABS.map((t) => (
          <Link key={t.id} to={`/larare/klass/${classId}/${t.id}`} className="tab" aria-current={t.id === tab ? 'page' : undefined}>
            {t.label}
            <span className="tab-count">
              {t.id === 'elever' ? students.length : t.id === 'uppdrag' ? assignments.length : t.id === 'glosor' ? wordlists.length : ''}
            </span>
          </Link>
        ))}
      </nav>

      {tab === 'elever' && <StudentsTab backend={backend} cls={cls} students={students} codes={codes} reload={data.reload} />}
      {tab === 'uppdrag' && <AssignmentsTab backend={backend} cls={cls} students={students} assignments={assignments} wordlists={wordlists} reload={data.reload} />}
      {tab === 'glosor' && <WordListsTab backend={backend} cls={cls} lists={wordlists} reload={data.reload} />}
      {tab === 'resultat' && <ResultsTab students={students} assignments={assignments} quizResults={quizResults} />}

      {settings && <ClassSettings backend={backend} cls={cls} onClose={() => setSettings(false)} onSaved={data.reload} onDeleted={() => navigate('/larare')} />}
    </PortalShell>
  );
}

function ClassSettings({ backend, cls, onClose, onSaved, onDeleted }: { backend: Backend; cls: ClassRoom; onClose: () => void; onSaved: () => void; onDeleted: () => void }) {
  const [name, setName] = useState(cls.name);
  const [grade, setGrade] = useState<Grade>(cls.grade);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <Overlay label="Klassens inställningar" onClose={onClose}>
      <h2>Inställningar</h2>
      <label className="field">
        <span>Namn</span>
        <input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <ChoiceGroup label="Årskurs" value={grade} options={GRADE_OPTIONS} onChange={setGrade} />
      <div className="overlay-actions">
        <button
          className="btn btn-big"
          onClick={() =>
            backend
              .updateClass(cls.id, { name: name.trim() || cls.name, grade })
              .then(() => {
                onSaved();
                onClose();
              })
              .catch((e) => setError(errorText(e)))
          }
        >
          Spara
        </button>
      </div>
      <div className="danger-zone">
        <h3>Ta bort klassen</h3>
        <p>Elever, koder, uppdrag, glosor och resultat tas bort för gott. Skriv klassens namn för att bekräfta.</p>
        <input id="settings-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={cls.name} aria-label="Skriv klassens namn" />
        <button className="btn btn-danger" disabled={confirm.trim() !== cls.name} onClick={() => backend.deleteClass(cls.id).then(onDeleted).catch((e) => setError(errorText(e)))}>
          <IconTrash /> Ta bort klassen
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </Overlay>
  );
}

/* ---------- Elever ---------- */

function StudentsTab({ backend, cls, students, codes, reload }: { backend: Backend; cls: ClassRoom; students: Student[]; codes: Record<string, StudentCodes>; reload: () => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickFor, setPickFor] = useState<Student | null>(null);
  const [remove, setRemove] = useState<Student | null>(null);
  const aliases = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const used = new Set(students.map((s) => s.avatar));
      const free = AVATARS.filter((a) => !used.has(a));
      await backend.addStudents(
        cls.id,
        aliases.map((alias, i) => ({ alias, avatar: free[i] ?? AVATARS[(students.length + i) % AVATARS.length] }))
      );
      setText('');
      reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="tab-panel">
      {students.length > 0 && (
        <div className="panel-head">
          <p className="muted">Eleverna loggar in med sin elevkod. Föräldrakoden ger en förälder tillgång till just det barnets uppdrag och resultat.</p>
          <Link to={`/larare/klass/${cls.id}/kort`} className="btn">
            Skriv ut inloggningskort
          </Link>
        </div>
      )}
      {students.length === 0 ? (
        <Empty title="Inga elever än">
          <p>Lägg till eleverna nedan. Använd gärna förnamn och initial eller ett smeknamn – inga personnummer eller efternamn.</p>
        </Empty>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Elev</th>
                <th>Elevkod</th>
                <th>Föräldrakod</th>
                <th>Senast aktiv</th>
                <th>
                  <span className="visually-hidden">Åtgärder</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <button className="avatar-btn" onClick={() => setPickFor(s)} aria-label={`Byt bild för ${s.alias}`}>
                      <Avatar id={s.avatar} size={44} />
                    </button>
                    <b>{s.alias}</b>
                  </td>
                  <td className="code">{codes[s.id] ? formatCode(codes[s.id].loginCode) : '–'}</td>
                  <td className="code">{codes[s.id] ? formatCode(codes[s.id].parentCode) : '–'}</td>
                  <td className="muted">{s.lastActive ? new Date(s.lastActive).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : 'Aldrig'}</td>
                  <td className="row-actions">
                    <button className="btn btn-soft btn-small" onClick={() => backend.renewCodes(cls.id, s.id).then(reload).catch((e) => setError(errorText(e)))} title="De gamla koderna slutar fungera">
                      <IconRestart /> Nya koder
                    </button>
                    <button className="icon-btn small" onClick={() => setRemove(s)} aria-label={`Ta bort ${s.alias}`}>
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="card form-card" onSubmit={add}>
        <h2>Lägg till elever</h2>
        <label className="field">
          <span>Ett alias per rad</span>
          <textarea id="students-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Alva S\nNoah\nMaja K'} />
        </label>
        <p className="muted small">Varje elev får en bild, en elevkod och en föräldrakod. Du kan byta bild efteråt.</p>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-big" disabled={busy || aliases.length === 0}>
          {aliases.length > 1 ? `Lägg till ${aliases.length} elever` : 'Lägg till elev'}
        </button>
      </form>

      {pickFor && (
        <Overlay label="Välj bild" onClose={() => setPickFor(null)}>
          <h2>Bild för {pickFor.alias}</h2>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button
                key={a}
                className="avatar-btn"
                aria-pressed={pickFor.avatar === a}
                onClick={() =>
                  backend
                    .updateStudent(cls.id, pickFor.id, { avatar: a })
                    .then(() => {
                      setPickFor(null);
                      reload();
                    })
                    .catch((e) => setError(errorText(e)))
                }
              >
                <Avatar id={a} size={64} />
              </button>
            ))}
          </div>
        </Overlay>
      )}
      {remove && (
        <Overlay label="Ta bort elev?" onClose={() => setRemove(null)}>
          <h2>Ta bort {remove.alias}?</h2>
          <p>Elevens resultat och koder tas bort. Kopplade föräldrar tappar åtkomst.</p>
          <div className="overlay-actions">
            <button
              className="btn btn-big btn-danger"
              onClick={() =>
                backend
                  .removeStudent(cls.id, remove.id)
                  .then(() => {
                    setRemove(null);
                    reload();
                  })
                  .catch((e) => setError(errorText(e)))
              }
            >
              <IconTrash /> Ta bort
            </button>
            <button className="btn btn-big btn-soft" onClick={() => setRemove(null)}>
              Avbryt
            </button>
          </div>
        </Overlay>
      )}
    </section>
  );
}

/* ---------- Uppdrag ---------- */

function AssignmentsTab({
  backend,
  cls,
  students,
  assignments,
  wordlists,
  reload,
}: {
  backend: Backend;
  cls: ClassRoom;
  students: Student[];
  assignments: Assignment[];
  wordlists: WordListDoc[];
  reload: () => void;
}) {
  const [remove, setRemove] = useState<Assignment | null>(null);
  const { navigate } = useRouter();
  const printIt = (a: Assignment) => {
    const list = wordlists.find((w) => a.items.some((it) => it.wordListId === w.id));
    openWorksheet(
      {
        title: a.title,
        grade: cls.grade,
        big: cls.grade <= 1,
        sections: a.items.filter((it) => getActivity(it.activityId)?.id !== 'ma-monster').map((it) => ({ activityId: it.activityId, level: it.level, count: it.count })),
        words: list ? list.pairs.map((p) => `${p.sv} – ${p.en}`).join('\n') : '',
      },
      navigate
    );
  };
  return (
    <section className="tab-panel">
      <div className="panel-head">
        <p className="muted">Ett uppdrag är en eller flera övningar som klassen ska göra, gärna med ett slutdatum. Varje uppdrag går också att skriva ut som arbetsblad.</p>
        <Link to={`/larare/klass/${cls.id}/uppdrag/nytt`} className="btn">
          Nytt uppdrag
        </Link>
      </div>
      {assignments.length === 0 ? (
        <Empty title="Inga uppdrag än">
          <p>Välj övningar ur kursplanen för {gradeLong(cls.grade).toLowerCase()} och ge dem till klassen.</p>
          <Link to={`/larare/klass/${cls.id}/uppdrag/nytt`} className="btn">
            Skapa första uppdraget
          </Link>
        </Empty>
      ) : (
        <div className="assignment-admin-list">
          {assignments.map((a) => {
            const done = students.filter((s) => assignmentProgress(s, a).complete).length;
            const due = formatDue(a.due);
            return (
              <article key={a.id} className="card assignment-admin">
                <div className="assignment-admin-main">
                  <h3>{a.title}</h3>
                  <p className="muted small">
                    {a.items.length} {a.items.length === 1 ? 'övning' : 'övningar'}: {a.items.map((it) => getActivity(it.activityId)?.title ?? '?').join(', ')}
                  </p>
                  {due && <p className={due.late ? 'due late' : 'due'}>{due.text}</p>}
                </div>
                <div className="assignment-admin-side">
                  <div className="meter" aria-label={`${done} av ${students.length} elever klara`}>
                    <span style={{ width: `${students.length ? (done / students.length) * 100 : 0}%` }} />
                  </div>
                  <small>
                    {done} av {students.length} klara
                  </small>
                  <div className="row-actions">
                    <button className="btn btn-soft btn-small" onClick={() => printIt(a)}>
                      Skriv ut
                    </button>
                    <Link to={`/larare/klass/${cls.id}/uppdrag/${a.id}`} className="btn btn-soft btn-small">
                      Ändra
                    </Link>
                    <button className="icon-btn small" onClick={() => setRemove(a)} aria-label={`Ta bort ${a.title}`}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {remove && (
        <Overlay label="Ta bort uppdrag?" onClose={() => setRemove(null)}>
          <h2>Ta bort ”{remove.title}”?</h2>
          <p>Uppdraget försvinner för eleverna. Resultaten som redan sparats finns kvar i elevposterna men visas inte längre.</p>
          <div className="overlay-actions">
            <button className="btn btn-big btn-danger" onClick={() => backend.deleteAssignment(cls.id, remove.id).then(() => (setRemove(null), reload()))}>
              <IconTrash /> Ta bort
            </button>
            <button className="btn btn-big btn-soft" onClick={() => setRemove(null)}>
              Avbryt
            </button>
          </div>
        </Overlay>
      )}
    </section>
  );
}

/* ---------- Glosor ---------- */

function WordListsTab({ backend, cls, lists, reload }: { backend: Backend; cls: ClassRoom; lists: WordListDoc[]; reload: () => void }) {
  const [editing, setEditing] = useState<WordListDoc | 'new' | null>(null);
  return (
    <section className="tab-panel">
      <div className="panel-head">
        <p className="muted">Skriv in veckans glosor. Sedan kan du lägga dem i ett uppdrag med övningen ”Egna glosor”.</p>
        <button className="btn" onClick={() => setEditing('new')}>
          Nya glosor
        </button>
      </div>
      {lists.length === 0 ? (
        <Empty title="Inga egna glosor än">
          <p>Det finns också färdiga glosor för färger, djur, siffror, kroppen och mycket mer bland övningarna.</p>
        </Empty>
      ) : (
        <div className="class-grid">
          {lists.map((w) => (
            <button key={w.id} className="card class-card" onClick={() => setEditing(w)}>
              <span className="class-grade small">{w.pairs.length}</span>
              <span>
                <b>{w.title}</b>
                <small>{w.pairs.slice(0, 3).map((p) => p.en).join(', ')} …</small>
              </span>
            </button>
          ))}
        </div>
      )}
      {editing && <WordListEditor backend={backend} cls={cls} list={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </section>
  );
}

function WordListEditor({ backend, cls, list, onClose, onSaved }: { backend: Backend; cls: ClassRoom; list: WordListDoc | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(list?.title ?? '');
  const [text, setText] = useState(list ? list.pairs.map((p) => `${p.sv} – ${p.en}`).join('\n') : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pairs = useMemo(() => parseWordList(text), [text]);
  const save = () => {
    // Låst medan det sparas, så att ett dubbeltryck inte skapar två listor.
    setBusy(true);
    backend
      .saveWordList(cls.id, { id: list?.id, title: title.trim(), pairs })
      .then(() => {
        onSaved();
        onClose();
      })
      .catch((e) => {
        setError(errorText(e));
        setBusy(false);
      });
  };
  return (
    <Overlay label="Glosor" onClose={onClose}>
      <h2>{list ? 'Ändra glosor' : 'Nya glosor'}</h2>
      <label className="field">
        <span>Rubrik</span>
        <input id="wl-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="t.ex. Vecka 47 – frukter" />
      </label>
      <label className="field">
        <span>En glosa per rad: svenska – engelska</span>
        <textarea id="wl-text" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'päron – pear\nplommon – plum\nvindruva – grape'} />
      </label>
      <p className="muted small">{pairs.length} glosor hittade. Du kan klistra in direkt från ett dokument eller kalkylark.</p>
      {error && <p className="form-error">{error}</p>}
      <div className="overlay-actions">
        <button className="btn btn-big" onClick={save} disabled={busy || !title.trim() || pairs.length < 2}>
          <IconCheck /> {busy ? 'Sparar …' : 'Spara'}
        </button>
        {list && (
          <button className="btn btn-big btn-soft" onClick={() => backend.deleteWordList(cls.id, list.id).then(() => (onSaved(), onClose()))}>
            <IconTrash /> Ta bort listan
          </button>
        )}
      </div>
    </Overlay>
  );
}

/* ---------- Resultat ---------- */

function ResultsTab({ students, assignments, quizResults }: { students: Student[]; assignments: Assignment[]; quizResults: QuizResult[] }) {
  const [detail, setDetail] = useState<{ s: Student; a: Assignment } | null>(null);
  if (!students.length || !assignments.length) {
    return (
      <section className="tab-panel">
        <Empty title="Inga resultat från uppdrag än">
          <p>Resultaten visas här när eleverna har börjat på sina uppdrag.</p>
        </Empty>
        <QuizResults results={quizResults} students={students} />
      </section>
    );
  }
  return (
    <section className="tab-panel">
      <p className="muted">Andel rätt på första försöket. Tryck på en ruta för att se varje övning.</p>
      <div className="table-wrap">
        <table className="data-table results">
          <thead>
            <tr>
              <th>Elev</th>
              {assignments.map((a) => (
                <th key={a.id}>{a.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>
                  <Avatar id={s.avatar} size={36} /> <b>{s.alias}</b>
                </td>
                {assignments.map((a) => {
                  const p = assignmentProgress(s, a);
                  const pct = p.done ? Math.round((p.score / Math.max(1, p.max)) * 100) : null;
                  const level = pct === null ? 'none' : pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'low';
                  return (
                    <td key={a.id}>
                      <button className={`result-cell ${level}`} onClick={() => setDetail({ s, a })}>
                        {pct === null ? '–' : `${pct} %`}
                        <small>
                          {p.done}/{p.total}
                        </small>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="legend">
        <span className="result-cell good">80 %+</span> <span className="result-cell mid">50–79 %</span> <span className="result-cell low">under 50 %</span> <span className="result-cell none">–</span> inte påbörjat
      </p>
      {detail && (
        <Overlay label="Resultat" onClose={() => setDetail(null)}>
          <h2>
            {detail.s.alias}: {detail.a.title}
          </h2>
          <ul className="detail-list">
            {detail.a.items.map((it, i) => {
              const r = detail.s.progress?.[detail.a.id]?.[i];
              return (
                <li key={i}>
                  <b>{getActivity(it.activityId)?.title}</b>
                  <span>{r ? `${r.best} av ${r.max} rätt · ${r.tries} försök · ${new Date(r.at).toLocaleDateString('sv-SE')}` : 'Inte gjord'}</span>
                </li>
              );
            })}
          </ul>
          <button className="btn btn-big" onClick={() => setDetail(null)}>
            Stäng
          </button>
        </Overlay>
      )}
      <QuizResults results={quizResults} students={students} />
    </section>
  );
}

/** Sparade klassquiz: vem som deltog, poäng och vilka frågor klassen hade svårt för. */
function QuizResults({ results, students }: { results: QuizResult[]; students: Student[] }) {
  const alias = new Map(students.map((s) => [s.id, s.alias]));
  return (
    <section className="quiz-results" aria-labelledby="quiz-results-title">
      <h2 id="quiz-results-title">Klassquiz</h2>
      {results.length === 0 ? (
        <p className="muted">
          När du kör ett <Link to="/quiz">klassquiz</Link> och väljer den här klassen sparas resultatet här.
        </p>
      ) : (
        results.map((r) => {
          const total = r.questions.length;
          const answers = r.players.length * total;
          const share = answers ? r.players.reduce((n, p) => n + p.right, 0) / answers : 0;
          const hard = r.questions.map((q, i) => ({ ...q, i, share: r.players.length ? q.right / r.players.length : 0 })).filter((q) => q.share < 0.5);
          return (
            <details key={r.id} className="card quiz-result">
              <summary>
                <b>{r.title}</b>
                <span className="muted">
                  {new Date(r.at).toLocaleDateString('sv-SE')} · {r.players.length} deltagare · {Math.round(share * 100)} % rätt
                </span>
              </summary>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plats</th>
                      <th>Namn</th>
                      <th>Rätt</th>
                      <th>Poäng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.players.map((p, k) => (
                      <tr key={k}>
                        <td>{p.rank}</td>
                        <td>
                          {p.studentId && alias.has(p.studentId) ? (
                            <>
                              <b>{alias.get(p.studentId)}</b> <span className="badge">elevkonto</span>
                            </>
                          ) : (
                            p.name
                          )}
                        </td>
                        <td>
                          {p.right} av {total}
                        </td>
                        <td>{p.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3>{hard.length ? 'Frågor där färre än hälften hade rätt' : 'Mer än hälften hade rätt på alla frågor.'}</h3>
              {hard.length > 0 && (
                <ul className="detail-list">
                  {hard.map((q) => (
                    <li key={q.i}>
                      <b>{q.prompt}</b>
                      <span>
                        Svar: {q.answer} · {Math.round(q.share * 100)} % rätt
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          );
        })
      )}
    </section>
  );
}

/* ================= Inloggningskort ================= */

export function KortPage({ classId }: { classId: string }) {
  return <TeacherGate>{(backend) => <Kort backend={backend} classId={classId} />}</TeacherGate>;
}

function QR({ text }: { text: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#3B2F5C', light: '#FFFFFF' } }).then(setSvg);
  }, [text]);
  return <span className="qr" dangerouslySetInnerHTML={{ __html: svg }} aria-hidden="true" />;
}

function Kort({ backend, classId }: { backend: Backend; classId: string }) {
  const data = useClassData(backend, classId);
  const [which, setWhich] = useState<'elev' | 'foralder'>('elev');
  if (data.loading) return <Loading />;
  if (data.error || !data.data?.cls) return <ErrorBox message={data.error ?? 'Klassen hittades inte.'} />;
  const { cls, students, codes } = data.data;
  const origin = location.origin;
  return (
    <div className="page container print-page">
      <div className="no-print print-toolbar">
        <Link to={`/larare/klass/${classId}/elever`} className="btn btn-soft">
          Tillbaka
        </Link>
        <div className="chip-row">
          <button className="chip" aria-pressed={which === 'elev'} onClick={() => setWhich('elev')}>
            Elevkort
          </button>
          <button className="chip" aria-pressed={which === 'foralder'} onClick={() => setWhich('foralder')}>
            Föräldralappar
          </button>
        </div>
        <button className="btn" onClick={() => window.print()}>
          Skriv ut
        </button>
      </div>
      <p className="no-print muted">
        {which === 'elev'
          ? 'Klipp ut korten och ge varje elev sitt. QR-koden öppnar Lärlabbet och loggar in eleven direkt.'
          : 'Skicka hem lappen. Föräldern skapar ett konto och skriver in koden för att se sitt barns uppdrag.'}
      </p>
      <div className="cards-sheet">
        {students.map((s) => {
          const c = codes[s.id];
          if (!c) return null;
          return which === 'elev' ? (
            <div key={s.id} className="login-card">
              <div className="login-card-top">
                <Avatar id={s.avatar} size={64} />
                <div>
                  <b>{s.alias}</b>
                  <small>{cls.name}</small>
                </div>
              </div>
              <div className="login-card-body">
                <QR text={`${origin}/in/${c.loginCode}`} />
                <div>
                  <small>Min kod</small>
                  <span className="big-code">{formatCode(c.loginCode)}</span>
                  <small>Lärlabbet → Elev</small>
                </div>
              </div>
            </div>
          ) : (
            <div key={s.id} className="login-card parent-slip">
              <b>Till förälder till {s.alias}</b>
              <p>
                Följ ditt barns uppdrag i Lärlabbet. Gå till <span className="url">{origin.replace(/^https?:\/\//, '')}/foralder</span>, skapa ett konto och skriv in föräldrakoden:
              </p>
              <span className="big-code">{formatCode(c.parentCode)}</span>
              <small>Koden ger bara tillgång till {s.alias}s uppdrag och resultat i klassen {cls.name}.</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
