import { useCallback, useEffect, useState } from 'react';

/**
 * Räknar ut hur många kolumner ett rutnät med `count` kvadratiska rutor ska ha
 * för att rutorna ska bli så stora som möjligt i den yta som finns – både i
 * stående och liggande läge.
 */
export function bestColumns(count: number, width: number, height: number, gap: number, allowed?: number[]) {
  let best = { cols: 1, size: 0 };
  const options = allowed ?? Array.from({ length: count }, (_, i) => i + 1);
  for (const cols of options) {
    const rows = Math.ceil(count / cols);
    const size = Math.min((width - gap * (cols - 1)) / cols, (height - gap * (rows - 1)) / rows);
    if (size > best.size) best = { cols, size };
  }
  return best;
}

/** Mäter ett element (callback-ref, så att det fungerar även när elementet dyker upp senare). */
export function useElementSize<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useCallback((node: T | null) => setEl(node), []);
  useEffect(() => {
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', update);
    };
  }, [el]);
  return [ref, size] as const;
}
