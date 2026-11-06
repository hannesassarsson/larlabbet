import { useMemo, useState } from 'react';
import { GameArt } from '../components/GameArt';
import { IconAddSquare, IconClose, IconInfo, IconPlay, IconSearch, IconStar } from '../components/Icons';
import { Logo } from '../components/Logo';
import { SoundToggle } from '../components/SoundToggle';
import { CATEGORIES, GAMES, getGame, searchGames, type CategoryId, type GameMeta } from '../games/registry';
import { Link } from '../lib/router';
import { getHistory, getRecords } from '../lib/storage';
import { useStandalone } from '../lib/platform';
import { ACTIVITIES } from '../curriculum';
import { SUBJECTS } from '../curriculum/types';

function CategoryIcon({ id }: { id: CategoryId }) {
  const c = '#3B2F5C';
  switch (id) {
    case 'bokstaver':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <text x="24" y="34" textAnchor="middle" fontSize="28" fontWeight="800" fill={c} fontFamily="ui-rounded, system-ui">
            Aa
          </text>
        </svg>
      );
    case 'lasning':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M8 12q8-3 16 2v24q-8-5-16-2zM40 12q-8-3-16 2v24q8-5 16-2z" fill="#fff" stroke={c} strokeWidth="3" strokeLinejoin="round" />
        </svg>
      );
    case 'matte':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 10v14M8 17h14M28 17h12M30 30l8 8M38 30l-8 8M8 34h14" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
    case 'logik':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M10 10h12v6a3 3 0 1 0 0 6v6H16a3 3 0 1 1-6 0zM26 20h6a3 3 0 1 1 6 0v18H26v-6a3 3 0 1 0 0-6z" fill="#fff" stroke={c} strokeWidth="3" strokeLinejoin="round" />
        </svg>
      );
    case 'kreativ':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M24 8c10 0 17 6 16 14-1 6-6 5-9 5s-4 3-3 6-1 7-5 7C14 40 8 33 8 24S14 8 24 8z" fill="#fff" stroke={c} strokeWidth="3" />
          <circle cx="17" cy="20" r="3" fill="#F25F8C" />
          <circle cx="25" cy="15" r="3" fill="#FFC53D" />
          <circle cx="33" cy="19" r="3" fill="#5BC0EB" />
          <circle cx="16" cy="29" r="3" fill="#7BD389" />
        </svg>
      );
    case 'quiz':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="16" fill="#fff" stroke={c} strokeWidth="3" />
          <path d="M19 19a5 5 0 1 1 7 4.6c-1.4.6-2 1.5-2 3v1" stroke={c} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="24" cy="33" r="2.2" fill={c} />
        </svg>
      );
  }
}

