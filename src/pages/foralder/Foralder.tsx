import { useState } from 'react';
import { assignmentProgress, useAsync, useBackend, type Backend, type ChildLink } from '../../backend';
import { Overlay } from '../../components/GameShell';
import { IconPlay } from '../../components/Icons';
import { gradeLong } from '../../curriculum/types';
import { Link } from '../../lib/router';
import { AssignmentCard } from '../elev/Elev';
import { AuthForm, Avatar, CodeForm, Empty, ErrorBox, Loading, PortalShell } from '../skola/ui';

export function ForalderHome() {
  const { backend, session, loading } = useBackend();
  if (loading || !backend) return <Loading />;
  if (session?.role !== 'parent') {
    return (
      <PortalShell title="För föräldrar" kicker="Lärlabbet i skolan" back="/skola" backend={backend} session={session}>
        {session && <p className="notice notice-warn">Du är inloggad som {session.role === 'teacher' ? 'lärare' : 'elev'}. Logga ut först om du vill logga in som förälder.</p>}
        <div className="auth-layout">
          <AuthForm role="parent" backend={backend} />
          <div className="card info-box">
            <h2>Följ ditt barns uppdrag</h2>
            <ol className="steps-list">
              <li>Skapa ett konto med din e-post.</li>
              <li>Skriv in föräldrakoden från lappen du fått av läraren.</li>
              <li>Se vilka uppdrag ditt barn har och hur det går. Du kan koppla flera barn.</li>
            </ol>
            <p className="muted">Du ser bara ditt eget barns uppdrag och resultat – aldrig klasskamraternas.</p>
          </div>
        </div>
      </PortalShell>
    );
  }
  return <Parent backend={backend} />;
}

function Parent({ backend }: { backend: Backend }) {
  const { session } = useBackend();
  const children = useAsync(() => backend.listChildren(), [backend]);
  const [adding, setAdding] = useState(false);

  return (
    <PortalShell
      title="Mina barn"
      kicker={session?.role === 'parent' ? `Hej ${session.name}` : undefined}
      back="/skola"
      backend={backend}
      session={session}
      actions={
        <button className="btn" onClick={() => setAdding(true)}>
          Koppla ett barn
        </button>
      }
    >
      {children.error && <ErrorBox message={children.error} onRetry={children.reload} />}
      {children.loading ? (
        <Loading />
      ) : children.data?.length ? (
        children.data.map((c) => <ChildView key={c.studentId} backend={backend} child={c} onUnlinked={children.reload} />)
      ) : (
        <Empty title="Inget barn kopplat än">
          <p>Skriv in föräldrakoden från lappen du fått av läraren.</p>
          <div className="code-inline">
            <CodeForm
              label="Föräldrakod"
              button="Koppla"
              onSubmit={async (code) => {
                await backend.linkChild(code);
                children.reload();
              }}
            />
          </div>
        </Empty>
      )}

      {adding && (
        <Overlay label="Koppla ett barn" onClose={() => setAdding(false)}>
          <h2>Koppla ett barn</h2>
          <CodeForm
            label="Föräldrakod"
            button="Koppla"
            onSubmit={async (code) => {
              await backend.linkChild(code);
              setAdding(false);
              children.reload();
            }}
          />
        </Overlay>
      )}
    </PortalShell>
  );
}

function ChildView({ backend, child, onUnlinked }: { backend: Backend; child: ChildLink; onUnlinked: () => void }) {
  const assignments = useAsync(() => backend.listAssignments(child.classId), [backend, child.classId]);
  const [confirm, setConfirm] = useState(false);
  const list = assignments.data ?? [];
  const done = list.filter((a) => assignmentProgress(child.student, a).complete).length;
  return (
    <section className="child-section" aria-label={child.student.alias}>
      <div className="card student-hero">
        <Avatar id={child.student.avatar} size={84} />
        <div>
          <h2>{child.student.alias}</h2>
          <p className="muted">
            {child.className} · {gradeLong(child.grade)}
            {child.student.lastActive ? ` · senast aktiv ${new Date(child.student.lastActive).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}` : ''}
          </p>
          <p>
            <b>
              {done} av {list.length}
            </b>{' '}
            uppdrag klara
          </p>
        </div>
        <div className="child-actions">
          <Link to={`/ova/ak/${child.grade}`} className="btn btn-soft">
            <IconPlay /> Öva hemma
          </Link>
          <button className="link-btn" onClick={() => setConfirm(true)}>
            Ta bort kopplingen
          </button>
        </div>
      </div>
      {assignments.error && <ErrorBox message={assignments.error} onRetry={assignments.reload} />}
      {assignments.loading ? (
        <Loading />
      ) : list.length ? (
        <div className="assignment-list">
          {list.map((a) => (
            <AssignmentCard key={a.id} a={a} student={child.student} />
          ))}
        </div>
      ) : (
        <p className="muted">Läraren har inte lagt in några uppdrag än.</p>
      )}
      <p className="muted small">Övningar du gör tillsammans under ”Öva hemma” räknas inte in i skolans resultat. Uppdragen gör barnet när det är inloggat med sin egen kod.</p>
      {confirm && (
        <Overlay label="Ta bort kopplingen?" onClose={() => setConfirm(false)}>
          <h2>Ta bort kopplingen till {child.student.alias}?</h2>
          <p>Du kan koppla igen senare med föräldrakoden.</p>
          <div className="overlay-actions">
            <button className="btn btn-big btn-danger" onClick={() => backend.unlinkChild(child.studentId).then(onUnlinked)}>
              Ta bort
            </button>
            <button className="btn btn-big btn-soft" onClick={() => setConfirm(false)}>
              Avbryt
            </button>
          </div>
        </Overlay>
      )}
    </section>
  );
}
