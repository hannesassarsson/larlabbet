import { useMemo } from 'react';
import { IconAddSquare, IconBack, IconCheck, IconShare } from '../components/Icons';
import { LogoMark } from '../components/Logo';
import { HASH_MODE, Link, useRouter } from '../lib/router';
import { guessBrowser, useStandalone } from '../lib/platform';

const INK = '#3B2F5C';

/* ---------- Illustrationer för varje steg (egna SVG) ---------- */

function IpadFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 220" className="step-svg" aria-hidden="true">
      <rect x="6" y="6" width="308" height="208" rx="26" fill={INK} />
      <rect x="18" y="18" width="284" height="184" rx="14" fill="#fff" />
      {children}
    </svg>
  );
}

const SafariBar = ({ highlight }: { highlight?: boolean }) => (
  <g>
    <rect x="18" y="18" width="284" height="34" rx="14" fill="#F2F0F7" />
    <rect x="18" y="38" width="284" height="14" fill="#F2F0F7" />
    <rect x="86" y="26" width="148" height="18" rx="9" fill="#fff" />
    <text x="160" y="39" textAnchor="middle" fontSize="10" fill={INK} fontFamily="ui-rounded, system-ui">leklandet</text>
    <g transform="translate(250 22)">
      {highlight && <circle cx="13" cy="13" r="17" fill="#FFD166" className="pulse" />}
      <path d="M13 5v11M9 9l4-4 4 4M9 12H7v10h12V12h-2" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </g>
);

function Step1Art() {
  return (
    <IpadFrame>
      <SafariBar />
      <g transform="translate(130 80)">
        <circle cx="30" cy="30" r="30" fill="#5BC0EB" />
        <circle cx="30" cy="30" r="24" fill="#fff" />
        <path d="M30 10l6 20-6 20-6-20z" fill="#EF4B4B" transform="rotate(45 30 30)" />
        <path d="M30 30l6 20h-12z" fill="#C9C3D9" transform="rotate(45 30 30)" />
      </g>
      <text x="160" y="170" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK} fontFamily="ui-rounded, system-ui">Safari</text>
    </IpadFrame>
  );
}

function Step2Art() {
  return (
    <IpadFrame>
      <SafariBar highlight />
      <g transform="translate(110 80) scale(.8)">
        <LogoArt />
      </g>
      <path d="M232 100q20-20 24-46" stroke="#FF8A5B" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="2 8" />
      <path d="M248 58l9-6 2 11" stroke="#FF8A5B" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </IpadFrame>
  );
}

