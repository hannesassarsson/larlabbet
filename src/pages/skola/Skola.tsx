import { useBackend } from '../../backend';
import { IconBack } from '../../components/Icons';
import { Picture, type PicId } from '../../components/pictures';
import { Link, useRouter } from '../../lib/router';
import { DemoBanner } from './ui';

const ROLES: { to: string; pic: PicId; title: string; text: string; color: string }[] = [
  { to: '/elev/logga-in', pic: 'uggla', title: 'Jag är elev', text: 'Logga in med koden på ditt kort och gör dina uppdrag.', color: '#FFD166' },
  { to: '/larare', pic: 'stjärna', title: 'Jag är lärare', text: 'Skapa klasser, ge uppdrag ur kursplanen och följ resultaten.', color: '#5BC0EB' },
  { to: '/foralder', pic: 'hus', title: 'Jag är förälder', text: 'Koppla ditt barn med föräldrakoden och följ uppdragen.', color: '#7BD389' },
];

/** Ingången till skoldelen: elev, lärare eller förälder. */
export default function Skola() {
  const { backend, session } = useBackend();
  const { navigate } = useRouter();
  const here = session?.role === 'teacher' ? '/larare' : session?.role === 'parent' ? '/foralder' : session?.role === 'student' ? '/elev' : null;
  return (
    <div className="page portal container">
      <header className="portal-top">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Till startsidan">
          <IconBack />
        </button>
        <div className="portal-title">
          <p className="hero-kicker">Leklandet i skolan</p>
          <h1>Vem är du?</h1>
        </div>
      </header>
      {backend?.mode === 'demo' && <DemoBanner />}
      {here && (
        <p className="notice">
          Du är redan inloggad. <Link to={here}>Fortsätt dit</Link>
        </p>
      )}
      <div className="role-grid">
        {ROLES.map((r) => (
          <Link key={r.to} to={r.to} className="card role-card" style={{ ['--role' as string]: r.color }}>
            <span className="role-art">
              <Picture id={r.pic} />
            </span>
            <b>{r.title}</b>
            <span>{r.text}</span>
          </Link>
        ))}
      </div>
      <section className="card info-box school-info">
        <h2>Byggt för skolan</h2>
        <ul>
          <li>Över 60 övningar i matematik, svenska, engelska och SO för förskoleklass till årskurs 6, märkta med område i kursplanen (Lgr22).</li>
          <li>Eleverna har inga e-postadresser eller riktiga namn i systemet – bara ett alias, en bild och en kod.</li>
          <li>Föräldrar ser bara sitt eget barn. Koder går att byta direkt om ett kort kommer bort.</li>
          <li>
            Mer om uppgifter och integritet finns under <Link to="/hjalp">För föräldrar och lärare</Link>.
          </li>
        </ul>
      </section>
    </div>
  );
}
