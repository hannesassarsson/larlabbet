import { shuffle, type Rng } from '../lib/random';
import { mc } from './build';
import type { Activity, Passage, Question } from './types';

/**
 * Läsförståelse. Alla texter är skrivna för Lärlabbet.
 * Frågorna blandar tre sorter, som i kursplanen och i nationella prov:
 * - att hitta det som står i texten,
 * - att förstå ord i sitt sammanhang,
 * - att dra slutsatser och förstå budskapet ("läsa mellan raderna").
 */
interface TextQuestion {
  q: string;
  a: string;
  w: string[];
  /** Förklaring som visas efter svaret, gärna med var i texten svaret finns. */
  e?: string;
}

interface ReadingText extends Passage {
  level: 'kort' | 'mellan' | 'lang';
  questions: TextQuestion[];
}

export const TEXTS: ReadingText[] = [
  /* ================= Korta texter (åk 1) ================= */
  {
    id: 'kalle-bollen',
    level: 'kort',
    genre: 'berättelse',
    title: 'Bollen',
    text: 'Kalle har en röd boll. Han sparkar bollen till Sara. Sara sparkar tillbaka.\n\nBollen rullar in under en buske. Hunden Bus springer fram och hittar den.',
    questions: [
      { q: 'Vilken färg har bollen?', a: 'Röd', w: ['Blå', 'Gul'] },
      { q: 'Vem sparkar bollen till Sara?', a: 'Kalle', w: ['Bus', 'Pappa'] },
      { q: 'Vart rullar bollen?', a: 'Under en buske', w: ['Ut på gatan', 'In i huset'] },
      { q: 'Vem hittar bollen?', a: 'Hunden Bus', w: ['Sara', 'Kalle'] },
    ],
  },
  {
    id: 'katten-mimmi',
    level: 'kort',
    genre: 'berättelse',
    title: 'Katten Mimmi',
    text: 'Mimmi är en liten grå katt. Hon bor hos Ali.\n\nMimmi tycker om att sova i solen. På kvällen får hon fisk. Sedan sover hon i Alis säng.',
    questions: [
      { q: 'Vad heter katten?', a: 'Mimmi', w: ['Ali', 'Missan'] },
      { q: 'Vilken färg har katten?', a: 'Grå', w: ['Svart', 'Vit'] },
      { q: 'Vad äter Mimmi på kvällen?', a: 'Fisk', w: ['Glass', 'Gräs'] },
      { q: 'Var sover Mimmi på natten?', a: 'I Alis säng', w: ['I solen', 'I en korg'] },
    ],
  },
  {
    id: 'regnet',
    level: 'kort',
    genre: 'berättelse',
    title: 'Plask!',
    text: 'Det regnar ute. Ella tar på sig gula stövlar och en regnjacka.\n\nHon hoppar i en stor vattenpöl. Plask! Vattnet skvätter högt. Nu är byxorna blöta.',
    questions: [
      { q: 'Hur är vädret?', a: 'Det regnar', w: ['Det snöar', 'Solen skiner'] },
      { q: 'Vad har Ella på fötterna?', a: 'Gula stövlar', w: ['Röda skor', 'Inga skor alls'] },
      { q: 'Vad gör Ella i vattenpölen?', a: 'Hon hoppar', w: ['Hon simmar', 'Hon fiskar'] },
      { q: 'Varför blir byxorna blöta?', a: 'Vattnet skvätter när hon hoppar', w: ['Hon tvättar dem', 'Hon sitter i badkaret'], e: 'Det står inte rakt ut, men vattnet skvätter högt när hon hoppar i pölen.' },
    ],
  },
  {
    id: 'bondgarden',
    level: 'kort',
    genre: 'berättelse',
    title: 'Hos morfar',
    text: 'Morfar har en bondgård. Där finns tre kor, en häst och många höns.\n\nVarje morgon hämtar Noah ägg i hönshuset. I dag hittar han sju ägg.',
    questions: [
      { q: 'Vem har en bondgård?', a: 'Morfar', w: ['Noah', 'Mamma'] },
      { q: 'Hur många kor finns det?', a: 'Tre', w: ['Sju', 'En'] },
      { q: 'Vad hämtar Noah?', a: 'Ägg', w: ['Mjölk', 'Hö'] },
      { q: 'Hur många ägg hittar Noah i dag?', a: 'Sju', w: ['Tre', 'Tio'] },
    ],
  },
  {
    id: 'bullar',
    level: 'kort',
    genre: 'berättelse',
    title: 'Lisa bakar',
    text: 'Lisa ska baka bullar med pappa. De tar fram mjöl, mjölk och socker.\n\nBullarna får stå i ugnen en stund. Snart luktar det gott i hela köket.',
    questions: [
      { q: 'Vad bakar Lisa?', a: 'Bullar', w: ['Pizza', 'Bröd'] },
      { q: 'Vem bakar Lisa med?', a: 'Pappa', w: ['Mormor', 'En kompis'] },
      { q: 'Var står bullarna en stund?', a: 'I ugnen', w: ['I kylen', 'I frysen'] },
      { q: 'Hur luktar det i köket?', a: 'Gott', w: ['Illa', 'Det luktar ingenting'] },
    ],
  },

  /* ================= Mellanlånga texter (åk 2–3) ================= */
  {
    id: 'igelkotten',
    level: 'mellan',
    genre: 'berättelse',
    title: 'Ljudet bakom huset',
    text:
      'En kväll i oktober hörde Maja ett prasslande ljud bakom huset. Hon tände ficklampan och gick försiktigt ut. Under en hög med löv låg en liten igelkott och nosade.\n\nMaja sprang in och hämtade mamma.\n– Den letar nog efter ett ställe att sova på i vinter, sa mamma.\n\nTillsammans byggde de ett litet hus av brädor och fyllde det med torra löv. Nästa morgon var igelkotten borta, men i lövhögen syntes små spår.',
    questions: [
      { q: 'När hände det här?', a: 'En kväll i oktober', w: ['En morgon i maj', 'På julafton'], e: 'Det står i första meningen.' },
      { q: 'Vad hörde Maja?', a: 'Ett prasslande ljud', w: ['En hund som skällde', 'Någon som ropade'] },
      { q: 'Vad betyder ”försiktigt” i texten?', a: 'Lugnt och varsamt', w: ['Snabbt och slarvigt', 'Högt och glatt'] },
      { q: 'Vad letade igelkotten efter, enligt mamma?', a: 'Ett ställe att sova på i vinter', w: ['Mat till sina ungar', 'Vatten att dricka'] },
      { q: 'Vad var de små spåren i lövhögen, tror du?', a: 'Igelkottens spår', w: ['Majas spår', 'Spår efter en bil'], e: 'Igelkotten hade varit i lövhögen. Det står inte rakt ut – du drar en slutsats.' },
    ],
  },
  {
    id: 'solrosen',
    level: 'mellan',
    genre: 'instruktion',
    title: 'Så planterar du en solros',
    text:
      'Du behöver: ett solrosfrö, en kruka, jord och vatten.\n\n1. Fyll krukan med jord.\n2. Gör ett hål i jorden, ungefär två centimeter djupt.\n3. Lägg fröet i hålet och täck över med jord.\n4. Vattna lite.\n5. Ställ krukan i ett soligt fönster.\n\nEfter ungefär en vecka kommer ett litet grönt skott upp. När plantan har blivit stor kan du plantera den ute.',
    questions: [
      { q: 'Vilken sorts text är det här?', a: 'En instruktion', w: ['En saga', 'En dikt'], e: 'Den berättar steg för steg hur man gör.' },
      { q: 'Vad gör du först?', a: 'Fyller krukan med jord', w: ['Vattnar', 'Lägger fröet i hålet'] },
      { q: 'Hur djupt ska hålet vara?', a: 'Ungefär två centimeter', w: ['Ungefär två meter', 'Så djupt som krukan'] },
      { q: 'Var ska krukan stå?', a: 'I ett soligt fönster', w: ['I en mörk garderob', 'I kylskåpet'] },
      { q: 'När kommer det första skottet upp?', a: 'Efter ungefär en vecka', w: ['Samma dag', 'Efter ett år'] },
    ],
  },
  {
    id: 'delfiner',
    level: 'mellan',
    genre: 'faktatext',
    title: 'Delfiner',
    text:
      'Delfiner lever i hav över hela världen. De ser ut som fiskar, men de är däggdjur. Det betyder att ungarna dricker mjölk från sin mamma.\n\nDelfiner måste upp till ytan för att andas. De andas genom ett hål på huvudet som kallas blåshål.\n\nDelfiner lever i grupper. De pratar med varandra med klickljud och visslingar.',
    questions: [
      { q: 'Vilken djurgrupp hör delfinen till?', a: 'Däggdjur', w: ['Fiskar', 'Fåglar'], e: 'Det står i första stycket: ”de är däggdjur”.' },
      { q: 'Hur vet man att delfinen är ett däggdjur?', a: 'Ungarna dricker mjölk från mamman', w: ['Den simmar fort', 'Den lever i havet'] },
      { q: 'Vad kallas hålet som delfinen andas genom?', a: 'Blåshål', w: ['Gäle', 'Näsborre'] },
      { q: 'Hur pratar delfiner med varandra?', a: 'Med klickljud och visslingar', w: ['Med ord', 'De pratar inte alls'] },
      { q: 'Vad handlar texten mest om?', a: 'Hur delfiner lever', w: ['Hur man fiskar', 'En delfin som heter Doris'] },
    ],
  },
  {
    id: 'brevet',
    level: 'mellan',
    genre: 'brev',
    title: 'Ett brev från mormor',
    text:
      'Hej Omar!\n\nTack för teckningen du skickade. Jag har satt upp den på kylskåpet.\n\nHär i Kiruna har det redan kommit snö, och i går såg jag norrsken på himlen. Det var grönt och dansade fram och tillbaka.\n\nKommer du och hälsar på i jul? Då kan vi åka pulka.\n\nKram från mormor',
    questions: [
      { q: 'Vem har skrivit brevet?', a: 'Mormor', w: ['Omar', 'Mamma'] },
      { q: 'Vad har Omar skickat till mormor?', a: 'En teckning', w: ['Ett paket', 'Ett foto'] },
      { q: 'Var bor mormor?', a: 'I Kiruna', w: ['I Malmö', 'Det står inte'] },
      { q: 'Vad såg mormor på himlen?', a: 'Norrsken', w: ['Ett flygplan', 'En regnbåge'] },
      { q: 'Vad vill mormor att de ska göra i jul?', a: 'Åka pulka', w: ['Bada', 'Plocka svamp'] },
    ],
  },
  {
    id: 'schemat',
    level: 'mellan',
    genre: 'schema',
    title: 'Klass 3B, måndag',
    text: '08.15  Svenska\n09.10  Matematik\n10.00  Rast\n10.20  Idrott\n11.30  Lunch\n12.15  Engelska\n13.00  Skolan slutar',
    questions: [
      { q: 'Vilket ämne börjar dagen med?', a: 'Svenska', w: ['Matematik', 'Idrott'] },
      { q: 'Vad gör klassen klockan 10.20?', a: 'Har idrott', w: ['Äter lunch', 'Har rast'] },
      { q: 'När äter klassen lunch?', a: 'Klockan 11.30', w: ['Klockan 10.00', 'Klockan 13.00'] },
      { q: 'Vilket ämne kommer efter lunchen?', a: 'Engelska', w: ['Svenska', 'Idrott'] },
      { q: 'Hur länge är rasten?', a: '20 minuter', w: ['10 minuter', 'En timme'], e: 'Rasten börjar 10.00 och idrotten 10.20.' },
    ],
  },

  /* ================= Längre texter (åk 4–6) ================= */
  {
    id: 'vikingarnas-handel',
    level: 'lang',
    genre: 'faktatext',
    title: 'Vikingarna handlade',
    text:
      'När vi tänker på vikingar tänker många på krig och plundring. Men de flesta vikingar var bönder, och många var också handelsmän.\n\nFrån Sverige reste vikingar ofta österut. De seglade över Östersjön och fortsatte på floder genom det som i dag är Ryssland och Ukraina. På vägen sålde de pälsar, järn och honung. I utbyte fick de bland annat silvermynt, glaspärlor och siden.\n\nPå Gotland har man hittat tusentals arabiska silvermynt från vikingatiden. Fynden visar att handelsvägarna nådde ända till dagens Mellanöstern.',
    questions: [
      { q: 'Vad var de flesta vikingar, enligt texten?', a: 'Bönder', w: ['Krigare', 'Kungar'], e: 'Det står i första stycket.' },
      { q: 'Varför seglade vikingarna på floder?', a: 'Floderna var vägar långt in i landet', w: ['De var rädda för havet', 'Det fanns ingen is där'], e: 'De fortsatte på floderna för att komma långt österut.' },
      { q: 'Vilka varor sålde vikingarna?', a: 'Pälsar, järn och honung', w: ['Silvermynt, glaspärlor och siden', 'Bilar och båtar'] },
      { q: 'Vad betyder ”i utbyte” i texten?', a: 'Som betalning för det de sålde', w: ['Gratis', 'När de kom hem'] },
      { q: 'Vad visar silvermynten på Gotland?', a: 'Att handeln nådde långt bort', w: ['Att vikingarna gjorde egna mynt', 'Att Gotland var rikt på silver'] },
    ],
  },
  {
    id: 'plast-i-havet',
    level: 'lang',
    genre: 'argumenterande text',
    title: 'Vi måste använda mindre plast',
    text:
      'Varje år hamnar stora mängder plast i haven. Plast bryts ned mycket långsamt. En plastpåse kan finnas kvar i naturen i hundratals år.\n\nNär plasten till slut går sönder blir den till små bitar som kallas mikroplast. Fiskar och fåglar tror att bitarna är mat. Då kan djuren bli sjuka.\n\nDärför tycker jag att vi alla ska använda mindre plast. Vi kan ta med egna påsar när vi handlar och dricka ur en flaska som går att fylla på. Om alla hjälps åt gör det stor skillnad.',
    questions: [
      { q: 'Vilken sorts text är det här?', a: 'En argumenterande text', w: ['En saga', 'En instruktion'], e: 'Skribenten vill övertyga läsaren om något.' },
      { q: 'Vad vill skribenten att läsaren ska göra?', a: 'Använda mindre plast', w: ['Fiska mer', 'Flytta till havet'] },
      { q: 'Vad betyder ”bryts ned” i texten?', a: 'Försvinner sakta när det går sönder', w: ['Byggs upp', 'Blir starkare'] },
      { q: 'Vilket är ett argument i texten?', a: 'Djur kan bli sjuka av mikroplast', w: ['Plast är billigt', 'Påsar är praktiska'] },
      { q: 'Vilket ord visar att skribenten drar en slutsats?', a: 'Därför', w: ['Varje', 'Mycket'] },
    ],
  },
  {
    id: 'nya-eleven',
    level: 'lang',
    genre: 'berättelse',
    title: 'Första dagen',
    text:
      'Linnea stod utanför klassrummet och höll hårt i sin ryggsäck. Hon hade flyttat från Umeå bara en vecka tidigare, och hon kände ingen här. Magen pirrade.\n\nNär hon kom in tittade alla på henne. Hon satte sig längst bak och stirrade ner i bänken.\n\nPå lunchen satt hon ensam. Då kom en tjej med lockigt hår fram.\n– Får jag sitta här? frågade hon. Jag heter Amira. Jag var också ny förra året.\n\nLinnea log för första gången den dagen.',
    questions: [
      { q: 'Varför kände Linnea ingen i klassen?', a: 'Hon hade nyss flyttat', w: ['Hon hade varit sjuk länge', 'Hon gick i fel klass'] },
      { q: 'Hur kände sig Linnea i början?', a: 'Nervös', w: ['Arg', 'Uttråkad'], e: 'Hon höll hårt i ryggsäcken och det pirrade i magen.' },
      { q: 'Vad betyder det att magen ”pirrade”?', a: 'Att hon var spänd och orolig', w: ['Att hon var hungrig', 'Att hon hade ont'] },
      { q: 'Varför gick Amira fram till Linnea, tror du?', a: 'Hon visste hur det kändes att vara ny', w: ['Hon ville låna pengar', 'Läraren sa åt henne'], e: 'Amira berättar att hon själv var ny förra året.' },
      { q: 'Vad handlar texten mest om?', a: 'Hur det kan kännas att vara ny', w: ['Hur man flyttar', 'Skolmaten i Umeå'] },
    ],
  },
  {
    id: 'solceller',
    level: 'lang',
    genre: 'faktatext',
    title: 'El från solen',
    text:
      'En solcell är en tunn platta som omvandlar solljus till elektricitet. Många solceller tillsammans bildar en solpanel. Solpaneler kan sitta på tak, på fält eller till och med på en miniräknare.\n\nSolceller ger el utan att något bränns. Därför släpper de inte ut några avgaser när de används. Men de ger bara el när det är ljust. En molnig dag blir det mindre el, och på natten blir det ingen alls.\n\nFör att kunna använda el från solen även på kvällen kan man spara den i ett batteri.',
    questions: [
      { q: 'Vad gör en solcell?', a: 'Omvandlar solljus till el', w: ['Värmer upp vatten', 'Gör solen starkare'] },
      { q: 'Vad betyder ”omvandlar” i texten?', a: 'Gör om till något annat', w: ['Tar bort', 'Flyttar'] },
      { q: 'Vad är en fördel med solceller, enligt texten?', a: 'De släpper inte ut avgaser', w: ['De fungerar bäst på natten', 'De är gratis att köpa'] },
      { q: 'När ger solceller ingen el alls?', a: 'På natten', w: ['På sommaren', 'När det blåser'] },
      { q: 'Varför kan man behöva ett batteri?', a: 'För att använda solel när det är mörkt', w: ['För att solcellerna ska bli större', 'För att det står så i lagen'] },
    ],
  },
  {
    id: 'tagtidtabell',
    level: 'lang',
    genre: 'schema',
    title: 'Tåget från Bäckby',
    text:
      'Tidtabell, vardagar\n\nBäckby  avgår 07.12\nGranås  07.27\nSjöstad  07.41\nStorstad central  ankommer 08.02\n\nTåget går varje timme fram till 21.12. På lördagar och söndagar går det varannan timme.',
    questions: [
      { q: 'Hur lång tid tar resan från Bäckby till Storstad central?', a: '50 minuter', w: ['30 minuter', '1 timme och 50 minuter'], e: 'Från 07.12 till 08.02 är det 50 minuter.' },
      { q: 'Vilken station kommer efter Granås?', a: 'Sjöstad', w: ['Bäckby', 'Storstad central'] },
      { q: 'När går nästa tåg från Bäckby efter 07.12 en vardag?', a: '08.12', w: ['07.27', '09.12'], e: 'Tåget går varje timme.' },
      { q: 'När går det sista tåget en vardag?', a: '21.12', w: ['08.02', '23.12'] },
      { q: 'Hur ofta går tåget på en söndag?', a: 'Varannan timme', w: ['Varje timme', 'Inte alls'] },
    ],
  },
];

