import { PICTURES, type PicId } from '../components/pictures';
import { pick, randInt, sample } from '../lib/random';
import { cap, fromBank, mc, unique } from './build';
import type { Activity } from './types';

const ALFABETET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split('');
const VOKALER = 'AEIOUYÅÄÖ'.split('');

const alfabetet: Activity = {
  id: 'sv-alfabetet',
  title: 'Alfabetet',
  description: 'Vilken bokstav kommer före – eller efter?',
  subject: 'svenska',
  grades: [0, 2],
  area: 'Läsa och skriva',
  readAloud: true,
  levels: [
    { value: 'efter', label: 'Vad kommer efter?' },
    { value: 'fore', label: 'Vad kommer före?' },
    { value: 'blandat', label: 'Blandat' },
  ],
  defaultLevel: 'efter',
  generate: (level = 'efter', count, rng) =>
    unique(count, () => {
      const mode = level === 'blandat' ? pick(['efter', 'fore'], rng) : level;
      const i = mode === 'efter' ? randInt(0, ALFABETET.length - 2, rng) : randInt(1, ALFABETET.length - 1, rng);
      const ans = ALFABETET[mode === 'efter' ? i + 1 : i - 1];
      const wrong = [ALFABETET[i], ALFABETET[mode === 'efter' ? i - 1 : i + 1], ALFABETET[(i + 3) % 29], ALFABETET[(i + 5) % 29]].filter(Boolean);
      return mc(mode === 'efter' ? `Vilken bokstav kommer efter ${ALFABETET[i]}?` : `Vilken bokstav kommer före ${ALFABETET[i]}?`, ans, wrong, rng);
    }),
};

const vokaler: Activity = {
  id: 'sv-vokaler',
  title: 'Vokaler och konsonanter',
  description: 'Hitta vokalen – eller konsonanten.',
  subject: 'svenska',
  grades: [1, 3],
  area: 'Läsa och skriva',
  generate: (_l, count, rng) =>
    unique(count, () => {
      const findVowel = rng ? rng() < 0.6 : Math.random() < 0.6;
      const kons = ALFABETET.filter((l) => !VOKALER.includes(l) && !'CQWXZ'.includes(l));
      if (findVowel) return mc('Vilken bokstav är en vokal?', pick(VOKALER, rng), sample(kons, 3, rng), rng, { explain: 'Vokalerna är A, E, I, O, U, Y, Å, Ä och Ö.' });
      return mc('Vilken bokstav är en konsonant?', pick(kons, rng), sample(VOKALER, 3, rng), rng, { explain: 'Alla bokstäver som inte är vokaler är konsonanter.' });
    }),
};

/** Grupper av ord som rimmar. Störord hämtas från andra grupper. */
const RIM: string[][] = [
  ['katt', 'hatt', 'natt', 'matt'],
  ['sol', 'stol', 'kjol'],
  ['hus', 'mus', 'lus', 'sus'],
  ['bil', 'pil', 'fil'],
  ['boll', 'troll', 'noll'],
  ['ko', 'sko', 'bo', 'tro'],
  ['hund', 'stund', 'rund'],
  ['glass', 'tass', 'pass'],
  ['fisk', 'disk', 'visk'],
  ['sten', 'ben', 'ren'],
  ['hand', 'sand', 'land', 'band'],
  ['säng', 'äng', 'gäng'],
  ['bok', 'krok', 'klok'],
  ['mat', 'fat', 'gat'].slice(0, 2),
];
const rim: Activity = {
  id: 'sv-rim',
  title: 'Rimord',
  description: 'Vilket ord rimmar? Lyssna på slutet av orden.',
  subject: 'svenska',
  grades: [0, 2],
  area: 'Språkbruk',
  readAloud: true,
  generate: (_l, count, rng) =>
    unique(count, () => {
      const gi = randInt(0, RIM.length - 1, rng);
      const [word, match] = sample(RIM[gi], 2, rng);
      const wrong = sample(
        RIM.filter((_, i) => i !== gi).flat(),
        3,
        rng
      );
      return mc(`Vilket ord rimmar på ”${word}”?`, match, wrong, rng);
    }),
};

