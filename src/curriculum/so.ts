import { sample } from '../lib/random';
import { fromBank, mc, unique } from './build';
import type { Activity, Grade } from './types';

interface Fact {
  q: string;
  a: string;
  w: string[];
  e: string;
}

function factActivity(
  id: string,
  title: string,
  description: string,
  grades: [Grade, Grade],
  area: string,
  facts: Fact[]
): Activity {
  return {
    id,
    title,
    description,
    subject: 'so',
    grades,
    area,
    generate: (_l, count, rng) => fromBank(facts, count, rng, (f) => mc(f.q, f.a, f.w, rng, { explain: f.e })),
  };
}

/* ---------- Åk 1–3 ---------- */

const FORNTIDEN: Fact[] = [
  { q: 'Hur fick människorna mat i början av stenåldern?', a: 'De jagade, fiskade och samlade', w: ['De handlade i affärer', 'De odlade i stora fabriker'], e: 'De första människorna i Norden var jägare och samlare.' },
  { q: 'Vad började människor göra under yngre stenåldern?', a: 'Odla och ha djur', w: ['Bygga bilar', 'Åka tåg'], e: 'När man började odla kunde man bo kvar på samma plats.' },
  { q: 'Vilket redskap kommer från stenåldern?', a: 'En yxa av flinta', w: ['En järnspade', 'En mobiltelefon'], e: 'Flinta är en hård sten som går att slå vass.' },
  { q: 'Vilken tid kom efter stenåldern?', a: 'Bronsåldern', w: ['Järnåldern', 'Vikingatiden'], e: 'Ordningen är stenålder, bronsålder, järnålder.' },
  { q: 'Varför tog järnet över efter bronset?', a: 'Järn var starkare och fanns i myrar och berg', w: ['Järn var mjukare och lättare att böja', 'Järn glänste mer och var finare'], e: 'Brons måste man handla till sig. Järn kunde man ta fram själv.' },
  { q: 'Brons är en blandning av koppar och …', a: 'tenn', w: ['järn', 'guld'], e: 'Koppar och tenn smälts ihop till brons.' },
  { q: 'Vad var en hällristning?', a: 'En bild som knackats in i berget', w: ['En målning på papper', 'En skylt av metall'], e: 'Hällristningar från bronsåldern finns bland annat i Tanum i Bohuslän.' },
  { q: 'Hur såg Norden ut under den senaste istiden?', a: 'Nästan allt var täckt av tjock is', w: ['Det var en öken', 'Det var precis som idag'], e: 'När isen smälte kom de första människorna till Sverige.' },
  { q: 'Vilket folk är urfolk i Sverige?', a: 'Samerna', w: ['Vikingarna', 'Romarna'], e: 'Samerna har levt i norra Skandinavien i tusentals år.' },
  { q: 'Vad kallas de stora stengravarna från stenåldern?', a: 'Dösar och gånggrifter', w: ['Runstenar', 'Pyramider'], e: 'De byggdes av jättestora stenblock för länge sedan.' },
  { q: 'Vilket djur tämjdes först av människan?', a: 'Hunden', w: ['Katten', 'Hästen'], e: 'Hunden hjälpte till vid jakten och vaktade boplatsen.' },
  { q: 'Var bodde människorna ofta på stenåldern?', a: 'Nära vatten, där det fanns fisk', w: ['Högt uppe på kala fjäll', 'I stora städer'], e: 'Vid sjöar och hav fanns mat året runt.' },
];

