import { useMemo, useState } from 'react';
import { useAsync, useBackend, type AssignmentItem, type Backend } from '../../backend';
import { IconCheck, IconClose, IconPlay } from '../../components/Icons';
import { activitiesFor, getActivity } from '../../curriculum';
import { GRADES, gradeLabel, gradeRange, SUBJECTS, subjectOf, type Grade, type SubjectId } from '../../curriculum/types';
import { Link, useRouter } from '../../lib/router';
import { AuthForm, ErrorBox, errorText, Loading, PortalShell } from '../skola/ui';

const COUNTS = [5, 10, 15];

export function UppdragEditorPage({ classId, assignmentId }: { classId: string; assignmentId?: string }) {
  const { backend, session, loading } = useBackend();
  if (loading || !backend) return <Loading />;
  if (session?.role !== 'teacher') {
    return (
      <PortalShell title="För lärare" back="/skola" backend={backend}>
        <AuthForm role="teacher" backend={backend} />
      </PortalShell>
    );
  }
  return <Editor backend={backend} classId={classId} assignmentId={assignmentId} />;
}

function Editor({ backend, classId, assignmentId }: { backend: Backend; classId: string; assignmentId?: string }) {
  const { session } = useBackend();
  const { navigate } = useRouter();
  const data = useAsync(async () => {
    const [cls, assignments, wordlists] = await Promise.all([backend.getClass(classId), backend.listAssignments(classId), backend.listWordLists(classId)]);
    return { cls, existing: assignments.find((a) => a.id === assignmentId), wordlists };
  }, [backend, classId, assignmentId]);

  if (data.loading) return <Loading />;
  if (data.error || !data.data?.cls) return <ErrorBox message={data.error ?? 'Klassen hittades inte.'} />;
  if (assignmentId && !data.data.existing) return <ErrorBox message="Uppdraget finns inte längre." />;
  return (
    <EditorForm
      key={assignmentId ?? 'nytt'}
      backend={backend}
      session={session}
      classId={classId}
      grade={data.data.cls.grade}
      className={data.data.cls.name}
      wordlists={data.data.wordlists}
      initial={data.data.existing}
      onDone={() => navigate(`/larare/klass/${classId}/uppdrag`)}
    />
  );
}