function Step3Art() {
  const rows = ['Kopiera', 'Lägg till i bokmärken', 'Lägg till på hemskärmen', 'Skriv ut'];
  return (
    <IpadFrame>
      <SafariBar />
      <rect x="150" y="56" width="140" height="138" rx="14" fill="#F2F0F7" />
      {rows.map((r, i) => {
        const hl = i === 2;
        return (
          <g key={r} transform={`translate(158 ${66 + i * 31})`}>
            <rect width="124" height="26" rx="8" fill={hl ? '#FFD166' : '#fff'} />
            <text x="8" y="17" fontSize="8" fontWeight={hl ? 800 : 500} fill={INK} fontFamily="ui-rounded, system-ui">
              {r}
            </text>
            {hl && (
              <g transform="translate(104 5)">
                <rect width="16" height="16" rx="4" fill="none" stroke={INK} strokeWidth="1.8" />
                <path d="M8 4v8M4 8h8" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}
    </IpadFrame>
  );
}

function Step4Art() {
  return (
    <IpadFrame>
      <rect x="18" y="18" width="284" height="184" rx="14" fill="#E9E6F2" />
      <rect x="70" y="40" width="180" height="140" rx="16" fill="#fff" />
      <text x="90" y="62" fontSize="10" fill="#8A84A3" fontFamily="ui-rounded, system-ui">Avbryt</text>
      <g transform="translate(206 50)">
        <rect width="38" height="18" rx="9" fill="#FFD166" className="pulse" />
        <text x="19" y="12.5" textAnchor="middle" fontSize="9" fontWeight="800" fill={INK} fontFamily="ui-rounded, system-ui">Lägg till</text>
      </g>
      <g transform="translate(88 84) scale(.4)">
        <LogoArt />
      </g>
      <rect x="140" y="92" width="92" height="22" rx="6" fill="#F2F0F7" />
      <text x="148" y="107" fontSize="11" fontWeight="800" fill={INK} fontFamily="ui-rounded, system-ui">Leklandet</text>
      <rect x="140" y="122" width="70" height="8" rx="4" fill="#E9E6F2" />
    </IpadFrame>
  );
}

function Step5Art() {
  const apps = ['#5BC0EB', '#7BD389', '#A78BFA', '#F25F8C', '#FFC53D', '#2EC4B6'];
  return (
    <IpadFrame>
      <rect x="18" y="18" width="284" height="184" rx="14" fill="#BFE3F7" />
      {apps.map((c, i) => (
        <rect key={i} x={46 + (i % 6) * 40} y="40" width="28" height="28" rx="8" fill={c} opacity=".75" />
      ))}
      {apps.slice(0, 3).map((c, i) => (
        <rect key={'b' + i} x={46 + i * 40} y="90" width="28" height="28" rx="8" fill={c} opacity=".75" />
      ))}
      <g transform="translate(166 82)">
        <circle cx="22" cy="22" r="30" fill="#FFD166" opacity=".7" className="pulse" />
        <g transform="scale(.37)">
          <LogoArt />
        </g>
      </g>
      <text x="188" y="142" textAnchor="middle" fontSize="9" fontWeight="800" fill={INK} fontFamily="ui-rounded, system-ui">Leklandet</text>
      <g transform="translate(176 150)">
        <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7.5c0 4-2.5 7-6.5 7-2.6 0-4.2-1.3-5.6-3.4L3.6 14.6a1.5 1.5 0 0 1 2.4-1.8L8 15" fill="#fff" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" transform="scale(1.6)" />
      </g>
    </IpadFrame>
  );
}

/** Samma motiv som appikonen. */
function LogoArt() {
  return (
    <g>
      <rect x="0" y="0" width="120" height="120" rx="30" fill="#FF8A5B" />
      <circle cx="60" cy="56" r="30" fill="#FFD166" />
      <circle cx="50" cy="52" r="5" fill={INK} />
      <circle cx="70" cy="52" r="5" fill={INK} />
      <path d="M49 64q11 9 22 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M0 90q28-20 56-6t64-4v10q0 30-30 30H30Q0 120 0 90z" fill="#7BD389" />
    </g>
  );
}

const STEPS = [
  { title: 'Öppna Safari', text: 'Öppna Leklandet i webbläsaren Safari på din iPad.', Art: Step1Art },
  {
    title: 'Tryck på Dela',
    text: 'Tryck på Dela-symbolen – fyrkanten med pilen uppåt. Den brukar finnas uppe till höger.',
    Art: Step2Art,
    symbol: <IconShare />,
  },
  {
    title: 'Lägg till på hemskärmen',
    text: 'Bläddra i delningsmenyn om det behövs och välj ”Lägg till på hemskärmen”.',
    Art: Step3Art,
    symbol: <IconAddSquare />,
  },
  { title: 'Bekräfta', text: 'Kontrollera att namnet är Leklandet och tryck på ”Lägg till”.', Art: Step4Art },
  { title: 'Börja spela', text: 'Gå till hemskärmen och tryck på Leklandets ikon. Klart!', Art: Step5Art },
];

export default function Installera() {
  const { navigate } = useRouter();
  const standalone = useStandalone();
  const guess = useMemo(guessBrowser, []);

  let notice: React.ReactNode = null;
  if (HASH_MODE) {
    notice = (
      <div className="notice notice-warn">
        <b>Det här är en förhandsvisning.</b>
        <p>Här kan du prova spelen och se guiden. Själva installationen på hemskärmen och offlineläget fungerar först när Leklandet ligger på en egen webbadress.</p>
      </div>
    );
  } else if (standalone) {
    notice = (
      <div className="notice notice-good">
        <IconCheck />
        <div>
          <b>Leklandet är redan installerat!</b>
          <p>Du har öppnat Leklandet från hemskärmen. Det finns inget mer att göra.</p>
        </div>
      </div>
    );
  } else if (guess.browser === 'ios-in-app') {
    notice = (
      <div className="notice notice-warn">
        <b>Det ser ut som att sidan är öppen inuti en annan app.</b>
        <p>Öppna Leklandet i Safari först. Leta efter ”Öppna i Safari” eller kopiera adressen och klistra in den i Safari.</p>
      </div>
    );
  } else if (guess.browser === 'ios-other-browser') {
    notice = (
      <div className="notice notice-warn">
        <b>Det ser ut som att du använder en annan webbläsare än Safari.</b>
        <p>Det fungerar säkrast i Safari. Öppna samma adress i Safari och följ stegen nedan.</p>
      </div>
    );
  } else if (guess.device === 'other') {
    notice = (
      <div className="notice">
        <b>Guiden är gjord för iPad.</b>
        <p>Öppna den här sidan i Safari på iPaden som barnet ska använda. På iPhone fungerar stegen nästan likadant.</p>
      </div>
    );
  }

  return (
    <div className="page info-page container">
      <div className="info-top">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Tillbaka till startsidan">
          <IconBack />
        </button>
      </div>
      <header className="info-hero">
        <LogoMark size={84} />
        <div>
          <h1>Lägg till Leklandet på iPaden</h1>
          <p>Då får Leklandet en egen ikon på hemskärmen och öppnas i helskärm – precis som en app. Det tar under en minut.</p>
        </div>
      </header>

      {notice}

      <ol className="install-steps">
        {STEPS.map(({ title, text, Art, symbol }, i) => (
          <li key={title} className="install-step card">
            <div className="install-art">
              <Art />
            </div>
            <div className="install-text">
              <span className="install-num">Steg {i + 1}</span>
              <h2>{title}</h2>
              <p>{text}</p>
              {symbol && (
                <p className="look-for">
                  <span>Leta efter:</span>
                  <span className="look-icon">{symbol}</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <section className="info-grid">
        <div className="card info-box">
          <h2>Hittar du inte ”Lägg till på hemskärmen”?</h2>
          <ul>
            <li>Kontrollera att sidan är öppen i <b>Safari</b>, inte i en annan app eller webbläsare.</li>
            <li>Bläddra nedåt i delningsmenyn – alternativet kan ligga längre ner i listan.</li>
            <li>Ser du ingen Dela-knapp? Tryck på adressfältet eller på knappen med tre prickar så brukar den dyka upp.</li>
            <li>Om du får ett val om att öppna som webbapp, låt det vara påslaget.</li>
            <li>Har du privat surfning påslagen? Prova i en vanlig flik.</li>
          </ul>
        </div>
        <div className="card info-box">
          <h2>Bra att veta</h2>
          <ul>
            <li>
              <b>Inte via App Store.</b> Leklandet är en webbapp. Den läggs till direkt från Safari och kräver inget konto eller Apple-ID.
            </li>
            <li>
              <b>Internet första gången.</b> Första gången behöver iPaden vara uppkopplad så att spelen kan laddas ned. Sedan går de att spela även utan internet.
            </li>
            <li>
              <b>Ta bort?</b> Håll fingret på ikonen och välj att ta bort den, som med vilken app som helst.
            </li>
          </ul>
        </div>
      </section>

      <div className="info-actions">
        <Link to="/" className="btn btn-big">
          Till spelen
        </Link>
        <Link to="/hjalp" className="btn btn-big btn-soft">
          Mer för vuxna
        </Link>
      </div>
    </div>
  );
}