const MYTOLOGI: Fact[] = [
  { q: 'Vem var åskans gud i den nordiska mytologin?', a: 'Tor', w: ['Oden', 'Loke'], e: 'När det åskade trodde man att Tor åkte förbi i sin vagn.' },
  { q: 'Vad hette Tors hammare?', a: 'Mjölner', w: ['Sleipner', 'Yggdrasil'], e: 'Mjölner kom alltid tillbaka till Tor när han kastat den.' },
  { q: 'Vad hette det stora världsträdet?', a: 'Yggdrasil', w: ['Mjölner', 'Valhall'], e: 'Världsträdet höll ihop alla världar.' },
  { q: 'Vad hette Odens två korpar?', a: 'Hugin och Munin', w: ['Tor och Loke', 'Frej och Freja'], e: 'Korparna flög runt i världen och berättade allt för Oden.' },
  { q: 'Vilken gud var känd för att lura de andra?', a: 'Loke', w: ['Tor', 'Balder'], e: 'Loke ställde ofta till med bus och bråk.' },
  { q: 'Vad hette Odens häst med åtta ben?', a: 'Sleipner', w: ['Mjölner', 'Fenrir'], e: 'Sleipner var den snabbaste av alla hästar.' },
  { q: 'Var bodde gudarna?', a: 'I Asgård', w: ['I Birka', 'I Uppsala slott'], e: 'Människornas värld kallades Midgård.' },
  { q: 'Vart trodde vikingarna att de som dog i strid kom?', a: 'Till Valhall', w: ['Till Midgård', 'Till Utgård'], e: 'I Valhall festade krigarna med Oden.' },
  { q: 'Vilken gud skulle ge god skörd och fina somrar?', a: 'Frej', w: ['Tor', 'Loke'], e: 'Frej var fruktbarhetens gud. Hans syster hette Freja.' },
  { q: 'Vilken veckodag har fått sitt namn efter Tor?', a: 'Torsdag', w: ['Tisdag', 'Onsdag'], e: 'Onsdag kommer från Oden och fredag från Frigg.' },
  { q: 'Vilka var gudarnas största fiender?', a: 'Jättarna', w: ['Människorna', 'Korparna'], e: 'Jättarna bodde i Utgård.' },
  { q: 'Vad var Ragnarök?', a: 'Gudarnas och världens undergång', w: ['En vikingakung', 'Ett vikingaskepp'], e: 'Efter Ragnarök skulle en ny värld växa fram.' },
];

const TID_OCH_KALLOR: Fact[] = [
  { q: 'Vad betyder dåtid?', a: 'Det som redan har hänt', w: ['Det som händer nu', 'Det som ska hända'], e: 'Dåtid, nutid och framtid.' },
  { q: 'Vad är framtid?', a: 'Det som inte har hänt än', w: ['Det som hände igår', 'Det som hände för länge sedan'], e: 'Imorgon är framtid.' },
  { q: 'Vad kan berätta hur människor levde för länge sedan?', a: 'Gamla föremål och fynd', w: ['Nya leksaker', 'Väderprognosen'], e: 'Föremål, bilder och texter kallas källor.' },
  { q: 'Hur skickade man meddelanden långt bort innan telefonen fanns?', a: 'Med brev', w: ['Med sms', 'Med mejl'], e: 'Brev kunde ta lång tid att komma fram.' },
  { q: 'Hur fick man ljus hemma för 200 år sedan?', a: 'Med levande ljus och lampor med låga', w: ['Med elektriska lampor i taket', 'Med skärmar'], e: 'Elektriskt ljus blev vanligt i hemmen först på 1900-talet.' },
  { q: 'Vad är en tidslinje?', a: 'En linje där man visar i vilken ordning saker hände', w: ['En linje på fotbollsplanen', 'En klocka'], e: 'Det som hände först står längst till vänster.' },
  { q: 'Vad är en källa när man lär sig historia?', a: 'Något som berättar vad som har hänt', w: ['En bäck i skogen', 'En sorts klocka'], e: 'Ett brev, ett foto eller ett gammalt föremål kan vara källor.' },
  { q: 'Hur tvättade man kläder innan tvättmaskinen fanns?', a: 'För hand i vatten', w: ['I diskmaskinen', 'Med dammsugaren'], e: 'Tvätten tog ofta en hel dag.' },
  { q: 'Vad gjorde många barn förr när de inte var i skolan?', a: 'Hjälpte till hemma och på gården', w: ['Spelade tv-spel', 'Åkte på charterresa'], e: 'Barn passade djur, bar vatten och hjälpte till i skörden.' },
  { q: 'Hur lång tid är ett sekel?', a: 'Hundra år', w: ['Tio år', 'Tusen år'], e: '1800-talet är ett sekel: åren 1800 till 1899.' },
  { q: 'Vad är nutid?', a: 'Det som händer just nu', w: ['Det som hände förra året', 'Det som händer om hundra år'], e: 'Dåtid, nutid och framtid.' },
];

