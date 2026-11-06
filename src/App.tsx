import { useEffect, useState, type ComponentType } from 'react';
import { IconBack } from './components/Icons';
import { LogoMark } from './components/Logo';
import BokstavsjaktenGame from './games/bokstavsjakten/BokstavsjaktenGame';
import MalarladanGame from './games/malarladan/MalarladanGame';
import MatteGame from './games/matte/MatteGame';
import MemoryGame from './games/memory/MemoryGame';
import MonsterGame from './games/monster/MonsterGame';
import { getGame, type GameMeta } from './games/registry';
import SantFalsktGame from './games/santfalskt/SantFalsktGame';
import StavningGame from './games/stavning/StavningGame';
import { Link, match, RouterProvider, useRouter } from './lib/router';
import { ElevHome, ElevLogin, ElevUppgift } from './pages/elev/Elev';
import { ForalderHome } from './pages/foralder/Foralder';
import { KlassPage, KortPage, LarareHome } from './pages/larare/Larare';
import { UppdragEditorPage } from './pages/larare/UppdragEditor';
import { OvaActivity, OvaLibrary } from './pages/Ova';
import Skola from './pages/skola/Skola';
import Arbetsblad from './pages/Arbetsblad';
import type { Grade, SubjectId } from './curriculum/types';
import { onUpdateAvailable, applyUpdate } from './lib/sw';
import Hjalp from './pages/Hjalp';
import Home from './pages/Home';
import Installera from './pages/Installera';

const GAME_COMPONENTS: Record<string, ComponentType<{ meta: GameMeta }>> = {
  memory: MemoryGame,
  bokstavsjakten: BokstavsjaktenGame,
  stavning: StavningGame,
  matte: MatteGame,
  monster: MonsterGame,
  santfalskt: SantFalsktGame,
  malarladan: MalarladanGame,
};

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

const TITLES: [string, string][] = [
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

  useEffect(() => {
    const t = meta?.title ?? TITLES.find(([p]) => path === p || path.startsWith(p + '/'))?.[1];
    document.title = path === '/' ? 'Leklandet – lek och lär' : t ? `${t} – Leklandet` : 'Leklandet';
  }, [path, meta]);

  if (path === '/') return <Home />;
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
      <span>En ny version av Leklandet finns.</span>
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
        <Routes />
      </main>
      <UpdateToast />
    </RouterProvider>
  );
}