function EditorForm({
  backend,
  session,
  classId,
  grade,
  className,
  wordlists,
  initial,
  onDone,
}: {
  backend: Backend;
  session: ReturnType<typeof useBackend>['session'];
  classId: string;
  grade: Grade;
  className: string;
  wordlists: { id: string; title: string }[];
  initial?: { id: string; title: string; message?: string; due?: string; items: AssignmentItem[] };
  onDone: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [message, setMessage] = useState(initial?.message ?? '');
  const [due, setDue] = useState(initial?.due ?? '');
  const [items, setItems] = useState<AssignmentItem[]>(initial?.items ?? []);
  const [subject, setSubject] = useState<SubjectId | 'alla'>('alla');
  const [g, setG] = useState<Grade | 'alla'>(grade);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const catalog = useMemo(() => activitiesFor(subject, g), [subject, g]);

  const add = (id: string) => {
    const a = getActivity(id)!;
    setItems((list) => [...list, { activityId: id, level: a.defaultLevel, count: 10, wordListId: a.needsWordList ? wordlists[0]?.id : undefined }]);
    if (!title.trim()) setTitle(a.title);
  };
  const update = (i: number, patch: Partial<AssignmentItem>) => setItems((list) => list.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const move = (i: number, d: -1 | 1) =>
    setItems((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const copy = list.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const missingList = items.some((it) => getActivity(it.activityId)?.needsWordList && !it.wordListId);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await backend.saveAssignment(classId, { id: initial?.id, title: title.trim(), message: message.trim() || undefined, due: due || undefined, items });
      onDone();
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };

  return (
    <PortalShell title={initial ? 'Ändra uppdrag' : 'Nytt uppdrag'} kicker={className} back={`/larare/klass/${classId}/uppdrag`} backend={backend} session={session}>
      <div className="editor-layout">
        <section className="card form-card editor-main" aria-labelledby="ed-title">
          <h2 id="ed-title">Uppdraget</h2>
          <label className="field">
            <span>Rubrik</span>
            <input id="as-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="t.ex. Veckans matte" />
          </label>
          <label className="field">
            <span>
              Meddelande till eleverna <small>(valfritt)</small>
            </span>
            <input id="as-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="t.ex. Gör klart innan fredag!" />
          </label>
          <label className="field">
            <span>
              Klart senast <small>(valfritt)</small>
            </span>
            <input id="as-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>

          <h3>Övningar ({items.length})</h3>
          {items.length === 0 && <p className="muted">Välj övningar i listan {window.innerWidth > 900 ? 'till höger' : 'nedanför'}.</p>}
          <ol className="editor-items">
            {items.map((it, i) => {
              const a = getActivity(it.activityId);
              if (!a) return null;
              const subj = subjectOf(a.subject);
              return (
                <li key={i} className="editor-item" style={{ borderColor: subj.color }}>
                  <div className="editor-item-head">
                    <b>{a.title}</b>
                    <span className="muted small">
                      {subj.short} · åk {gradeRange(a.grades)}
                    </span>
                    <span className="row-actions">
                      <button className="icon-btn small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Flytta upp">
                        ↑
                      </button>
                      <button className="icon-btn small" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Flytta ned">
                        ↓
                      </button>
                      <button className="icon-btn small" onClick={() => setItems((l) => l.filter((_, k) => k !== i))} aria-label={`Ta bort ${a.title}`}>
                        <IconClose />
                      </button>
                    </span>
                  </div>
                  <div className="editor-item-opts">
                    {a.levels && (
                      <label className="field compact">
                        <span>Nivå</span>
                        <select value={it.level ?? a.defaultLevel} onChange={(e) => update(i, { level: e.target.value })}>
                          {a.levels.map((l) => (
                            <option key={l.value} value={l.value}>
                              {l.label}
                              {l.hint ? ` – ${l.hint}` : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {!a.game && (
                      <label className="field compact">
                        <span>Frågor</span>
                        <select value={it.count} onChange={(e) => update(i, { count: Number(e.target.value) })}>
                          {COUNTS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {a.needsWordList && (
                      <label className="field compact">
                        <span>Glosor</span>
                        {wordlists.length ? (
                          <select value={it.wordListId ?? ''} onChange={(e) => update(i, { wordListId: e.target.value || undefined })}>
                            <option value="">Välj lista …</option>
                            {wordlists.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.title}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Link to={`/larare/klass/${classId}/glosor`}>Skriv in glosor först</Link>
                        )}
                      </label>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {error && <p className="form-error">{error}</p>}
          {missingList && <p className="form-error">Välj en ordlista för ”Egna glosor”.</p>}
          <div className="editor-actions">
            <button className="btn btn-big" onClick={save} disabled={busy || !title.trim() || items.length === 0 || missingList}>
              <IconCheck /> {initial ? 'Spara ändringar' : 'Ge uppdraget till klassen'}
            </button>
          </div>
        </section>

        <section className="card editor-catalog" aria-labelledby="cat-h">
          <h2 id="cat-h">Övningar ur kursplanen</h2>
          <div className="chip-row wrap" role="group" aria-label="Ämne">
            <button className="chip" aria-pressed={subject === 'alla'} onClick={() => setSubject('alla')}>
              Alla ämnen
            </button>
            {SUBJECTS.map((s) => (
              <button key={s.id} className="chip" aria-pressed={subject === s.id} onClick={() => setSubject(s.id)}>
                <i className="chip-dot" style={{ background: s.color }} /> {s.short}
              </button>
            ))}
          </div>
          <div className="chip-row wrap" role="group" aria-label="Årskurs">
            <button className="chip small" aria-pressed={g === 'alla'} onClick={() => setG('alla')}>
              Alla
            </button>
            {GRADES.map((x) => (
              <button key={x} className="chip small" aria-pressed={g === x} onClick={() => setG(x)}>
                {x === 0 ? 'F' : `Åk ${gradeLabel(x)}`}
              </button>
            ))}
          </div>
          <ul className="catalog-list">
            {catalog.map((a) => {
              const subj = subjectOf(a.subject);
              const count = items.filter((it) => it.activityId === a.id).length;
              return (
                <li key={a.id}>
                  <div className="catalog-item">
                    <span className="item-dot" style={{ background: subj.color }} aria-hidden="true" />
                    <span className="item-text">
                      <b>{a.title}</b>
                      <small>
                        {subj.short} · åk {gradeRange(a.grades)} · {a.area}
                      </small>
                      <small className="muted">{a.description}</small>
                    </span>
                    <span className="catalog-buttons">
                      <Link to={`/ova/${a.id}`} className="icon-btn small" aria-label={`Prova ${a.title}`} title="Prova själv">
                        <IconPlay />
                      </Link>
                      <button className="btn btn-small" onClick={() => add(a.id)}>
                        {count ? `Lägg till igen (${count})` : 'Lägg till'}
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
