/**
 * Registrerar service workern och sköter uppdateringar:
 * - En ny version laddas ned i bakgrunden.
 * - Appen visar "En ny version finns" och användaren väljer när den ska aktiveras,
 *   så att ett pågående spel inte avbryts mitt i.
 * - Gamla cacher tas bort av service workern när den nya versionen aktiveras.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let waiting: ServiceWorker | null = null;
let updateRequested = false;

function notify(w: ServiceWorker) {
  waiting = w;
  listeners.forEach((l) => l());
}

export function onUpdateAvailable(l: Listener) {
  listeners.add(l);
  if (waiting) l();
  return () => {
    listeners.delete(l);
  };
}

export function applyUpdate() {
  if (!waiting) {
    location.reload();
    return;
  }
  updateRequested = true;
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Ladda bara om när användaren själv har bett om uppdateringen
    // (inte när service workern tar kontroll första gången).
    if (reloading || !updateRequested) return;
    reloading = true;
    location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const hadController = !!navigator.serviceWorker.controller;
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      if (reg.waiting && hadController) notify(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) notify(nw);
        });
      });
      // Leta efter nya versioner när appen öppnas igen från hemskärmen.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch (err) {
      console.warn('Service worker kunde inte registreras', err);
    }
  });
}