const ALFA_ORD = ['apa', 'boll', 'cykel', 'docka', 'elefant', 'fisk', 'gris', 'hus', 'is', 'jacka', 'katt', 'lampa', 'mus', 'nyckel', 'orm', 'penna', 'räv', 'sol', 'tåg', 'uggla', 'val', 'zebra', 'äpple', 'ö'];
const ALFA_SVAR = ['banan', 'bil', 'blomma', 'boll', 'bok', 'båt', 'katt', 'kaka', 'ko', 'kudde', 'sol', 'sko', 'snö', 'stol', 'säng'];
const alfabetiskOrdning: Activity = {
  id: 'sv-alfabetisk-ordning',
  title: 'Alfabetisk ordning',
  description: 'Lägg orden i bokstavsordning, som i en ordlista.',
  subject: 'svenska',
  grades: [2, 4],
  area: 'Läsa och skriva',
  levels: [
    { value: 'forsta', label: 'Första bokstaven' },
    { value: 'andra', label: 'Titta på andra bokstaven', hint: 'Samma första bokstav' },
  ],
  defaultLevel: 'forsta',
  generate: (level = 'forsta', count, rng) =>
    unique(count, () => {
      let words: string[];
      if (level === 'andra') {
        const first = pick(['b', 'k', 's'], rng);
        words = sample(ALFA_SVAR.filter((w) => w.startsWith(first)), 4, rng);
      } else words = sample(ALFA_ORD, 4, rng);
      const sorted = [...words].sort((a, b) => a.localeCompare(b, 'sv'));
      return { kind: 'order', prompt: 'Lägg orden i alfabetisk ordning', items: sorted };
    }),
};

/** Meningar som går att skriva fel på flera sätt. */
const MENINGAR = [
  'Katten sover i solen',
  'Vi ska bada i sjön',
  'Mamma bakar en kaka',
  'Hunden springer i parken',
  'Jag har en röd cykel',
  'Elsa läser en bok',
  'Det snöar ute',
  'Morfar fiskar vid bryggan',
  'Vi äter glass på stranden',
  'Noah spelar fotboll',
];
const storBokstav: Activity = {
  id: 'sv-stor-bokstav-punkt',
  title: 'Stor bokstav och punkt',
  description: 'Vilken mening är rätt skriven?',
  subject: 'svenska',
  grades: [1, 3],
  area: 'Läsa och skriva',
  generate: (_l, count, rng) =>
    fromBank(MENINGAR, count, rng, (m) => {
      const low = m.charAt(0).toLowerCase() + m.slice(1);
      return mc('Vilken mening är rätt skriven?', `${m}.`, [`${low}.`, m, low], rng, { explain: 'En mening börjar med stor bokstav och slutar med punkt.' });
    }),
};

const MOTSATSER: [string, string][] = [
  ['stor', 'liten'],
  ['varm', 'kall'],
  ['glad', 'ledsen'],
  ['lång', 'kort'],
  ['snabb', 'långsam'],
  ['ljus', 'mörk'],
  ['tung', 'lätt'],
  ['ny', 'gammal'],
  ['hög', 'låg'],
  ['öppen', 'stängd'],
  ['våt', 'torr'],
  ['full', 'tom'],
  ['mjuk', 'hård'],
  ['sur', 'söt'],
  ['tidig', 'sen'],
  ['smal', 'bred'],
  ['upp', 'ner'],
  ['fram', 'bak'],
  ['början', 'slut'],
  ['tyst', 'högljudd'],
];
const motsatser: Activity = {
  id: 'sv-motsatser',
  title: 'Motsatsord',
  description: 'Vilket ord betyder det motsatta?',
  subject: 'svenska',
  grades: [1, 4],
  area: 'Språkbruk',
  readAloud: true,
  generate: (_l, count, rng) =>
    fromBank(MOTSATSER, count, rng, ([a, b]) => {
      const flip = rng ? rng() < 0.5 : Math.random() < 0.5;
      const [w, ans] = flip ? [b, a] : [a, b];
      const wrong = sample(MOTSATSER.filter((p) => !p.includes(w)).flat(), 3, rng);
      return mc(`Vad är motsatsen till ”${w}”?`, ans, wrong, rng);
    }),
};

