import type { PublicState } from './game';
import { QuizError, type HostLink, type PlayerLink, type PlayerMsg } from './link';

/** Demoläget: flikar i samma webbläsare pratar via BroadcastChannel. */
type Wire = { k: 'state'; s: PublicState } | { k: 'hello' } | { k: 'msg'; m: PlayerMsg } | { k: 'ping' } | { k: 'pong' };

const channelName = (code: string) => `larlabbet-quiz-${code}`;

function playerId(code: string) {
  const key = `larlabbet-quiz-pid-${code}`;
  try {
    const old = sessionStorage.getItem(key);
    if (old) return old;
    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Finns det redan ett quiz med koden (i någon annan flik)? */
function codeTaken(code: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ch = new BroadcastChannel(channelName(code));
    const t = setTimeout(() => {
      ch.close();
      resolve(false);
    }, 250);
    ch.onmessage = (e: MessageEvent<Wire>) => {
      if (e.data.k === 'pong' || e.data.k === 'state') {
        clearTimeout(t);
        ch.close();
        resolve(true);
      }
    };
    ch.postMessage({ k: 'ping' } satisfies Wire);
  });
}

export async function hostLocal(makeCode: () => string) {
  for (let i = 0; i < 20; i++) {
    const code = makeCode();
    if (!(await codeTaken(code))) return { code, link: await rehostLocal(code) };
  }
  throw new QuizError('Kunde inte skapa en kod. Försök igen.');
}

export async function rehostLocal(code: string): Promise<HostLink> {
  const ch = new BroadcastChannel(channelName(code));
  let last: PublicState | null = null;
  const subs = new Set<(m: PlayerMsg) => void>();
  ch.onmessage = (e: MessageEvent<Wire>) => {
    const w = e.data;
    if (w.k === 'ping') ch.postMessage({ k: 'pong' } satisfies Wire);
    else if (w.k === 'hello' && last) ch.postMessage({ k: 'state', s: last } satisfies Wire);
    else if (w.k === 'msg') subs.forEach((cb) => cb(w.m));
  };
  return {
    publish(s) {
      last = s;
      ch.postMessage({ k: 'state', s } satisfies Wire);
    },
    onMessage(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    close: () => ch.close(),
    end: () => ch.close(),
  };
}

export function joinLocal(code: string): Promise<{ link: PlayerLink; state: PublicState }> {
  return new Promise((resolve, reject) => {
    const ch = new BroadcastChannel(channelName(code));
    const subs = new Set<(s: PublicState) => void>();
    const pid = playerId(code);
    let first = true;
    let latest: PublicState;
    const timer = setTimeout(() => {
      ch.close();
      reject(new QuizError('Det finns inget quiz med den koden just nu. Kontrollera siffrorna.'));
    }, 1500);
    ch.onmessage = (e: MessageEvent<Wire>) => {
      const w = e.data;
      if (w.k !== 'state') return;
      latest = w.s;
      if (first) {
        first = false;
        clearTimeout(timer);
        resolve({
          state: w.s,
          link: {
            pid,
            send: (m) => ch.postMessage({ k: 'msg', m } satisfies Wire),
            onState(cb) {
              subs.add(cb);
              cb(latest); // det senaste läget, ifall något hann ändras
              return () => subs.delete(cb);
            },
            close: () => ch.close(),
          },
        });
        return;
      }
      subs.forEach((cb) => cb(w.s));
    };
    ch.postMessage({ k: 'hello' } satisfies Wire);
  });
}