/* ---------- Åk 4–6: historia ---------- */

const NORDEN_800_1500: Fact[] = [
  { q: 'Ungefär när var vikingatiden?', a: 'Cirka år 800–1050', w: ['Cirka år 1500–1600', 'Cirka år 1900–2000'], e: 'Vikingatiden räknas ungefär från 800 till 1050.' },
  { q: 'Åt vilket håll reste de flesta vikingar från Sverige?', a: 'Österut, längs floderna i nuvarande Ryssland', w: ['Till Australien', 'Till Sydamerika'], e: 'De handlade ända bort till Konstantinopel och Bagdad.' },
  { q: 'Vilken stad på Björkö i Mälaren var en viktig handelsplats på vikingatiden?', a: 'Birka', w: ['Visby', 'Kiruna'], e: 'Birka var en av Nordens första städer.' },
  { q: 'Vem kom till Birka på 800-talet för att sprida kristendomen?', a: 'Ansgar', w: ['Gustav Vasa', 'Birger jarl'], e: 'Ansgar var en munk från Frankerriket.' },
  { q: 'Vad skrev vikingarna med?', a: 'Runor', w: ['Bläckpennor', 'Hieroglyfer'], e: 'Runor ristades in på stenar, ben och trä.' },
  { q: 'Vad är en runsten?', a: 'En sten med text skriven med runor', w: ['En sten för att slipa svärd', 'En gravsten från 1900-talet'], e: 'Många runstenar restes till minne av någon som dött.' },
  { q: 'Vilken stad på Gotland var en viktig hansestad under medeltiden?', a: 'Visby', w: ['Birka', 'Uppsala'], e: 'Ringmuren runt Visby finns kvar än idag.' },
  { q: 'Vad var Hansan?', a: 'Ett förbund av handelsstäder', w: ['Ett kungahus', 'En sorts skepp'], e: 'Hansan var ett samarbete mellan tyska och andra handelsstäder runt Östersjön.' },
  { q: 'Vem brukar räknas som Stockholms grundare?', a: 'Birger jarl', w: ['Gustav Vasa', 'Karl XII'], e: 'Stockholm nämns första gången i ett brev från 1252.' },
  { q: 'Vilken sjukdom drabbade Sverige hårt i mitten av 1300-talet?', a: 'Digerdöden', w: ['Covid-19', 'Mässlingen'], e: 'Digerdöden var en pest som dödade en stor del av befolkningen.' },
  { q: 'Vad hette unionen mellan Danmark, Norge och Sverige som bildades 1397?', a: 'Kalmarunionen', w: ['Hansan', 'Europeiska unionen'], e: 'Unionen bildades i Kalmar på drottning Margaretas initiativ.' },
  { q: 'Vilka bodde på medeltidens kloster?', a: 'Munkar och nunnor', w: ['Riddare och kungar', 'Vikingar'], e: 'Klostren var också platser för lärande och vård.' },
];