const SYNONYMER: [string, string][] = [
  ['glad', 'lycklig'],
  ['snabb', 'kvick'],
  ['prata', 'tala'],
  ['titta', 'se'],
  ['rädd', 'skrämd'],
  ['arg', 'ilsken'],
  ['börja', 'starta'],
  ['ledsen', 'sorgsen'],
  ['vacker', 'fin'],
  ['tyst', 'ljudlös'],
  ['kall', 'kylig'],
  ['enkel', 'lätt'],
  ['stor', 'jättelik'],
  ['trött', 'sömnig'],
  ['skrika', 'vråla'],
  ['klok', 'förståndig'],
];
const synonymer: Activity = {
  id: 'sv-synonymer',
  title: 'Synonymer',
  description: 'Vilket ord betyder ungefär samma sak?',
  subject: 'svenska',
  grades: [3, 6],
  area: 'Språkbruk',
  generate: (_l, count, rng) =>
    fromBank(SYNONYMER, count, rng, ([a, b]) => {
      const wrong = sample(
        SYNONYMER.filter((p) => p[0] !== a).map((p) => p[1]),
        3,
        rng
      );
      return mc(`Vilket ord betyder ungefär samma sak som ”${a}”?`, b, wrong, rng);
    }),
};

const SAMMANSATTA: [string, string, string, string[]][] = [
  ['snö', 'gubbe', 'snögubbe', ['gubbsnö', 'snöbubbe']],
  ['fot', 'boll', 'fotboll', ['bollfot', 'fotbol']],
  ['regn', 'båge', 'regnbåge', ['bågregn', 'regbåge']],
  ['tand', 'borste', 'tandborste', ['borsttand', 'tandborst']],
  ['flyg', 'plan', 'flygplan', ['planflyg', 'flyplan']],
  ['brand', 'bil', 'brandbil', ['bilbrand', 'branbil']],
  ['sol', 'sken', 'solsken', ['skensol', 'solken']],
  ['bok', 'hylla', 'bokhylla', ['hyllbok', 'bokylla']],
  ['skol', 'väska', 'skolväska', ['väskskola', 'skolväsa']],
  ['kyl', 'skåp', 'kylskåp', ['skåpkyl', 'kylskop']],
  ['glass', 'bil', 'glassbil', ['bilglass', 'glasbil']],
  ['sko', 'snöre', 'skosnöre', ['snörsko', 'skonöre']],
  ['jul', 'gran', 'julgran', ['granjul', 'julgren']],
  ['sand', 'låda', 'sandlåda', ['lådsand', 'sanlåda']],
];
const sammansatta: Activity = {
  id: 'sv-sammansatta-ord',
  title: 'Sammansatta ord',
  description: 'Sätt ihop två ord till ett nytt.',
  subject: 'svenska',
  grades: [2, 4],
  area: 'Språkbruk',
  generate: (_l, count, rng) =>
    fromBank(SAMMANSATTA, count, rng, ([a, b, ans, wrong]) =>
      mc(`Vilket ord blir det av ${a} + ${b}?`, ans, [...wrong, pick(SAMMANSATTA.filter((x) => x[2] !== ans), rng)[2]], rng)
    ),
};

