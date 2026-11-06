import { BRAND, useMode, type Mode } from '../lib/mode';

/** Leklabbets märke: en glad sol som tittar fram bakom en grön kulle. */
export function LekMark({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <rect x="4" y="4" width="112" height="112" rx="32" fill="#FF8A5B" />
      <circle cx="60" cy="58" r="30" fill="#FFD166" />
      <circle cx="50" cy="54" r="5" fill="#3B2F5C" />
      <circle cx="70" cy="54" r="5" fill="#3B2F5C" />
      <circle cx="51.5" cy="52.5" r="1.6" fill="#fff" />
      <circle cx="71.5" cy="52.5" r="1.6" fill="#fff" />
      <path d="M49 66q11 9 22 0" stroke="#3B2F5C" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M4 92q28-20 56-6t56-4v10q0 24-24 24H28Q4 116 4 92z" fill="#7BD389" />
      <circle cx="30" cy="30" r="5" fill="#fff" opacity=".55" />
    </svg>
  );
}

/** Lärlabbets märke: en kolv med vätska och bubblor på mörkblå botten. */
export function LarMark({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <rect x="4" y="4" width="112" height="112" rx="28" fill="#1D2B4F" />
      <path d="M47 24h26M51 24v24L30 84a8 8 0 0 0 7 12h46a8 8 0 0 0 7-12L69 48V24" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 72h44l8 12a6 6 0 0 1-5 9H35a6 6 0 0 1-5-9z" fill="#2EC4B6" />
      <circle cx="54" cy="80" r="3.5" fill="#fff" opacity=".85" />
      <circle cx="64" cy="64" r="3" fill="#fff" opacity=".7" />
      <circle cx="58" cy="54" r="2.2" fill="#fff" opacity=".6" />
      <path d="M86 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FF8A5B" />
    </svg>
  );
}

/** Behålls för äldre anrop: följer aktuellt läge. */
export function LogoMark({ size = 56, mode }: { size?: number; mode?: Mode }) {
  const m = useMode();
  return (mode ?? m) === 'lek' ? <LekMark size={size} /> : <LarMark size={size} />;
}

export function Logo({ mode }: { mode?: Mode }) {
  const current = useMode();
  const m = mode ?? current;
  const b = BRAND[m];
  return (
    <span className={`logo logo-${m}`}>
      <LogoMark size={52} mode={m} />
      <span className="logo-word">
        {b.first}
        <span>{b.rest}</span>
      </span>
    </span>
  );
}