function questionsFrom(texts: ReadingText[], count: number, rng?: Rng): Question[] {
  const out: Question[] = [];
  const order = shuffle(texts, rng);
  let round = 0;
  while (out.length < count && round < 4) {
    for (const t of order) {
      if (out.length >= count) break;
      const passage: Passage = { id: t.id, title: t.title, text: t.text, genre: t.genre };
      // Frågorna kommer i textens ordning, så att eleven läser texten en gång.
      for (const tq of t.questions) {
        if (out.length >= count) break;
        out.push({ ...mc(tq.q, tq.a, tq.w, rng, { explain: tq.e }), passage });
      }
    }
    round++;
  }
  return out;
}

export const LASNING_ACTIVITIES: Activity[] = [
  {
    id: 'sv-lasforstaelse',
    title: 'Läsförståelse',
    description: 'Läs en kort text och svara på frågorna. Berättelser, faktatexter, brev och scheman.',
    subject: 'svenska',
    grades: [1, 3],
    area: 'Berättande texter och faktatexter',
    readAloud: true,
    levels: [
      { value: 'kort', label: 'Korta texter', hint: 'Några meningar' },
      { value: 'mellan', label: 'Lite längre', hint: 'Flera stycken' },
    ],
    defaultLevel: 'kort',
    generate: (level = 'kort', count, rng) => questionsFrom(TEXTS.filter((t) => t.level === level), count, rng),
  },
  {
    id: 'sv-lasforstaelse-4-6',
    title: 'Läsförståelse – längre texter',
    description: 'Faktatexter, berättelser och argumenterande texter. Hitta svaren, förstå ord och dra slutsatser.',
    subject: 'svenska',
    grades: [4, 6],
    area: 'Berättande texter och faktatexter',
    generate: (_level, count, rng) => questionsFrom(TEXTS.filter((t) => t.level === 'lang'), count, rng),
  },
];