/** Meningar där exakt ett ord är substantiv, ett verb och ett adjektiv. */
const ORDKLASS_MENINGAR: { s: string; subst: string; verb: string; adj: string }[] = [
  { s: 'Den stora hunden skäller.', subst: 'hunden', verb: 'skäller', adj: 'stora' },
  { s: 'Den glada flickan cyklar hem.', subst: 'flickan', verb: 'cyklar', adj: 'glada' },
  { s: 'En liten fågel sjunger.', subst: 'fågel', verb: 'sjunger', adj: 'liten' },
  { s: 'Det kalla vattnet glittrar.', subst: 'vattnet', verb: 'glittrar', adj: 'kalla' },
  { s: 'Den trötta katten sover.', subst: 'katten', verb: 'sover', adj: 'trötta' },
  { s: 'Den gula bussen kommer nu.', subst: 'bussen', verb: 'kommer', adj: 'gula' },
  { s: 'Det gamla huset knarrar.', subst: 'huset', verb: 'knarrar', adj: 'gamla' },
  { s: 'Den snälla läraren skrattar.', subst: 'läraren', verb: 'skrattar', adj: 'snälla' },
  { s: 'Det röda äpplet faller.', subst: 'äpplet', verb: 'faller', adj: 'röda' },
  { s: 'Den modiga pojken klättrar.', subst: 'pojken', verb: 'klättrar', adj: 'modiga' },
  { s: 'En hungrig räv smyger.', subst: 'räv', verb: 'smyger', adj: 'hungrig' },
  { s: 'Det mjuka gräset växer.', subst: 'gräset', verb: 'växer', adj: 'mjuka' },
  { s: 'Den snabba hästen springer.', subst: 'hästen', verb: 'springer', adj: 'snabba' },
  { s: 'En vit båt seglar.', subst: 'båt', verb: 'seglar', adj: 'vit' },
];
const ORDKLASSER = { subst: 'ett substantiv', verb: 'ett verb', adj: 'ett adjektiv' } as const;
const ordklasser: Activity = {
  id: 'sv-ordklasser',
  title: 'Ordklasser',
  description: 'Hitta substantivet, verbet eller adjektivet i meningen.',
  subject: 'svenska',
  grades: [3, 6],
  area: 'Läsa och skriva',
  levels: [
    { value: 'blandat', label: 'Alla tre' },
    { value: 'subst', label: 'Substantiv' },
    { value: 'verb', label: 'Verb' },
    { value: 'adj', label: 'Adjektiv' },
  ],
  defaultLevel: 'blandat',
  generate: (level = 'blandat', count, rng) =>
    unique(count, () => {
      const m = pick(ORDKLASS_MENINGAR, rng);
      const k = (level === 'blandat' ? pick(['subst', 'verb', 'adj'], rng) : level) as keyof typeof ORDKLASSER;
      const words = { subst: m.subst, verb: m.verb, adj: m.adj };
      const explain = {
        subst: 'Ett substantiv är en sak, ett djur, en person eller en plats. Du kan sätta en eller ett framför.',
        verb: 'Ett verb är något man gör. Du kan sätta jag framför.',
        adj: 'Ett adjektiv beskriver hur något är.',
      }[k];
      return mc(`Vilket ord är ${ORDKLASSER[k]}?`, words[k], Object.values(words).filter((w) => w !== words[k]), rng, { detail: m.s, explain });
    }),
};

const VERB: [string, string, string[]][] = [
  ['springer', 'sprang', ['springde', 'springade']],
  ['äter', 'åt', ['ätade', 'äte']],
  ['går', 'gick', ['gådde', 'gådd']],
  ['skriver', 'skrev', ['skrivde', 'skrivade']],
  ['sover', 'sov', ['sovde', 'sovade']],
  ['dricker', 'drack', ['drickte', 'druckade']],
  ['sjunger', 'sjöng', ['sjungde', 'sjungade']],
  ['tar', 'tog', ['tadde', 'takte']],
  ['ser', 'såg', ['sedde', 'sågde']],
  ['kommer', 'kom', ['kommade', 'kommde']],
  ['sitter', 'satt', ['sittade', 'sittde']],
  ['ligger', 'låg', ['liggde', 'liggade']],
  ['flyger', 'flög', ['flygde', 'flygade']],
  ['hoppar', 'hoppade', ['hopp', 'hoppte']],
  ['leker', 'lekte', ['lekade', 'lok']],
  ['pratar', 'pratade', ['pratte', 'prot']],
  ['bor', 'bodde', ['borde', 'bodade']],
  ['läser', 'läste', ['läsade', 'los']],
  ['cyklar', 'cyklade', ['cyklte', 'cykel']],
  ['simmar', 'simmade', ['simde', 'simte']],
  ['står', 'stod', ['stådde', 'stårde']],
  ['vet', 'visste', ['vetade', 'vette']],
];
const verbTempus: Activity = {
  id: 'sv-verb-preteritum',
  title: 'Verb: igår',
  description: 'Hur säger man det om det hände igår? Springer – sprang.',
  subject: 'svenska',
  grades: [3, 6],
  area: 'Läsa och skriva',
  generate: (_l, count, rng) =>
    fromBank(VERB, count, rng, ([nu, igar, fel]) =>
      mc(`Idag ${nu} jag. Igår … jag.`, igar, fel, rng, { detail: `Vilken form av ”${nu}” passar?`, explain: `Idag ${nu} jag. Igår ${igar} jag.` })
    ),
};

