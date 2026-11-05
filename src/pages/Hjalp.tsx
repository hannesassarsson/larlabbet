import { useEffect, useState } from 'react';
import { Overlay } from '../components/GameShell';
import { IconAddSquare, IconBack, IconTrash } from '../components/Icons';
import { SoundToggle } from '../components/SoundToggle';
import { CATEGORIES, GAMES } from '../games/registry';
import { HASH_MODE, Link, useRouter } from '../lib/router';
import { getHistory, getRecords, resetProgress } from '../lib/storage';
import { useStandalone } from '../lib/platform';

function useOfflineStatus() {
  const [state, setState] = useState<{ ready: boolean; version?: string }>({ ready: false });
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let alive = true;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'VERSION' && alive) setState({ ready: true, version: e.data.version });
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    navigator.serviceWorker.ready.then((reg) => {
      if (!alive) return;
      setState((s) => ({ ...s, ready: true }));
      reg.active?.postMessage({ type: 'GET_VERSION' });
    });
    return () => {
      alive = false;
      navigator.serviceWorker.removeEventListener('message', onMsg);
    };
  }, []);
  return state;
}

export default function Hjalp() {
  const { navigate } = useRouter();
  const standalone = useStandalone();
  const offline = useOfflineStatus();
  const [confirm, setConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);
  const records = getRecords();
  const plays = GAMES.reduce((n, g) => n + (records[g.id]?.plays ?? 0), 0);
  const hasData = plays > 0 || getHistory().length > 0;

  return (
    <div className="page info-page container">
      <div className="info-top">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Tillbaka till startsidan">
          <IconBack />
        </button>
      </div>
      <header className="info-hero plain">
        <div>
          <p className="hero-kicker">För föräldrar och lärare</p>
          <h1>Så fungerar Leklandet</h1>
          <p>
            Leklandet är en samling lugna, pedagogiska spel för barn ungefär 5–10 år. Barnet väljer själv spel och
            svårighetsgrad, och får positiv återkoppling längs vägen.
          </p>
        </div>
      </header>

      <section className="info-grid">
        <div className="card info-box">
          <h2>Spelen</h2>
          <ul className="game-list">
            {GAMES.map((g) => (
              <li key={g.id}>
                <i style={{ background: g.color }} />
                <div>
                  <b>{g.title}</b> <span className="muted">· {CATEGORIES.find((c) => c.id === g.categories[0])?.name} · {g.age}</span>
                  <p>{g.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card info-box">
          <h2>Tips</h2>
          <ul>
            <li>Inga spel har tidsgräns. Memory visar tiden, men den är bara för skojs skull.</li>
            <li>Alla spel har nivåer. Börja lätt och låt barnet själv välja att gå vidare.</li>
            <li>Sant eller falskt passar bra att läsa tillsammans med yngre barn.</li>
            <li>Pausknappen finns alltid uppe till höger, och en pågående omgång finns kvar om sidan laddas om.</li>
            <li>Ljudet är diskreta pip och plopp. Det startar först när barnet har tryckt på skärmen.</li>
          </ul>
        </div>

        <div className="card info-box">
          <h2>Integritet</h2>
          <ul>
            <li>Inget konto, ingen inloggning och ingen reklam.</li>
            <li>Ingen spårning och inga tredjepartstjänster. Leklandet hämtar inget från andra webbplatser.</li>
            <li>Resultat, historik och inställningar sparas bara lokalt på den här enheten.</li>
            <li>
              En webbapp på hemskärmen kan ha egen lagring, skild från Safari. Resultat som sparats i Safari följer därför
              inte alltid med till hemskärmsikonen.
            </li>
          </ul>
        </div>

        <div className="card info-box">
          <h2>Inställningar</h2>
          <div className="setting-row">
            <div>
              <b>Ljud</b>
              <p className="muted">Ljudeffekter i spelen.</p>
            </div>
            <SoundToggle withLabel />
          </div>
          <div className="setting-row">
            <div>
              <b>Sparade resultat</b>
              <p className="muted">
                {cleared ? 'Allt är nollställt.' : hasData ? `${plays} avslutade omgångar sparade på enheten.` : 'Inga sparade resultat ännu.'}
              </p>
            </div>
            <button className="btn btn-soft" onClick={() => setConfirm(true)} disabled={!hasData || cleared}>
              <IconTrash /> Nollställ
            </button>
          </div>
          <div className="setting-row">
            <div>
              <b>Offline</b>
              <p className="muted">
                {HASH_MODE
                  ? 'Förhandsvisning: offlineläget fungerar först när Leklandet ligger på en egen webbadress.'
                  : offline.ready
                  ? 'Spelen är nedladdade och fungerar utan internet.'
                  : 'Spelen laddas ned för offlinebruk när sidan öppnas via en säker adress (https).'}
                {offline.version && <> Version {offline.version}.</>}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!standalone && (
        <div className="card info-box install-cta">
          <div>
            <h2>Lägg till på hemskärmen</h2>
            <p>Med en ikon på hemskärmen öppnas Leklandet i helskärm, utan adressfält – och barnet hittar tillbaka själv.</p>
          </div>
          <Link to="/installera" className="btn btn-big">
            <IconAddSquare /> Visa guiden
          </Link>
        </div>
      )}

      {confirm && (
        <Overlay label="Nollställ resultat?" onClose={() => setConfirm(false)}>
          <h2>Nollställa allt?</h2>
          <p>Stjärnor, rekord och listan med senast spelade spel tas bort från enheten. Det går inte att ångra.</p>
          <div className="overlay-actions">
            <button
              className="btn btn-big"
              onClick={() => {
                resetProgress();
                setCleared(true);
                setConfirm(false);
              }}
            >
              <IconTrash /> Ja, nollställ
            </button>
            <button className="btn btn-big btn-soft" onClick={() => setConfirm(false)}>
              Avbryt
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}
