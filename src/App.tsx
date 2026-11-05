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
import { Link, RouterProvider, useRouter } from './lib/router';
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

const TITLES: Record<string, string> = {
  '/': 'Leklandet – lek och lär',
  '/installera': 'Lägg till på iPad – Leklandet',
  '/hjalp': 'För vuxna – Leklandet',
};

function Routes() {
  const { path } = useRouter();
  const gameMatch = path.match(/^\/spel\/([a-z]+)$/);
  const meta = gameMatch ? getGame(gameMatch[1]) : undefined;

  useEffect(() => {
    document.title = meta ? `${meta.title} – Leklandet` : TITLES[path] ?? 'Leklandet';
  }, [path, meta]);

  if (path === '/') return <Home />;
  if (path === '/installera') return <Installera />;
  if (path === '/hjalp') return <Hjalp />;
  if (meta) {
    const Game = GAME_COMPONENTS[meta.id];
    return <Game key={meta.id} meta={meta} />;
  }
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