function GameCard({ game, stars }: { game: GameMeta; stars?: number }) {
  const cats = game.categories.map((c) => CATEGORIES.find((x) => x.id === c)!);
  return (
    <Link to={`/spel/${game.id}`} className="game-card" style={{ ['--game' as string]: game.color, ['--game-soft' as string]: game.soft }}>
      <div className="game-card-art">
        <GameArt id={game.id} bg={game.soft} />
        {stars ? (
          <span className="game-card-stars" aria-label={`Bästa: ${stars} stjärnor`}>
            {Array.from({ length: 3 }, (_, i) => (
              <IconStar key={i} filled={i < stars} width={20} height={20} />
            ))}
          </span>
        ) : null}
      </div>
      <div className="game-card-body">
        <h3>{game.title}</h3>
        <p>{game.description}</p>
        <div className="game-card-meta">
          <span className="tag" style={{ background: cats[0].soft }}>
            {cats[0].name}
          </span>
          <span className="age">{game.age}</span>
        </div>
      </div>
      <span className="game-card-play" aria-hidden="true">
        <IconPlay />
      </span>
    </Link>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<CategoryId | 'alla'>('alla');
  const standalone = useStandalone();
  const history = useMemo(() => getHistory().map((h) => getGame(h.gameId)).filter(Boolean) as GameMeta[], []);
  const records = useMemo(getRecords, []);
  const results = searchGames(query, cat);

  const chooseCategory = (id: CategoryId | 'alla') => {
    setCat(id);
    document.getElementById('spel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page home">
      <header className="home-header container">
        <Logo />
        <nav className="home-nav" aria-label="Huvudmeny">
          {!standalone && (
            <Link to="/installera" className="btn btn-soft nav-install">
              <IconAddSquare /> <span>Lägg till på iPad</span>
            </Link>
          )}
          <Link to="/skola" className="btn btn-soft nav-install">
            <span className="nav-school-dot" aria-hidden="true" /> <span>Skolan</span>
          </Link>
          <SoundToggle />
        </nav>
      </header>

      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-text">
          <p className="hero-kicker">Hej på dig!</p>
          <h1 id="hero-title">Vad vill du leka idag?</h1>
          <p className="hero-lead">Spel om bokstäver, ord, siffror, mönster och mycket mer. Välj ett spel och sätt igång!</p>
          <a href="#spel" className="btn btn-big hero-cta" onClick={(e) => { e.preventDefault(); chooseCategory('alla'); }}>
            <IconPlay /> Visa alla spel
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <HeroIllustration />
        </div>
      </section>

      {history.length > 0 && (
        <section className="container section" aria-labelledby="continue-title">
          <h2 id="continue-title" className="section-title">Fortsätt leka</h2>
          <div className="continue-row">
            {history.slice(0, 4).map((g) => (
              <Link key={g.id} to={`/spel/${g.id}`} className="continue-card" style={{ ['--game' as string]: g.color, ['--game-soft' as string]: g.soft }}>
                <span className="continue-art">
                  <GameArt id={g.id} bg={g.soft} />
                </span>
                <span className="continue-text">
                  <b>{g.title}</b>
                  <small>{records[g.id]?.plays ? `Spelat ${records[g.id].plays} ${records[g.id].plays === 1 ? 'gång' : 'gånger'}` : 'Fortsätt där du var'}</small>
                </span>
                <span className="continue-play" aria-hidden="true">
                  <IconPlay />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container section" aria-labelledby="school-title">
        <div className="library-head">
          <h2 id="school-title" className="section-title">
            Skolämnen F–6
          </h2>
          <div className="home-school-links">
            <Link to="/arbetsblad" className="btn btn-soft">
              Arbetsblad att skriva ut
            </Link>
            <Link to="/skola" className="btn btn-soft">
              Logga in som elev, lärare eller förälder
            </Link>
          </div>
        </div>
        <div className="subject-grid">
          {SUBJECTS.map((sub) => (
            <Link key={sub.id} to={`/ova/amne/${sub.id}`} className="subject-card" style={{ ['--subject' as string]: sub.color, ['--subject-soft' as string]: sub.soft }}>
              <b>{sub.short}</b>
              <span>{ACTIVITIES.filter((a) => a.subject === sub.id).length} övningar</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section" aria-labelledby="cat-title">
        <h2 id="cat-title" className="section-title">Spelkategorier</h2>
        <div className="category-grid">
          {CATEGORIES.map((c) => {
            const count = GAMES.filter((g) => g.categories.includes(c.id)).length;
            return (
              <button
                key={c.id}
                className="category-tile"
                style={{ background: c.soft, ['--cat' as string]: c.color }}
                onClick={() => chooseCategory(c.id)}
                aria-pressed={cat === c.id}
              >
                <span className="category-icon" style={{ background: c.color }}>
                  <CategoryIcon id={c.id} />
                </span>
                <span className="category-name">{c.name}</span>
                <small>{count} spel</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="container section" id="spel" aria-labelledby="lib-title">
        <div className="library-head">
          <h2 id="lib-title" className="section-title">Spelbiblioteket</h2>
          <label className="search">
            <IconSearch />
            <span className="visually-hidden">Sök bland spelen</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök spel, t.ex. matte"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')} aria-label="Rensa sökningen">
                <IconClose />
              </button>
            )}
          </label>
        </div>
        <div className="filter-row" role="group" aria-label="Filtrera på kategori">
          <button className="chip" aria-pressed={cat === 'alla'} onClick={() => setCat('alla')}>
            Alla spel
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              <i className="chip-dot" style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
        </div>

        <p className="visually-hidden" aria-live="polite">
          {results.length} spel visas
        </p>
        {results.length ? (
          <div className="game-grid">
            {results.map((g) => (
              <GameCard key={g.id} game={g} stars={records[g.id]?.stars} />
            ))}
          </div>
        ) : (
          <div className="empty card">
            <svg viewBox="0 0 120 90" width="140" aria-hidden="true">
              <circle cx="52" cy="40" r="26" fill="#FFF1C9" stroke="#3B2F5C" strokeWidth="5" />
              <path d="M71 59l20 20" stroke="#3B2F5C" strokeWidth="8" strokeLinecap="round" />
              <circle cx="44" cy="36" r="3" fill="#3B2F5C" />
              <circle cx="60" cy="36" r="3" fill="#3B2F5C" />
              <path d="M44 50q8-5 16 0" stroke="#3B2F5C" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </svg>
            <h3>Hittade inga spel</h3>
            <p>Prova ett annat ord eller visa alla spel.</p>
            <button
              className="btn"
              onClick={() => {
                setQuery('');
                setCat('alla');
              }}
            >
              Visa alla spel
            </button>
          </div>
        )}
      </section>

      <footer className="container home-footer">
        <Link to="/hjalp" className="footer-link">
          <IconInfo /> För föräldrar och lärare
        </Link>
        {!standalone && (
          <Link to="/installera" className="footer-link">
            <IconAddSquare /> Så lägger du till Leklandet på iPad
          </Link>
        )}
        <p className="footer-note">Ingen reklam och ingen spårning. Fri lek kräver inget konto och sparas bara på den här enheten.</p>
      </footer>
    </div>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 420 320" className="hero-svg">
      <defs>
        <clipPath id="hero-clip">
          <rect x="10" y="10" width="400" height="300" rx="60" />
        </clipPath>
      </defs>
      <g clipPath="url(#hero-clip)">
        <rect x="10" y="10" width="400" height="300" fill="#D8F0FB" />
        <circle cx="330" cy="80" r="40" fill="#FFD166" className="hero-sun" />
        <g fill="#fff">
          <ellipse cx="110" cy="70" rx="40" ry="16" />
          <ellipse cx="140" cy="60" rx="26" ry="18" />
        </g>
        <path d="M10 230q100-70 210-20t190-30v140H10z" fill="#7BD389" />
        <path d="M10 270q120-40 220 0t180-10v70H10z" fill="#5DBB6F" />
        {/* Bokstavsklossar */}
        <g className="hero-float a">
          <rect x="70" y="150" width="64" height="64" rx="18" fill="#FF8A5B" />
          <text x="102" y="196" textAnchor="middle" fontSize="40" fontWeight="800" fill="#3B2F5C" fontFamily="ui-rounded, system-ui">A</text>
        </g>
        <g className="hero-float b">
          <rect x="150" y="120" width="64" height="64" rx="18" fill="#A78BFA" />
          <text x="182" y="166" textAnchor="middle" fontSize="40" fontWeight="800" fill="#3B2F5C" fontFamily="ui-rounded, system-ui">B</text>
        </g>
        <g className="hero-float c">
          <rect x="230" y="160" width="64" height="64" rx="18" fill="#FFD166" />
          <text x="262" y="206" textAnchor="middle" fontSize="38" fontWeight="800" fill="#3B2F5C" fontFamily="ui-rounded, system-ui">3</text>
        </g>
        {/* Uggla på kullen */}
        <g transform="translate(300 170) scale(.9)">
          <path d="M26 30 22 12l16 10zM74 30l4-18-16 10z" fill="#8C5A3C" />
          <ellipse cx="50" cy="54" rx="30" ry="34" fill="#A0674B" />
          <ellipse cx="50" cy="66" rx="18" ry="18" fill="#E9C9A5" />
          <circle cx="38" cy="40" r="12" fill="#fff" />
          <circle cx="62" cy="40" r="12" fill="#fff" />
          <circle cx="39" cy="41" r="6" fill="#3B2F5C" />
          <circle cx="61" cy="41" r="6" fill="#3B2F5C" />
          <path d="M46 50h8l-4 7z" fill="#FFB347" />
        </g>
        <g fill="#F25F8C">
          <circle cx="60" cy="250" r="7" />
          <circle cx="200" cy="262" r="6" />
          <circle cx="380" cy="280" r="7" />
        </g>
      </g>
    </svg>
  );
}
