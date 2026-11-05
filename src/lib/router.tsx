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

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalize(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalize(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to: string, opts?: { replace?: boolean }) => {
    const target = normalize(to);
    if (target === path) return;
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
      href={to}
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