const NORDEN_1500_1800: Fact[] = [
  { q: 'Vem valdes till kung av Sverige 1523?', a: 'Gustav Vasa', w: ['Gustav II Adolf', 'Karl XII'], e: 'Den 6 juni 1523 valdes Gustav Vasa till kung. Därför är 6 juni nationaldag.' },
  { q: 'Vad kallas avrättningarna i Stockholm år 1520?', a: 'Stockholms blodbad', w: ['Digerdöden', 'Freden i Nystad'], e: 'Den danske kungen Kristian II lät avrätta många svenska stormän.' },
  { q: 'Vad innebar reformationen i Sverige?', a: 'Sverige blev protestantiskt och kyrkan kom under kungen', w: ['Sverige blev en republik utan kung och kyrka', 'Sverige blev katolskt och styrdes av påven'], e: 'Under Gustav Vasa bröt Sverige med påven i Rom.' },
  { q: 'Vad hette regalskeppet som sjönk i Stockholm 1628?', a: 'Vasa', w: ['Titanic', 'Kalmar Nyckel'], e: 'Vasa bärgades 1961 och finns på Vasamuseet.' },
  { q: 'Vilken kung dog i slaget vid Lützen 1632?', a: 'Gustav II Adolf', w: ['Gustav Vasa', 'Karl XI'], e: 'Slaget var en del av trettioåriga kriget.' },
  { q: 'Vad kallas tiden då Sverige var en stormakt runt Östersjön?', a: 'Stormaktstiden', w: ['Vikingatiden', 'Industrialiseringen'], e: 'Stormaktstiden räknas ungefär från 1611 till 1721.' },
  { q: 'Vilka fyra stånd fanns i riksdagen?', a: 'Adel, präster, borgare och bönder', w: ['Adel, präster, soldater och köpmän', 'Kungar, adel, präster och bönder'], e: 'Ståndssamhället delade in människor efter vilken grupp de föddes i.' },
  { q: 'Vilken drottning lämnade frivilligt tronen 1654?', a: 'Kristina', w: ['Margareta', 'Victoria'], e: 'Drottning Kristina abdikerade och flyttade till Rom.' },
  { q: 'Vilken fred 1721 brukar räknas som slutet på stormaktstiden?', a: 'Freden i Nystad', w: ['Freden i Roskilde', 'Freden i Paris'], e: 'Sverige förlorade då stora områden runt Östersjön.' },
  { q: 'Vilken svensk naturforskare på 1700-talet gav namn åt växter och djur?', a: 'Carl von Linné', w: ['Alfred Nobel', 'Anders Celsius'], e: 'Linnés system för att namnge arter används fortfarande.' },
  { q: 'Vem gav namn åt temperaturskalan med grader Celsius?', a: 'Anders Celsius', w: ['Carl von Linné', 'Alfred Nobel'], e: 'Anders Celsius var astronom i Uppsala.' },
];

const SVERIGE_1800: Fact[] = [
  { q: 'Vilket land förlorade Sverige 1809?', a: 'Finland', w: ['Norge', 'Danmark'], e: 'Finland blev efter kriget en del av Ryssland.' },
  { q: 'Ungefär hur många svenskar utvandrade till Amerika 1850–1930?', a: 'Mer än en miljon', w: ['Ungefär hundra', 'Ungefär femtio miljoner'], e: 'Det var en stor del av Sveriges befolkning.' },
  { q: 'Varför utvandrade många svenskar på 1800-talet?', a: 'Fattigdom och missväxt, och hopp om jord och arbete', w: ['För att det var för varmt i Sverige', 'För att flyga till Amerika var billigt'], e: 'Många reste med båt över Atlanten.' },
  { q: 'Vad kallas det när fabriker och maskiner började ta över mycket arbete?', a: 'Industrialiseringen', w: ['Reformationen', 'Stormaktstiden'], e: 'Många flyttade från landet till städer för att arbeta i fabriker.' },
  { q: 'Vilket nytt sätt att resa byggdes ut i Sverige under 1800-talet?', a: 'Järnvägen', w: ['Flygplanet', 'Tunnelbanan'], e: 'Med tåg gick det fort att frakta både människor och varor.' },
  { q: 'Vad beslutade man 1842 om skolan i Sverige?', a: 'Att det skulle finnas folkskolor för alla barn', w: ['Att barn inte fick gå i skolan', 'Att skolan skulle vara på engelska'], e: 'Folkskolestadgan 1842 sa att varje socken skulle ha en skola.' },
  { q: 'Vilken gröda gjorde att färre svalt i Sverige under 1800-talet?', a: 'Potatisen', w: ['Bananen', 'Riset'], e: 'Potatisen var lätt att odla och gav mycket mat.' },
  { q: 'Vem uppfann dynamiten?', a: 'Alfred Nobel', w: ['Carl von Linné', 'Gustav Vasa'], e: 'Nobel skrev i sitt testamente att hans pengar skulle bli Nobelpriset.' },
  { q: 'Vad skrev prästen upp i kyrkböckerna?', a: 'Vilka som föddes, dog och flyttade', w: ['Vädret varje dag', 'Priser i affärerna'], e: 'Kyrkböcker är viktiga källor när man släktforskar.' },
  { q: 'Vad kallas de stora föreningar som många vanliga människor gick med i under slutet av 1800-talet?', a: 'Folkrörelser', w: ['Gillen', 'Stånd'], e: 'Till exempel nykterhetsrörelsen, arbetarrörelsen och frikyrkorna.' },
  { q: 'Vad drev de första ångloken och fabriksmaskinerna?', a: 'Ånga från kokande vatten', w: ['El från stora solceller', 'Bensin från oljekällor'], e: 'Kol eller ved eldades för att koka vattnet.' },
  { q: 'Vad fick en statare det mesta av sin lön i?', a: 'Mat och andra varor', w: ['Silvermynt från staten', 'Aktier i gården'], e: 'Statarna arbetade på stora gårdar. Lönen i varor kallades stat.' },
];

