# Lärlabbet

Svensk plattform för lek och lärande, förskoleklass till årskurs 6, byggd som installerbar webbapp (PWA) för iPad.
Appen heter **Lärlabbet** och har två delar som delar innehåll och motor men ser olika ut:

| Del | Adress | För vem | Känsla |
|---|---|---|---|
| **Leklabbet** | `/lek` | F–3 | Lekfullt: bilder, figurer, stjärnor, ljud, stora knappar |
| **Lärlabbet** | `/lar` | 4–6, lärare, föräldrar | Skolmässigt: ämnen och kursplanens områden, resultat i procent, genomgång av fel, framsteg per övning |

`/` öppnar den del man senast valde, annars valet på `/start`. Elever som loggar in med kod hamnar i rätt del
utifrån klassens årskurs. Lärar-, föräldra- och arbetsbladssidorna använder Lärlabbets utseende.

- **Fri lek** – sju spel och ett övningsbibliotek. Inget konto, allt sparas lokalt.
- **Skolan** – lärare skapar klasser och ger uppdrag ur kursplanen, elever loggar in med kod eller QR, föräldrar följer sitt barn med en föräldrakod. Data i Firebase (Authentication + Firestore).
- Ingen reklam och ingen spårning.

## Innehåll enligt kursplanen

81 övningar, märkta med ämne, årskurs och område i Lgr22:s centrala innehåll:

| Ämne | Övningar | Exempel |
|---|---|---|
| Matematik F–6 | 26 | räkna, talraden, klockan, bråk, gångertabellen, decimaltal, negativa tal, procent, ekvationer, area, vinklar, lägesmått, koordinater, lästal, mönster |
| Svenska F–6 | 20 | läsförståelse (15 egna texter: berättelser, faktatexter, brev, instruktioner, tidtabell, argumenterande text), bokstavsljud, alfabetet, rim, stavning, stor bokstav och punkt, en/ett, plural, skiljetecken, ordklasser, verb i preteritum, sambandsord, sj-/tj-/j-ljud, texttyper |
| Engelska 1–6 | 13 | tolv färdiga glosteman och lärarens egna glosor (svenska→engelska, engelska→svenska, stava). Det engelska ordet läses upp efter rätt svar |
| SO F–6 | 12 | att leva tillsammans, kartan och grannländerna, högtider och traditioner, stenålder–järnålder, nordisk mytologi, förr och nu, tidslinjer, vikingatid–medeltid, Vasatiden och stormaktstiden, 1800-talet, geografi, samhället |
| NO F–6 | 10 | året runt i naturen, kroppen, material och vatten (flyta/sjunka), kraft, ljud och ljus, djurgrupper, ekologi och näringskedjor, människokroppen, el och energi (ledare/isolatorer), solsystemet, kemi i vardagen |

Engelska börjar i årskurs 1 eftersom kursplanen inte omfattar förskoleklass.

**Nya läroplaner:** en tioårig grundskola och nya läroplaner planeras från hösten 2028 (förskoleklassen blir årskurs 1).
Skolverkets förslag ska lämnas senast 14 maj 2027. Övningarna är därför märkta med område i stället för att byggas
in i en fast struktur – när de nya kursplanerna kommer räcker det att ändra märkningen i `src/curriculum/`.

## Arbetsblad att skriva ut (`/arbetsblad`)

För lärare och föräldrar som vill ha papper. Inget konto behövs.

1. Välj årskurs (och gärna ämne) och tryck **Föreslå ett blad** – eller lägg till övningar själv.
2. Justera nivå och antal uppgifter. Förhandsvisningen i A4 uppdateras direkt.
3. Tryck **Skriv ut** (eller välj ”Spara som PDF” i utskriftsrutan).

- Räknetal blir skrivuppgifter med svarslinje, glosor blir glosförhör, bildfrågor ringas in.
- **Facit** på egen sida. **Varianter A–D** ger olika frågor till bänkgrannar, var och en med eget facit.
- Varje blad har ett **bladnummer**. Samma nummer ger exakt samma frågor, så bladet kan skrivas ut igen.
- Blad kan sparas på enheten. Lärare kan skriva ut ett uppdrag direkt från klassens uppdragslista.
- Utskriften är testad genom att skriva ut till PDF i Chrome. Safari på iPad är inte testad.

