# Leklandet

Svensk spelportal för barn 5–10 år, byggd som installerbar webbapp (PWA) för iPad.
Inget konto, ingen reklam, ingen spårning – allt sparas lokalt på enheten.

## Spel

| Spel | Kategori | Innehåll |
|---|---|---|
| Memory | Minne och logik | 8/12/16/20 kort, drag, tid, par, rekord per storlek |
| Bokstavsjakten | Bokstäver och ord | Hitta bilden som börjar på bokstaven. Lätt/Mellan/Svår (3/4/6 bilder) |
| Stavningsmästaren | Läsning och stavning | Bygg ordet med bokstavsbrickor. Ledtråd i två steg, ångra, ökande ordlängd |
| Matteäventyret | Matematik | Plus/minus/blandat, talområde 5–100, prickar som stöd upp till 10 |
| Mönsterdetektiven | Minne och logik | Genererade mönster: färg, form, bild, storlek, tal, prickar, vridning |
| Sant eller falskt | Quiz och kunskap | 51 påståenden med förklaringar, ämnesval |
| Målarlådan | Kreativitet | Fritt ritande, penslar, stämplar, sudd, ångra, spara bild |

## Kom igång

```bash
npm install
npm run dev        # utvecklingsserver
npm test           # enhetstester (spellogik)
npm run typecheck
npm run build      # bygger till dist/ och genererar dist/sw.js
npm run preview    # förhandsvisa bygget (service worker aktiv)
npm run icons      # återskapa ikoner och startbilder (kräver rsvg-convert)
```

## Distribution

`dist/` är en statisk webbplats. **HTTPS krävs** för att service workern ska registreras och för att
installationen på hemskärmen ska fungera fullt ut (undantag: `localhost`).

- **Vercel:** `vercel.json` finns (SPA-omskrivning och cachehuvuden). Byggkommando `npm run build`, utdatamapp `dist`.
- **Netlify / Cloudflare Pages:** `public/_redirects` och `public/_headers` följer med i bygget.
- Annan server: skicka alla okända sökvägar till `index.html`, och servera `sw.js` och `index.html` med `Cache-Control: no-cache`.

## Struktur

```
src/
  games/<spel>/logic.ts     spelregler och generering (rena funktioner, testade)
  games/<spel>/*Game.tsx    presentation
  games/useRound.ts         gemensam motor för frågespel (poäng, spärr mot dubbeltryck, sparande)
  games/registry.ts         spelkatalog, kategorier, sök
  components/               GameShell (intro/paus/slut), SVG-bilder, ikoner
  pages/                    startsida, /installera, /hjalp
  lib/                      router, lokal lagring, ljud (Web Audio), service worker, plattform
scripts/sw.template.js      service worker-mall
scripts/icons.py            genererar ikoner och iPad-startbilder
```

## PWA och offline

- Manifest: `public/manifest.webmanifest` (namn/short_name *Leklandet*, `display: standalone`).
- Ikoner: 32, 180 (apple-touch-icon), 192, 512 och maskable 512. 18 startbilder för iPad (stående/liggande).
- Service worker: precachar alla byggda filer i en versionsbunden cache (`leklandet-<hash>`).
  Navigering går nätverk-först med cachad app som reserv; statiska filer cache-först.
  Vid ny version visas "En ny version finns – Uppdatera", och gamla cacher tas bort vid aktivering.

## Data

`localStorage`: inställningar (ljud), bästa resultat, senast spelade. `sessionStorage`: pågående omgång,
så att en omladdning inte nollställer spelet. Allt kan nollställas under *För föräldrar och lärare*.