const EN_ETT: [string, 'en' | 'ett', PicId?][] = [
  ['katt', 'en', 'katt'],
  ['hus', 'ett', 'hus'],
  ['bil', 'en', 'bil'],
  ['äpple', 'ett', 'äpple'],
  ['boll', 'en', 'boll'],
  ['träd', 'ett', 'träd'],
  ['sol', 'en', 'sol'],
  ['ägg', 'ett', 'ägg'],
  ['tåg', 'ett', 'tåg'],
  ['båt', 'en', 'båt'],
  ['paraply', 'ett', 'paraply'],
  ['banan', 'en', 'banan'],
  ['lejon', 'ett', 'lejon'],
  ['uggla', 'en', 'uggla'],
  ['moln', 'ett', 'moln'],
  ['sko', 'en', 'sko'],
  ['flygplan', 'ett', 'flygplan'],
  ['nyckel', 'en', 'nyckel'],
  ['bord', 'ett'],
  ['barn', 'ett'],
  ['fönster', 'ett'],
  ['bok', 'en'],
  ['stol', 'en'],
  ['djur', 'ett'],
];
const enEtt: Activity = {
  id: 'sv-en-ett',
  title: 'En eller ett?',
  description: 'Heter det en eller ett?',
  subject: 'svenska',
  grades: [1, 4],
  area: 'Språkbruk',
  readAloud: true,
  generate: (_l, count, rng) =>
    fromBank(EN_ETT, count, rng, ([w, ans, pic]) =>
      mc(`Heter det en ${w} eller ett ${w}?`, `${ans} ${w}`, [`${ans === 'en' ? 'ett' : 'en'} ${w}`], rng, { visual: pic ? { t: 'pic', id: pic } : undefined })
    ),
};

const PLURAL: [string, string, string[], PicId?][] = [
  ['en katt', 'katter', ['kattar', 'katts'], 'katt'],
  ['ett hus', 'hus', ['husar', 'huser'], 'hus'],
  ['en bil', 'bilar', ['biler', 'bilor'], 'bil'],
  ['ett äpple', 'äpplen', ['äpplar', 'äppler'], 'äpple'],
  ['en boll', 'bollar', ['boller', 'bollor'], 'boll'],
  ['en bok', 'böcker', ['bokar', 'boker']],
  ['en fot', 'fötter', ['fotar', 'foter']],
  ['en mus', 'möss', ['musar', 'muser'], 'mus'],
  ['ett barn', 'barn', ['barnar', 'barner']],
  ['en flicka', 'flickor', ['flickar', 'flicker']],
  ['en pojke', 'pojkar', ['pojker', 'pojkor']],
  ['en tand', 'tänder', ['tandar', 'tander']],
  ['en hand', 'händer', ['handar', 'hander']],
  ['en man', 'män', ['manar', 'maner']],
  ['en sko', 'skor', ['skoar', 'skoer'], 'sko'],
  ['ett träd', 'träd', ['trädar', 'träder'], 'träd'],
  ['en fågel', 'fåglar', ['fågelar', 'fågler']],
  ['en nyckel', 'nycklar', ['nyckelar', 'nyckler'], 'nyckel'],
  ['en gås', 'gäss', ['gåsar', 'gåser']],
  ['ett öga', 'ögon', ['ögor', 'ögar']],
];
const plural: Activity = {
  id: 'sv-plural',
  title: 'En – flera',
  description: 'En katt, två … katter! Hur blir det när det är flera?',
  subject: 'svenska',
  grades: [2, 5],
  area: 'Läsa och skriva',
  generate: (_l, count, rng) =>
    fromBank(PLURAL, count, rng, ([one, many, wrong, pic]) =>
      mc(`${cap(one)}. Två …`, many, wrong, rng, { visual: pic ? { t: 'pic', id: pic } : undefined, explain: `${cap(one)}, två ${many}.` })
    ),
};

const SKILJETECKEN: [string, '.' | '?' | '!'][] = [
  ['Vad heter du', '?'],
  ['Akta dig', '!'],
  ['Jag gillar glass', '.'],
  ['Var bor du', '?'],
  ['Hjälp', '!'],
  ['Hunden sover i korgen', '.'],
  ['Vill du leka med mig', '?'],
  ['Stopp', '!'],
  ['Vi åker till mormor på lördag', '.'],
  ['Hur mycket är klockan', '?'],
  ['Vad roligt', '!'],
  ['Det regnar ute', '.'],
  ['Kan du räcka mig saltet', '?'],
  ['Elsa har en ny cykel', '.'],
];
const TECKEN = { '.': 'punkt (.)', '?': 'frågetecken (?)', '!': 'utropstecken (!)' };
const skiljetecken: Activity = {
  id: 'sv-skiljetecken',
  title: 'Punkt, frågetecken, utropstecken',
  description: 'Vilket tecken ska stå sist i meningen?',
  subject: 'svenska',
  grades: [2, 5],
  area: 'Läsa och skriva',
  generate: (_l, count, rng) =>
    fromBank(SKILJETECKEN, count, rng, ([s, t]) =>
      mc('Vilket tecken ska stå sist?', TECKEN[t], Object.values(TECKEN).filter((x) => x !== TECKEN[t]), rng, { detail: `${s} __` })
    ),
};

