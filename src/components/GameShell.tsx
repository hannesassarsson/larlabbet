import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { GameMeta } from '../games/registry';
import { useRouter } from '../lib/router';
import { markPlayed } from '../lib/storage';
import { play } from '../lib/sound';
import { GameArt } from './GameArt';
import { IconBack, IconHome, IconPause, IconPlay, IconRestart, IconStar } from './Icons';
import { SoundToggle } from './SoundToggle';

/* ------------------------------------------------------------------
 * Gemensamma byggstenar för alla spel: intro, toppfält, paus, slutskärm.
 * ------------------------------------------------------------------ */

export type Phase = 'intro' | 'playing' | 'done';

/** Vart "tillbaka" leder. Startsidan som standard, elevens sida när spelet är ett uppdrag. */
export const ExitContext = createContext('/');
const useExit = () => useContext(ExitContext);

export function GameIntro({
  meta,
  onStart,
  children,
  startLabel = 'Börja spela',
  resumable,
  onResume,
}: {
  meta: GameMeta;
  onStart: () => void;
  children?: ReactNode;
  startLabel?: string;
  resumable?: boolean;
  onResume?: () => void;
}) {
  const { navigate } = useRouter();
  const exit = useExit();
  return (
    <div className="game-intro page" style={{ ['--game' as string]: meta.color, ['--game-soft' as string]: meta.soft }}>
      <div className="game-intro-top">
        <button className="icon-btn" onClick={() => navigate(exit)} aria-label="Tillbaka till startsidan">
          <IconBack />
        </button>
        <SoundToggle />
      </div>
      <div className="game-intro-card card">
        <div className="game-intro-art">
          <GameArt id={meta.id} bg={meta.soft} />
        </div>
        <div className="game-intro-body">
          <h1>{meta.title}</h1>
          <p className="game-intro-lead">{meta.description}</p>
          <ol className="howto">
            {meta.howTo.map((step, i) => (
              <li key={i}>
                <span className="howto-num" aria-hidden="true">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          {children && <div className="game-setup">{children}</div>}
          <div className="game-intro-actions">
            {resumable && onResume && (
              <button className="btn btn-big btn-soft" onClick={onResume}>
                <IconPlay /> Fortsätt där du var
              </button>
            )}
            <button
              className="btn btn-big"
              onClick={() => {
                markPlayed(meta.id);
                play('pop');
                onStart();
              }}
            >
              <IconPlay /> {resumable ? 'Ny omgång' : startLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Enkel väljare med stora knappar (svårighetsgrad, storlek m.m.). */
export function ChoiceGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="choice-fieldset">
      <legend>{label}</legend>
      <div className="choice-group" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className="choice"
            onClick={() => {
              play('tap');
              onChange(o.value);
            }}
          >
            {o.label}
            {o.hint && <small>{o.hint}</small>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function GameTopBar({
  meta,
  progress,
  stats,
  onPause,
  onRestart,
}: {
  meta: GameMeta;
  progress?: { value: number; max: number };
  stats?: ReactNode;
  onPause: () => void;
  onRestart: () => void;
}) {
  const { navigate } = useRouter();
  const exit = useExit();
  const [confirm, setConfirm] = useState(false);
  return (
    <header className="game-topbar">
      <button className="icon-btn" onClick={() => navigate(exit)} aria-label="Tillbaka till startsidan">
        <IconHome />
      </button>
      <div className="game-topbar-mid">
        <h1 className="game-topbar-title">{meta.title}</h1>
        {progress && (
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.max}
            aria-valuenow={progress.value}
            aria-label="Hur långt du har kommit"
          >
            <span style={{ width: `${(progress.value / progress.max) * 100}%` }} />
          </div>
        )}
      </div>
      {stats && <div className="game-stats">{stats}</div>}
      <button className="icon-btn" onClick={() => setConfirm(true)} aria-label="Börja om">
        <IconRestart />
      </button>
      <button className="icon-btn" onClick={onPause} aria-label="Pausa">
        <IconPause />
      </button>
      {confirm && (
        <Overlay onClose={() => setConfirm(false)} label="Börja om?">
          <h2>Börja om?</h2>
          <p>Den här omgången försvinner och du får börja från början.</p>
          <div className="overlay-actions">
            <button
              className="btn btn-big"
              onClick={() => {
                setConfirm(false);
                onRestart();
              }}
            >
              <IconRestart /> Ja, börja om
            </button>
            <button className="btn btn-big btn-soft" onClick={() => setConfirm(false)}>
              Nej, spela vidare
            </button>
          </div>
        </Overlay>
      )}
    </header>
  );
}

export function Stat({ icon, value, label }: { icon?: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="stat" aria-label={`${label}: ${typeof value === 'string' || typeof value === 'number' ? value : ''}`}>
      {icon}
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialogruta. Fokus flyttas in i rutan och stannar där (Tab går runt), Escape
 * stänger, och när rutan stängs hamnar fokus där det var innan. Resten av sidan
 * döljs för skärmläsare medan rutan är öppen.
 */
export function Overlay({ children, onClose, label }: { children: ReactNode; onClose?: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // Läses vid första renderingen, innan autoFocus i rutan hinner flytta fokus.
  const beforeRef = useRef(typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null);
  useEffect(() => {
    const box = ref.current!;
    const before = beforeRef.current;
    // Fokusera knappen med autoFocus om det finns en, annars första knappen, annars rutan.
    if (!box.contains(document.activeElement)) (box.querySelector<HTMLElement>(FOCUSABLE) ?? box).focus();
    // Dölj allt utom rutan: syskonen på varje nivå från rutan upp till <body>.
    const hidden: HTMLElement[] = [];
    for (let node: HTMLElement | null = box.closest<HTMLElement>('.overlay'); node && node !== document.body; node = node.parentElement) {
      for (const el of Array.from(node.parentElement?.children ?? []) as HTMLElement[]) {
        if (el === node || el.hasAttribute('aria-hidden') || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('inert', '');
        hidden.push(el);
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current?.();
      if (e.key !== 'Tab') return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      for (const el of hidden) {
        el.removeAttribute('aria-hidden');
        el.removeAttribute('inert');
      }
      if (before && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={label}>
      <div className="overlay-card card pop" ref={ref} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

export function PauseOverlay({
  onResume,
  onRestart,
  onSettings,
}: {
  onResume: () => void;
  onRestart: () => void;
  onSettings?: () => void;
}) {
  const { navigate } = useRouter();
  const exit = useExit();
  return (
    <Overlay onClose={onResume} label="Paus">
      <div className="pause-badge" aria-hidden="true">
        <IconPause />
      </div>
      <h2>Paus</h2>
      <p>Spelet väntar på dig.</p>
      <div className="overlay-actions">
        <button className="btn btn-big" onClick={onResume} autoFocus>
          <IconPlay /> Fortsätt
        </button>
        <button className="btn btn-big btn-soft" onClick={onRestart}>
          <IconRestart /> Börja om
        </button>
        {onSettings && (
          <button className="btn btn-big btn-soft" onClick={onSettings}>
            Byt nivå
          </button>
        )}
        <button className="btn btn-big btn-soft" onClick={() => navigate(exit)}>
          <IconHome /> Till startsidan
        </button>
      </div>
      <div className="pause-sound">
        <SoundToggle withLabel />
      </div>
    </Overlay>
  );
}

export function Stars({ count, max = 3, size = 48 }: { count: number; max?: number; size?: number }) {
  return (
    <div className="stars" role="img" aria-label={`${count} av ${max} stjärnor`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < count ? 'star on' : 'star'} style={{ animationDelay: `${0.15 + i * 0.15}s` }}>
          <IconStar width={size} height={size} filled={i < count} />
        </span>
      ))}
    </div>
  );
}

const PRAISE = ['Snyggt jobbat!', 'Vad duktig du är!', 'Toppen!', 'Strålande!', 'Du klarade det!'];

export function GameEnd({
  meta,
  stars,
  title,
  lines,
  record,
  onAgain,
  onSettings,
}: {
  meta: GameMeta;
  stars: number;
  title?: string;
  lines: { label: string; value: ReactNode }[];
  record?: boolean;
  onAgain: () => void;
  onSettings?: () => void;
}) {
  const { navigate } = useRouter();
  const exit = useExit();
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  useEffect(() => {
    play('win');
  }, []);
  return (
    <div className="game-end page" style={{ ['--game' as string]: meta.color, ['--game-soft' as string]: meta.soft }}>
      <div className="game-end-card card pop">
        <Confetti />
        <Stars count={stars} />
        <h1>{title ?? praise}</h1>
        {record && <p className="record-badge">Nytt rekord!</p>}
        <dl className="end-lines">
          {lines.map((l) => (
            <div key={l.label}>
              <dt>{l.label}</dt>
              <dd>{l.value}</dd>
            </div>
          ))}
        </dl>
        <div className="overlay-actions">
          <button className="btn btn-big" onClick={onAgain} autoFocus>
            <IconRestart /> Spela igen
          </button>
          {onSettings && (
            <button className="btn btn-big btn-soft" onClick={onSettings}>
              Byt nivå
            </button>
          )}
          <button className="btn btn-big btn-soft" onClick={() => navigate(exit)}>
            <IconHome /> Fler spel
          </button>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#FF8A5B', '#FFD166', '#7BD389', '#5BC0EB', '#A78BFA', '#F25F8C'];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.08}s`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/** Kort, positiv återkopplingsbubbla. */
export function Feedback({ kind, children }: { kind: 'good' | 'oops' | 'info'; children: ReactNode }) {
  return (
    <div className={`feedback feedback-${kind} pop`} role="status" aria-live="polite">
      {children}
    </div>
  );
}

export function starsFrom(correct: number, total: number) {
  const r = total ? correct / total : 0;
  return r >= 0.9 ? 3 : r >= 0.6 ? 2 : r > 0 ? 1 : 0;
}

export const GOOD_WORDS = ['Rätt!', 'Bra!', 'Snyggt!', 'Ja, precis!', 'Superbra!', 'Toppen!'];
export const OOPS_WORDS = ['Nästan!', 'Försök igen!', 'Inte riktigt – prova en gång till!'];