/* ---------- Åk 4–6: geografi och samhälle ---------- */

const GEOGRAFI: Fact[] = [
  { q: 'Vad heter Norges huvudstad?', a: 'Oslo', w: ['Bergen', 'Köpenhamn'], e: 'Oslo ligger i södra Norge.' },
  { q: 'Vad heter Danmarks huvudstad?', a: 'Köpenhamn', w: ['Århus', 'Malmö'], e: 'Köpenhamn ligger på Själland, nära Öresundsbron.' },
  { q: 'Vad heter Finlands huvudstad?', a: 'Helsingfors', w: ['Åbo', 'Tallinn'], e: 'Helsingfors heter Helsinki på finska.' },
  { q: 'Vad heter Islands huvudstad?', a: 'Reykjavik', w: ['Oslo', 'Tórshavn'], e: 'Island ligger i Atlanten mellan Europa och Grönland.' },
  { q: 'Vilket är Sveriges högsta berg?', a: 'Kebnekaise', w: ['Åreskutan', 'Mount Everest'], e: 'Kebnekaise ligger i Lappland.' },
  { q: 'Vilken är Sveriges största sjö?', a: 'Vänern', w: ['Vättern', 'Mälaren'], e: 'Vänern är också en av Europas största sjöar.' },
  { q: 'Vilket hav ligger öster om Sverige?', a: 'Östersjön', w: ['Nordsjön', 'Medelhavet'], e: 'På västkusten finns Kattegatt och Skagerrak.' },
  { q: 'Hur många landskap har Sverige?', a: '25', w: ['21', '10'], e: 'Län är något annat – de är 21 stycken.' },
  { q: 'Vilket är Sveriges största landskap?', a: 'Lappland', w: ['Skåne', 'Gotland'], e: 'Lappland ligger längst i norr.' },
  { q: 'I vilken världsdel ligger Egypten?', a: 'Afrika', w: ['Asien', 'Europa'], e: 'Floden Nilen rinner genom Egypten.' },
  { q: 'I vilken världsdel ligger Brasilien?', a: 'Sydamerika', w: ['Afrika', 'Nordamerika'], e: 'Amazonas regnskog finns till stor del i Brasilien.' },
  { q: 'I vilken världsdel ligger Kina?', a: 'Asien', w: ['Europa', 'Oceanien'], e: 'Asien är den största världsdelen.' },
  { q: 'Vilket är jordens största hav?', a: 'Stilla havet', w: ['Atlanten', 'Östersjön'], e: 'Stilla havet ligger mellan Asien och Amerika.' },
  { q: 'Vad heter linjen som delar jorden i en norra och en södra halva?', a: 'Ekvatorn', w: ['Nollmeridianen', 'Polcirkeln'], e: 'Vid ekvatorn är det varmt hela året.' },
  { q: 'Åt vilket håll pekar kompassnålen?', a: 'Mot norr', w: ['Mot söder', 'Mot öster'], e: 'Därför kan man hitta rätt med en kompass.' },
];

