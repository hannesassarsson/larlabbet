import { lazy, Suspense, useEffect, useLayoutEffect, useState, type ComponentType } from 'react';
import { IconBack } from './components/Icons';
import { LogoMark } from './components/Logo';
import { getGame, type GameMeta } from './games/registry';
import { Link, match, RouterProvider, useRouter } from './lib/router';
import { OvaActivity, OvaLibrary } from './pages/Ova';
import { LarActivity, LarHome, LarSubject, StartPage } from './pages/lar/Lar';
import { APP_NAME, BRAND, getLastPart, getMode, modeForPath, setMode } from './lib/mode';
import type { Grade, SubjectId } from './curriculum/types';
import { onUpdateAvailable, applyUpdate } from './lib/sw';
import Home from './pages/Home';

/*
 * Startsidorna och övningarna laddas direkt. Spelen, lärarsidorna, arbetsbladen
 * och hjälpsidorna laddas först när de behövs, så att appen startar snabbare.
 * Service workern sparar alla delar, så allt fungerar ändå offline.
 */
const page = <T,>(load: () => Promise<T>, pick: (m: T) => ComponentType<any>) => lazy(() => load().then((m) => ({ default: pick(m) })));
const games = () => import('./games/all');
const elev = () => import('./pages/elev/Elev');
const larare = () => import('./pages/larare/Larare');
const ElevHome = page(elev, (m) => m.ElevHome);
const ElevLogin = page(elev, (m) => m.ElevLogin);
const ElevUppgift = page(elev, (m) => m.ElevUppgift);
const LarareHome = page(larare, (m) => m.LarareHome);
const KlassPage = page(larare, (m) => m.KlassPage);
const KortPage = page(larare, (m) => m.KortPage);
const UppdragEditorPage = page(() => import('./pages/larare/UppdragEditor'), (m) => m.UppdragEditorPage);
const ForalderHome = page(() => import('./pages/foralder/Foralder'), (m) => m.ForalderHome);
const Skola = page(() => import('./pages/skola/Skola'), (m) => m.default);
const Arbetsblad = page(() => import('./pages/Arbetsblad'), (m) => m.default);
const Hjalp = page(() => import('./pages/Hjalp'), (m) => m.default);
const Installera = page(() => import('./pages/Installera'), (m) => m.default);
const GAME_COMPONENTS: Record<string, ComponentType<{ meta: GameMeta }>> = Object.fromEntries(
  ['memory', 'bokstavsjakten', 'stavning', 'matte', 'monster', 'santfalskt', 'malarladan'].map((id) => [id, page(games, (m) => m.GAMES[id])])
);

/** Visas en kort stund medan en del av appen laddas. Syns bara om det dröjer. */
function Loading() {
  return (
    <div className="page-loading" role="status" aria-label="Laddar">
      <span />
    </div>
  );
}


function NotFound() {
  return (
    <div className="page info-page container not-found">
      <LogoMark size={96} />
      <h1>Hoppsan! Sidan finns inte.</h1>
      <p>Den här sidan har gått vilse. Vi hjälper dig tillbaka.</p>
      <Link to="/" className="btn btn-big">
        <IconBack /> Till startsidan
      </Link>
    </div>
  );
}

/** Startadressen öppnar den del man senast använde, annars valet mellan delarna. */
function RootRedirect() {
  const { navigate } = useRouter();
  const last = getLastPart();
  useEffect(() => {
    if (last) navigate(last === 'lek' ? '/lek' : '/lar', { replace: true });
  }, [last, navigate]);
  return last ? null : <StartPage />;
}

const TITLES: [string, string][] = [
  ['/lek', ''],
  ['/lar/amne', 'Ämne'],
  ['/lar/ova', 'Övning'],
  ['/installera', 'Lägg till på iPad'],
  ['/hjalp', 'För vuxna'],
  ['/skola', 'Skolan'],
  ['/elev', 'Elev'],
  ['/larare', 'Lärare'],
  ['/foralder', 'Förälder'],
  ['/ova', 'Öva ämnen'],
  ['/arbetsblad', 'Arbetsblad'],
  ['/in', 'Elev'],
];

