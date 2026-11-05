/** Leklandets logotyp: en glad sol-boll som tittar fram bakom en grön kulle. */
export function LogoMark({ size = 56 }: { size?: number }) {
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

export function Logo() {
  return (
    <span className="logo">
      <LogoMark size={52} />
      <span className="logo-word">
        Lek<span>landet</span>
      </span>
    </span>
  );
}