const SAMBAND: [string, string, string[]][] = [
  ['Jag tog på mig jackan ___ det var kallt.', 'eftersom', ['men', 'eller']],
  ['Jag ville gå ut, ___ det regnade.', 'men', ['eftersom', 'och']],
  ['Vill du ha glass ___ kaka?', 'eller', ['eftersom', 'men']],
  ['Först åt vi, ___ gick vi ut.', 'sedan', ['eller', 'eftersom']],
  ['Vi köpte mjölk ___ bröd.', 'och', ['men', 'fast']],
  ['Hon var trött, ___ hon gick och lade sig tidigt.', 'så', ['eller', 'fast']],
  ['Han sprang fort, ___ han kom ändå för sent.', 'men', ['eftersom', 'och därför']],
  ['Vi stannade inne ___ det stormade.', 'eftersom', ['eller', 'men']],
  ['Jag kan inte simma, ___ jag ska lära mig.', 'men', ['eller', 'eftersom']],
  ['___ du är klar kan du gå ut och leka.', 'När', ['Eller', 'Men']],
  ['Hon gick ut ___ det regnade.', 'fast', ['eftersom', 'eller']],
  ['Hunden skällde ___ någon ringde på dörren.', 'när', ['eller', 'men']],
];
const sambandsord: Activity = {
  id: 'sv-sambandsord',
  title: 'Sambandsord',
  description: 'Vilket ord binder ihop meningen bäst?',
  subject: 'svenska',
  grades: [4, 6],
  area: 'Läsa och skriva',
  generate: (_l, count, rng) => fromBank(SAMBAND, count, rng, ([s, a, w]) => mc('Vilket ord passar bäst?', a, w, rng, { detail: s })),
};

const STAVA_RATT: [string, string[]][] = [
  ['sjunga', ['schunga', 'skjunga']],
  ['skjorta', ['sjorta', 'chorta']],
  ['stjärna', ['sjärna', 'schärna']],
  ['kjol', ['tjol', 'schol']],
  ['tjugo', ['kjugo', 'schugo']],
  ['choklad', ['sjoklad', 'skoklad']],
  ['hjärta', ['järta', 'gjärta']],
  ['djur', ['jur', 'gjur']],
  ['gjorde', ['jorde', 'hjorde']],
  ['ljus', ['jus', 'hjus']],
  ['skina', ['sjina', 'schina']],
  ['kärlek', ['tjärlek', 'chärlek']],
  ['tjock', ['kjock', 'chock']],
  ['människa', ['männischa', 'mänskia']],
  ['sked', ['shed', 'sjed']],
  ['köra', ['tjöra', 'chöra']],
];
const stavaRatt: Activity = {
  id: 'sv-stava-ratt',
  title: 'Vilket är rätt stavat?',
  description: 'Sj-ljud, tj-ljud, j-ljud – välj ordet som är rätt stavat.',
  subject: 'svenska',
  grades: [3, 6],
  area: 'Läsa och skriva',
  generate: (_l, count, rng) => fromBank(STAVA_RATT, count, rng, ([a, w]) => mc('Vilket ord är rätt stavat?', a, w, rng)),
};