const SAMHALLE: Fact[] = [
  { q: 'Hur många ledamöter sitter i Sveriges riksdag?', a: '349', w: ['100', '1 000'], e: 'Riksdagen stiftar lagar och beslutar om statens pengar.' },
  { q: 'Hur ofta är det val till riksdagen?', a: 'Vart fjärde år', w: ['Varje år', 'Vart tionde år'], e: 'Samma dag röstar man också till region och kommun.' },
  { q: 'Från vilken ålder får man rösta i riksdagsvalet?', a: '18 år', w: ['15 år', '25 år'], e: 'Man ska vara svensk medborgare och fylla 18 senast på valdagen.' },
  { q: 'Vem är statschef i Sverige?', a: 'Kungen eller drottningen', w: ['Statsministern', 'Talmannen'], e: 'Statschefen har ingen politisk makt. Regeringen styr landet.' },
  { q: 'Vad är en demokrati?', a: 'Ett land där folket väljer vilka som ska bestämma', w: ['Ett land där en person bestämmer allt', 'Ett land utan lagar'], e: 'I en demokrati har alla rätt att säga vad de tycker.' },
  { q: 'Vad ansvarar kommunen för?', a: 'Till exempel skolor och förskolor', w: ['Att välja kung', 'Att bestämma Sveriges lagar'], e: 'Sverige har 290 kommuner.' },
  { q: 'Vad heter FN:s överenskommelse om barns rättigheter?', a: 'Barnkonventionen', w: ['Grundlagen', 'Skollagen'], e: 'Barnkonventionen blev svensk lag år 2020.' },
  { q: 'Vad används skatten till?', a: 'Till exempel skola, sjukvård och vägar', w: ['Bara till kungens slott', 'Ingenting'], e: 'Alla som tjänar pengar betalar skatt.' },
  { q: 'Vad kallas Sveriges pengar?', a: 'Kronor', w: ['Euro', 'Dollar'], e: 'En krona är hundra öre.' },
  { q: 'Vem leder Sveriges regering?', a: 'Statsministern', w: ['Talmannen', 'Kungen'], e: 'Statsministern väljer vilka som ska bli ministrar.' },
  { q: 'Vad gör en domstol?', a: 'Avgör om någon har brutit mot lagen', w: ['Stiftar nya lagar', 'Samlar in skatt'], e: 'Domstolen ska vara opartisk och följa lagen.' },
  { q: 'Vad betyder yttrandefrihet?', a: 'Att man får säga och skriva vad man tycker', w: ['Att man måste hålla med regeringen', 'Att man får göra precis vad man vill'], e: 'Yttrandefriheten skyddas i grundlagen, men man får till exempel inte hota någon.' },
  { q: 'Vad ansvarar regionerna främst för?', a: 'Sjukvården', w: ['Försvaret', 'Att välja kung'], e: 'Sverige har 21 regioner.' },
  { q: 'Vad är en budget?', a: 'En plan för pengar som kommer in och går ut', w: ['En sorts skatt', 'En lag om trafik'], e: 'Både familjer, kommuner och staten gör budgetar.' },
];

/* ---------- Tidslinjer ---------- */