## Klassquiz (`/quiz`)

Hela klassen svarar samtidigt, som i ett tävlingsquiz. Läraren visar tavlan, eleverna går med på sina plattor.

1. Läraren väljer ämne (eller alla ämnen), årskurs, gärna enskilda övningar, antal frågor (10–40) och tid per fråga.
2. Frågorna kommer från samma övningar som resten av appen, så det blir nya frågor varje gång (**Nya frågor**). Läraren kan ta bort enskilda frågor innan start.
3. Tavlan visar en sexsiffrig kod och en QR-kod. Eleverna går in på `/quiz/spela` eller skriver koden i samma ruta som elevkoden (**Jag har en kod**).
4. Rätt svar ger 500–1000 poäng beroende på hur snabbt, plus bonus för flera rätt i rad. Efter varje fråga visas hur klassen svarade och ställningen.
5. På slutet: pall, och resultat per fråga så att läraren ser vad klassen behöver gå igenom.

- Svaren har fyra färger med var sin form, så att färgblinda också kan skilja dem åt.
- Läraren kan ta bort en elev ur väntrummet, gå vidare med mellanslag eller en presentationsklicker, och ladda om tavlan utan att quizet försvinner.
- **Utan Firebase (demoläget)** fungerar quizet bara mellan flikar i samma webbläsare på samma enhet. Det räcker för att prova och för testerna, inte för en klass.
- **Med Firebase** går det via Firestore (`quizzes/{kod}`, se `firestore.rules`). Den delen är skriven men **inte provad mot ett riktigt Firebase-projekt**.

## Skolan: roller och behörigheter

| Roll | Inloggning | Ser |
|---|---|---|
| Lärare | E-post + lösenord | Sina klasser, elever, koder, uppdrag, glosor och resultat |
| Elev | Elevkod eller QR-länk (`/in/KOD`), anonym Firebase-inloggning | Sin egen elevpost och klassens uppdrag och glosor |
| Förälder | E-post + lösenord + föräldrakod | Bara det kopplade barnets uppdrag och resultat |

- Elever har inga e-postadresser eller lösenord – läraren ger dem ett alias och en bild.
- Byter läraren elevens koder slutar de gamla att fungera direkt, även för föräldrar och redan inloggade enheter.
- Koder går bara att slå upp en i taget, aldrig att lista.
- Reglerna finns i `firestore.rules`.

### Demoläge

Utan Firebase-konfiguration körs skoldelen i **demoläge**: allt sparas i webbläsaren på enheten, och en gul ruta talar om det.
Bra för att prova alla tre rollerna på samma dator. Lösenord sparas som SHA-256-hash lokalt, men demoläget är inte avsett för riktiga elever.

## Sätta upp Firebase (gratisplanen Spark)