function Routes() {
  const { path } = useRouter();
  const gameMatch = path.match(/^\/spel\/([a-z]+)$/);
  const meta = gameMatch ? getGame(gameMatch[1]) : undefined;

  // Utseende: Leklabbet (lek) eller Lärlabbet (lar). Elevsidorna väljer själva efter klassens årskurs.
  useLayoutEffect(() => {
    if (path === '/elev' || path.startsWith('/elev/uppdrag')) return;
    if (path === '/elev/logga-in' || path.startsWith('/in/')) setMode('lek');
    else if (path === '/' || path === '/start') setMode(getLastPart() ?? 'lar');
    else setMode(modeForPath(path));
  }, [path]);

  useEffect(() => {
    const t = meta?.title ?? TITLES.find(([p]) => path === p || path.startsWith(p + '/'))?.[1];
    const brand = path === '/' || path === '/start' ? APP_NAME : BRAND[getMode()].name;
    document.title = t ? `${t} – ${brand}` : brand;
  }, [path, meta]);

  if (path === '/') return <RootRedirect />;
  if (path === '/start') return <StartPage />;
  if (path === '/lek') return <Home />;
  if (path === '/lar') return <LarHome />;
  let lm = match(path, '/lar/amne/:id');
  if (lm) return <LarSubject key={lm.id} id={lm.id} />;
  if ((lm = match(path, '/lar/ova/:id'))) return <LarActivity key={lm.id} id={lm.id} />;
  if (path === '/installera') return <Installera />;
  if (path === '/hjalp') return <Hjalp />;
  if (meta) {
    const Game = GAME_COMPONENTS[meta.id];
    return <Game key={meta.id} meta={meta} />;
  }

  // Skolan
  if (path === '/skola') return <Skola />;
  if (path === '/elev/logga-in') return <ElevLogin />;
  let m = match(path, '/in/:code');
  if (m) return <ElevLogin key={m.code} code={m.code} />;
  if (path === '/elev') return <ElevHome />;
  if ((m = match(path, '/elev/uppdrag/:aid/:item'))) return <ElevUppgift key={path} assignmentId={m.aid} item={Number(m.item)} />;
  if (path === '/larare') return <LarareHome />;
  if ((m = match(path, '/larare/klass/:cid/kort'))) return <KortPage classId={m.cid} />;
  if ((m = match(path, '/larare/klass/:cid/uppdrag/nytt'))) return <UppdragEditorPage classId={m.cid} />;
  if ((m = match(path, '/larare/klass/:cid/uppdrag/:aid'))) return <UppdragEditorPage classId={m.cid} assignmentId={m.aid} />;
  if ((m = match(path, '/larare/klass/:cid/:tab'))) return <KlassPage classId={m.cid} tab={m.tab} />;
  if ((m = match(path, '/larare/klass/:cid'))) return <KlassPage classId={m.cid} />;
  if (path === '/foralder') return <ForalderHome />;

  if (path === '/arbetsblad') return <Arbetsblad />;

  // Övningar
  if (path === '/ova') return <OvaLibrary />;
  if ((m = match(path, '/ova/ak/:g'))) return <OvaLibrary key={path} grade={Math.min(6, Math.max(0, Number(m.g) || 0)) as Grade} />;
  if ((m = match(path, '/ova/amne/:s'))) return <OvaLibrary key={path} subject={m.s as SubjectId} />;
  if ((m = match(path, '/ova/:id'))) return <OvaActivity id={m.id} />;
  return <NotFound />;
}

function UpdateToast() {
  const [show, setShow] = useState(false);
  useEffect(() => onUpdateAvailable(() => setShow(true)), []);
  if (!show) return null;
  return (
    <div className="toast" role="status">
      <span>En ny version av Lärlabbet finns.</span>
      <button className="btn" onClick={applyUpdate}>
        Uppdatera
      </button>
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <main className="app">
        <Suspense fallback={<Loading />}>
          <Routes />
        </Suspense>
      </main>
      <UpdateToast />
    </RouterProvider>
  );
}
