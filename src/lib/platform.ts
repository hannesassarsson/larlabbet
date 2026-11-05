import { useEffect, useState } from 'react';

/**
 * Försiktig plattformsdetektion. Används bara för att anpassa texten i
 * installationsguiden – aldrig för att stänga av funktioner. Resultatet är
 * en gissning, och guiden visar alltid de allmänna stegen.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

export function useStandalone() {
  const [v, setV] = useState(isStandalone);
  useEffect(() => {
    const mq = window.matchMedia?.('(display-mode: standalone)');
    const on = () => setV(isStandalone());
    mq?.addEventListener?.('change', on);
    return () => mq?.removeEventListener?.('change', on);
  }, []);
  return v;
}

export type BrowserGuess = 'ios-safari' | 'ios-other-browser' | 'ios-in-app' | 'other';

export function guessBrowser(): { device: 'ipad' | 'iphone' | 'other'; browser: BrowserGuess } {
  const ua = navigator.userAgent;
  // iPadOS 13+ utger sig för att vara en Mac, men har pekskärm.
  const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const iphone = /iPhone|iPod/.test(ua);
  const ios = ipad || iphone;
  const device = ipad ? 'ipad' : iphone ? 'iphone' : 'other';
  if (!ios) return { device, browser: 'other' };
  if (/FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|GSA\//.test(ua)) return { device, browser: 'ios-in-app' };
  if (/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(ua)) return { device, browser: 'ios-other-browser' };
  return { device, browser: 'ios-safari' };
}
