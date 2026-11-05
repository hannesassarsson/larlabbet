import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

/** Minimal router byggd på History API – inga extra beroenden. */
interface RouterValue {
  path: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterValue>({ path: '/', navigate: () => {} });

function normalize(p: string) {
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
  return p || '/';
}

/**
 * Förhandsläge (VITE_HASH_ROUTER=1): sidan ligger där bara enkla #namn-adresser
 * fungerar, t.ex. #installera eller #spel-memory. Annars används vanliga sökvägar.
 */
export const HASH_MODE = import.meta.env.VITE_HASH_ROUTER === '1';

function readPath() {
  if (!HASH_MODE) return normalize(window.location.pathname);
  const h = window.location.hash.replace(/^#/, '');
  if (!h) return '/';
  if (h.startsWith('spel-')) return '/spel/' + h.slice(5);
  return '/' + h;
}

/** Sökväg → adress i webbläsaren. */
export function hrefFor(path: string) {
  if (!HASH_MODE) return path;
  if (path === '/') return '#';
  return '#' + path.slice(1).replace(/^spel\//, 'spel-');
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const onPop = () => setPath(readPath());
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  const navigate = (to: string, opts?: { replace?: boolean }) => {
    const target = normalize(to);
    if (target === path) return;
    if (HASH_MODE) {
      const h = hrefFor(target);
      if (opts?.replace) location.replace(h === '#' ? location.pathname + location.search : h);
      else location.hash = h === '#' ? '' : h;
      setPath(target);
      window.scrollTo({ top: 0 });
      return;
    }
    if (opts?.replace) history.replaceState(null, '', target);
    else history.pushState(null, '', target);
    setPath(target);
    window.scrollTo({ top: 0 });
  };

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  return useContext(RouterContext);
}

/** Länk som navigerar inom appen utan att ladda om sidan. */
export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { navigate } = useRouter();
  return (
    <a
      href={hrefFor(to)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    />
  );
}