const EPOKER: [string, string][] = [
  ['Stenåldern', 'tidigast'],
  ['Bronsåldern', ''],
  ['Järnåldern', ''],
  ['Vikingatiden', 'ca 800–1050'],
  ['Medeltiden', 'ca 1050–1520'],
  ['Stormaktstiden', 'ca 1611–1721'],
  ['Industrialiseringen', '1800-talet'],
];
const HANDELSER: [string, number, string?][] = [
  ['Birka grundas', 750, 'omkring år 750'],
  ['Stockholm nämns första gången', 1252],
  ['Digerdöden kommer till Sverige', 1350],
  ['Kalmarunionen bildas', 1397],
  ['Stockholms blodbad', 1520],
  ['Gustav Vasa väljs till kung', 1523],
  ['Regalskeppet Vasa sjunker', 1628],
  ['Freden i Nystad', 1721],
  ['Sverige förlorar Finland', 1809],
  ['Folkskolan införs', 1842],
];

const tidslinje: Activity = {
  id: 'so-tidslinje',
  title: 'Tidslinjen',
  description: 'Lägg tidsperioder och händelser i rätt ordning.',
  subject: 'so',
  grades: [2, 6],
  area: 'Att undersöka verkligheten (åk 1–3)',
  levels: [
    { value: 'epoker', label: 'Tidsperioder', hint: 'Stenålder, vikingatid …' },
    { value: 'handelser', label: 'Händelser', hint: 'Med årtal' },
  ],
  defaultLevel: 'epoker',
  generate: (level = 'epoker', count, rng) =>
    unique(count, () => {
      if (level === 'epoker') {
        const pickIdx = sample(
          EPOKER.map((_, i) => i),
          4,
          rng
        ).sort((a, b) => a - b);
        return { kind: 'order', prompt: 'Vad kom först? Lägg i ordning, äldst först.', items: pickIdx.map((i) => EPOKER[i][0]), notes: pickIdx.map((i) => EPOKER[i][1]) };
      }
      const chosen = sample(HANDELSER, 4, rng).sort((a, b) => a[1] - b[1]);
      return { kind: 'order', prompt: 'Lägg händelserna i ordning, äldst först.', items: chosen.map((c) => c[0]), notes: chosen.map((c) => c[2] ?? `år ${c[1]}`) };
    }),
};

export const SO_ACTIVITIES: Activity[] = [
  factActivity('so-forntiden', 'Stenålder till järnålder', 'Hur levde människorna i Norden för mycket länge sedan?', [1, 3], 'Att leva i världen (åk 1–3)', FORNTIDEN),
  factActivity('so-mytologi', 'Nordisk mytologi', 'Tor, Oden, Loke och världsträdet Yggdrasil.', [2, 4], 'Att leva i världen (åk 1–3)', MYTOLOGI),
  factActivity('so-forr-och-nu', 'Förr och nu', 'Dåtid, nutid, framtid – och hur man vet hur det var förr.', [0, 3], 'Att undersöka verkligheten (åk 1–3)', TID_OCH_KALLOR),
  tidslinje,
  factActivity('hi-vikingatid-medeltid', 'Vikingatid och medeltid', 'Norden ca 800–1500: vikingar, Hansan och Kalmarunionen.', [4, 6], 'Historia: Norden ca 800–1500', NORDEN_800_1500),
  factActivity('hi-stormaktstiden', 'Vasatiden och stormaktstiden', 'Norden ca 1500–1800: Gustav Vasa, Vasaskeppet och ståndssamhället.', [4, 6], 'Historia: Norden ca 1500–1800', NORDEN_1500_1800),
  factActivity('hi-1800-talet', '1800-talet', 'Utvandringen, järnvägen och industrialiseringen.', [5, 6], 'Historia: ca 1800–1900', SVERIGE_1800),
  factActivity('ge-sverige-varlden', 'Sverige och världen', 'Huvudstäder, sjöar, berg och världsdelar.', [3, 6], 'Geografi', GEOGRAFI),
  factActivity('sh-samhallet', 'Samhället', 'Riksdag, kommun, demokrati och barnkonventionen.', [4, 6], 'Samhällskunskap', SAMHALLE),
];