const BERATTELSE: { q: string; a: string; w: string[]; explain: string }[] = [
  { q: 'Var i en berättelse får man oftast veta vem den handlar om och var den utspelar sig?', a: 'I början', w: ['I mitten', 'I slutet'], explain: 'I början presenteras personerna och miljön.' },
  { q: 'Vad kallas det när något spännande eller svårt händer i en berättelse?', a: 'Ett problem eller en konflikt', w: ['En innehållsförteckning', 'En rubrik'], explain: 'Ett problem driver berättelsen framåt.' },
  { q: 'Var i berättelsen löses problemet ofta?', a: 'I slutet', w: ['I början', 'I rubriken'], explain: 'I slutet får man veta hur det gick.' },
  { q: 'Vad är en faktatext?', a: 'En text som berättar om hur något är på riktigt', w: ['En påhittad saga', 'En dikt som rimmar'], explain: 'Faktatexter beskriver och förklarar verkligheten.' },
  { q: 'Vilken text är en instruerande text?', a: 'Ett recept', w: ['En saga', 'En dikt'], explain: 'Ett recept talar om vad man ska göra, steg för steg.' },
  { q: 'Vad är en rubrik?', a: 'Textens namn som står överst', w: ['Det sista ordet i texten', 'En bild i texten'], explain: 'Rubriken berättar vad texten handlar om.' },
  { q: 'Vad kallas den som berättar en historia?', a: 'Berättare', w: ['Rubrik', 'Stycke'], explain: 'Berättaren är rösten som berättar.' },
  { q: 'Vilken text är skriven för att övertyga någon?', a: 'En argumenterande text', w: ['En beskrivande text', 'En instruerande text'], explain: 'Argumenterande texter vill få läsaren att tycka något.' },
  { q: 'Vad är en dialog i en berättelse?', a: 'När personer pratar med varandra', w: ['En lista med fakta', 'En bild med text under'], explain: 'Repliker i en dialog står ofta med talstreck eller citattecken.' },
  { q: 'Vad är en tillbakablick?', a: 'När berättelsen hoppar bakåt i tiden', w: ['Bokens sista sida', 'En bild på framsidan'], explain: 'En tillbakablick visar något som hände tidigare.' },
];
const berattelse: Activity = {
  id: 'sv-texttyper',
  title: 'Berättelser och faktatexter',
  description: 'Början, mitten och slut – och olika sorters texter.',
  subject: 'svenska',
  grades: [2, 6],
  area: 'Berättande texter och faktatexter',
  generate: (_l, count, rng) => fromBank(BERATTELSE, count, rng, (b) => mc(b.q, b.a, b.w, rng, { explain: b.explain })),
};

/** Ord från bildbiblioteket för stavningsövning med brickor. */
const STAV_ORD: PicId[] = ['sol', 'hus', 'bil', 'mus', 'ko', 'orm', 'tåg', 'ost', 'val', 'sko', 'katt', 'hund', 'fisk', 'boll', 'gris', 'anka', 'måne', 'kaka', 'moln', 'räv', 'banan', 'lampa', 'glass', 'tomat', 'zebra', 'uggla', 'äpple', 'blomma', 'nyckel', 'stjärna', 'paraply', 'elefant', 'ballong', 'flygplan'];
const stavaBild: Activity = {
  id: 'sv-stava-bild',
  title: 'Stava ordet',
  description: 'Titta på bilden och bygg ordet med bokstäver.',
  subject: 'svenska',
  grades: [0, 3],
  area: 'Läsa och skriva',
  levels: [
    { value: 'kort', label: 'Korta ord', hint: '2–3 bokstäver' },
    { value: 'mellan', label: 'Mellan', hint: '4–5 bokstäver' },
    { value: 'lang', label: 'Långa ord', hint: '6 eller fler' },
  ],
  defaultLevel: 'kort',
  generate: (level = 'kort', count, rng) => {
    const fits = (w: string) => (level === 'kort' ? w.length <= 3 : level === 'mellan' ? w.length >= 4 && w.length <= 5 : w.length >= 6);
    const pool = STAV_ORD.filter((id) => fits(PICTURES[id].word));
    return fromBank(pool, count, rng, (id) => ({
      kind: 'spell',
      prompt: 'Vad är det här? Stava ordet.',
      visual: { t: 'pic', id },
      answer: PICTURES[id].word,
      extra: level === 'kort' ? 0 : level === 'mellan' ? 1 : 2,
    }));
  },
};

export const SVENSKA_ACTIVITIES: Activity[] = [
  alfabetet,
  rim,
  stavaBild,
  vokaler,
  storBokstav,
  enEtt,
  motsatser,
  alfabetiskOrdning,
  sammansatta,
  plural,
  skiljetecken,
  berattelse,
  ordklasser,
  verbTempus,
  synonymer,
  stavaRatt,
  sambandsord,
];

