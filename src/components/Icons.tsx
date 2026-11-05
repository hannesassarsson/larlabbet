import type { SVGProps } from 'react';

/** Enhetliga gränssnittsikoner (24×24, rundade linjer). */
type P = SVGProps<SVGSVGElement>;
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const IconBack = (p: P) => (
  <svg {...base} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconHome = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
  </svg>
);
export const IconPause = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 5v14M15 5v14" strokeWidth="3.2" />
  </svg>
);
export const IconPlay = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
  </svg>
);
export const IconRestart = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 12a8 8 0 1 0 2.5-5.8" />
    <path d="M4 4v4h4" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
);
export const IconSoundOn = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 10v4h4l5 4V6L8 10z" fill="currentColor" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);
export const IconSoundOff = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 10v4h4l5 4V6L8 10z" fill="currentColor" />
    <path d="M17 9.5l5 5M22 9.5l-5 5" />
  </svg>
);
export const IconStar = (p: P & { filled?: boolean }) => {
  const { filled = true, ...rest } = p;
  return (
    <svg {...base} {...rest}>
      <path
        d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
};
export const IconShare = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" />
  </svg>
);
export const IconAddSquare = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="3" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" strokeWidth="2.8" />
  </svg>
);
export const IconBulb = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
  </svg>
);
export const IconInfo = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" strokeWidth="2.8" />
  </svg>
);
export const IconClock = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
export const IconHand = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7.5c0 4-2.5 7-6.5 7-2.6 0-4.2-1.3-5.6-3.4L3.6 14.6a1.5 1.5 0 0 1 2.4-1.8L8 15" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
  </svg>
);
export const IconEraser = (p: P) => (
  <svg {...base} {...p}>
    <path d="M15 4l5 5-9.5 9.5H6L3.5 16a1.5 1.5 0 0 1 0-2.1z" />
    <path d="M10 9l5 5M10 20h10" />
  </svg>
);
export const IconUndo = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14" />
  </svg>
);
export const IconWifiOff = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4.5-2.5M19 13a10 10 0 0 0-2-1.6M2 9.5a15 15 0 0 1 4-2.6M22 9.5A15 15 0 0 0 11 5.8M12 20h.01" />
  </svg>
);