1. Skapa ett projekt på [console.firebase.google.com](https://console.firebase.google.com). Google Analytics behövs inte.
2. **Authentication → Sign-in method:** aktivera **E-post/lösenord** och **Anonym**.
3. **Firestore Database → Skapa databas:** välj produktionsläge och en plats i Europa.
4. **Projektinställningar → Dina appar → Webbapp:** registrera en app och kopiera konfigurationen till `.env.local`
   (mall i `.env.example`).
5. Lägg in säkerhetsreglerna, antingen genom att klistra in `firestore.rules` under Firestore → Regler, eller:
   ```bash
   npx firebase-tools login
   npx firebase-tools use --add          # välj projektet
   npx firebase-tools deploy --only firestore:rules
   ```
6. Publicera appen gratis med HTTPS via Firebase Hosting (`firebase.json` finns):
   ```bash
   npm run build
   npx firebase-tools deploy --only hosting
   ```
   Adressen blir `https://<projekt-id>.web.app`. Den domänen är automatiskt godkänd för inloggning.

Firebase-koden (~205 kB komprimerat) laddas bara när någon öppnar skoldelen, så fri lek påverkas inte.
Kräver Safari 14 / iPadOS 14 eller senare.

### Innan riktiga elever används

- Skolan är personuppgiftsansvarig och behöver normalt ett personuppgiftsbiträdesavtal med den som driver tjänsten,
  och en konsekvensbedömning (DPIA).
- Välj en Firestore-plats i EU och läs Googles villkor för Firebase (databehandlingsavtal).
- Granska `firestore.rules` och testa dem i Firebase-konsolens regelsimulator eller med Firebase-emulatorn.

## Spel

| Spel | Kategori | Innehåll |
|---|---|---|
| Memory | Minne och logik | 8/12/16/20 kort, drag, tid, par, rekord per storlek |
| Bokstavsjakten | Bokstäver och ord | Hitta bilden som börjar på bokstaven. Lätt/Mellan/Svår (3/4/6 bilder) |
| Stavningsmästaren | Läsning och stavning | Bygg ordet med bokstavsbrickor. Ledtråd i två steg, ångra, ökande ordlängd |
| Matteäventyret | Matematik | Plus/minus/blandat, talområde 5–100, prickar som stöd upp till 10 |
| Mönsterdetektiven | Minne och logik | Genererade mönster: färg, form, bild, storlek, tal, prickar, vridning |
| Sant eller falskt | Quiz och kunskap | 51 påståenden med förklaringar, ämnesval |

Alla kursplaneövningar finns också fritt under **Öva ämnen** (`/ova`).
| Målarlådan | Kreativitet | Fritt ritande, penslar, stämplar, sudd, ångra, spara bild |

## Kom igång

```bash
npm install
npm run dev        # utvecklingsserver
npm test           # enhetstester (spellogik, kursplaneinnehåll, arbetsblad)
npm run test:e2e   # webbläsartester (bygger appen och kör den som på riktigt)
npm run check      # allt ovan plus typkontroll
npm run typecheck
npm run build      # bygger till dist/ och genererar dist/sw.js
npm run preview    # förhandsvisa bygget (service worker aktiv)
npm run icons      # återskapa ikoner och startbilder (kräver rsvg-convert)
```

## Tester

| Typ | Var | Vad |
|---|---|---|
| Enhetstester (Vitest) | `src/**/*.test.ts` | Spellogik, att varje övning på varje nivå ger giltiga frågor med exakt ett rätt svar, arbetsblad och facit |
| Webbläsartester (Playwright) | `e2e/*.spec.ts` | Alla spel till slutskärmen, Lärlabbet, skoldelen lärare → elev → förälder, arbetsblad och utskrift till A4-PDF, manifest, service worker och offline, layout och tryckytor på alla sidor |

- Webbläsartesterna körs mot ett riktigt produktionsbygge, i iPad-storlek **liggande och stående**.
- Varje test misslyckas automatiskt om sidan får ett JavaScript-fel (se `e2e/helpers.ts`).
- Testerna läser spelets sparade läge för att veta rätt svar, så att de kan spela igenom hela omgångar.
- `PW_WEBKIT=1 npm run test:e2e` kör också i Safaris motor (WebKit). Kräver `npx playwright install webkit`.
- GitHub kör allt vid varje push (`.github/workflows/tester.yml`). WebKit-jobbet blockerar inte.
- Vid fel: `npm run test:e2e:report` visar skärmdump och en inspelning av vad som hände.

Inte täckt: en riktig iPad (Safari på iPadOS skiljer sig från WebKit på Linux), Firebase och dess regler, VoiceOver.

## Distribution

`dist/` är en statisk webbplats. **HTTPS krävs** för att service workern ska registreras och för att
installationen på hemskärmen ska fungera fullt ut (undantag: `localhost`).

- **Firebase Hosting:** se ovan – passar bäst om skoldelen används.
- **Vercel:** `vercel.json` finns (SPA-omskrivning och cachehuvuden). Byggkommando `npm run build`, utdatamapp `dist`.
- **Netlify / Cloudflare Pages:** `public/_redirects` och `public/_headers` följer med i bygget.
- Annan server: skicka alla okända sökvägar till `index.html`, och servera `sw.js` och `index.html` med `Cache-Control: no-cache`.

## Struktur

```
src/
  curriculum/               kursplaneinnehåll: ämnen, årskurser, 81 övningar (generatorer och frågebanker)
  play/                     gemensam spelare för övningarna (flerval, ordning, stavning) och figurer
  backend/                  gränssnitt + demoläge (local.ts) + Firebase (firebase.ts)
  pages/skola, elev, larare, foralder   skoldelen
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
