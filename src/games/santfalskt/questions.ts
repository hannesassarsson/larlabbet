import { sample, shuffle, type Rng } from '../../lib/random';

export type QuizTopic = 'djur' | 'natur' | 'geografi' | 'kunskap';

export interface Statement {
  text: string;
  answer: boolean;
  explain: string;
  topic: QuizTopic;
}

export const TOPICS: { value: QuizTopic | 'alla'; label: string; hint: string }[] = [
  { value: 'alla', label: 'Blandat', hint: 'Lite av allt' },
  { value: 'djur', label: 'Djur', hint: 'Stora och små' },
  { value: 'natur', label: 'Natur', hint: 'Väder, växter, rymd' },
  { value: 'geografi', label: 'Geografi', hint: 'Sverige och världen' },
  { value: 'kunskap', label: 'Kunskap', hint: 'Kroppen och vardagen' },
];

export const TOPIC_NAMES: Record<QuizTopic, string> = {
  djur: 'Djur',
  natur: 'Natur',
  geografi: 'Geografi',
  kunskap: 'Kunskap',
};

export const STATEMENTS: Statement[] = [
  // Djur
  { topic: 'djur', text: 'En spindel har åtta ben.', answer: true, explain: 'Spindlar har åtta ben. Insekter, som myror och flugor, har sex.' },
  { topic: 'djur', text: 'Valen är en fisk.', answer: false, explain: 'Valen är ett däggdjur. Den andas luft och ungarna dricker mjölk.' },
  { topic: 'djur', text: 'Pingviner kan flyga.', answer: false, explain: 'Pingviner kan inte flyga, men de är jätteduktiga på att simma.' },
  { topic: 'djur', text: 'Bläckfisken har åtta armar.', answer: true, explain: 'Bläckfisken har åtta armar med sugkoppar.' },
  { topic: 'djur', text: 'Igelkotten sover på vintern.', answer: true, explain: 'Igelkotten sover vintersömn i ett bo av löv tills det blir varmt igen.' },
  { topic: 'djur', text: 'Kon har en mage med fyra olika delar.', answer: true, explain: 'Kons mage har fyra delar. Det hjälper den att smälta gräs.' },
  { topic: 'djur', text: 'Grodor börjar sitt liv som grodyngel.', answer: true, explain: 'Grodyngel lever i vatten och har svans. Sedan växer de och blir grodor.' },
  { topic: 'djur', text: 'En fjäril har först varit en larv.', answer: true, explain: 'Larven äter och växer, gör en puppa och blir sedan en fjäril.' },
  { topic: 'djur', text: 'Ugglor kan vrida huvudet ett helt varv runt.', answer: false, explain: 'Ugglor kan vrida huvudet väldigt långt, men inte ett helt varv.' },
  { topic: 'djur', text: 'Älgen är Sveriges största vilda landdjur.', answer: true, explain: 'Älgen är störst. En stor älgtjur kan väga lika mycket som en liten bil.' },
  { topic: 'djur', text: 'Ekorren lägger ägg.', answer: false, explain: 'Ekorren är ett däggdjur. Den föder levande ungar.' },
  { topic: 'djur', text: 'Myror kan bära saker som är tyngre än de själva.', answer: true, explain: 'Myror är superstarka och kan bära många gånger sin egen vikt.' },
  { topic: 'djur', text: 'Giraffen har lika många halskotor som en människa.', answer: true, explain: 'Båda har sju halskotor. Giraffens kotor är bara mycket längre.' },
  { topic: 'djur', text: 'Hönor har tänder.', answer: false, explain: 'Fåglar har inga tänder. De har en näbb i stället.' },
  { topic: 'djur', text: 'Delfiner andas genom ett hål på huvudet.', answer: true, explain: 'Hålet kallas blåshål. Delfinen kommer upp till ytan för att andas.' },
  { topic: 'djur', text: 'Katter kan se när det är helt kolsvart.', answer: false, explain: 'Katter ser bra när det är skumt, men i helt mörker ser inte ens en katt.' },
  { topic: 'djur', text: 'Hajens skelett är gjort av brosk.', answer: true, explain: 'Hajen har brosk i stället för ben – samma sak som finns i dina öron.' },

  // Natur
  { topic: 'natur', text: 'Vatten fryser till is vid noll grader.', answer: true, explain: 'När det blir noll grader eller kallare fryser vatten till is.' },
  { topic: 'natur', text: 'Solen är en stjärna.', answer: true, explain: 'Solen är den stjärna som ligger närmast jorden.' },
  { topic: 'natur', text: 'Månen lyser av sig själv.', answer: false, explain: 'Månen lyser för att solens ljus studsar mot den.' },
  { topic: 'natur', text: 'De flesta växter behöver ljus för att växa.', answer: true, explain: 'Växter använder ljus från solen för att göra sin egen mat.' },
  { topic: 'natur', text: 'Vid åska ser man blixten innan man hör mullret.', answer: true, explain: 'Ljus går mycket fortare än ljud. Därför ser vi blixten först.' },
  { topic: 'natur', text: 'Jorden är platt.', answer: false, explain: 'Jorden är rund som ett klot.' },
  { topic: 'natur', text: 'Ekollon kommer från eken.', answer: true, explain: 'Ekollon är ekens frön. Av ett ekollon kan det växa en ny ek.' },
  { topic: 'natur', text: 'Is flyter på vatten.', answer: true, explain: 'Is är lättare än lika mycket vatten, därför flyter isen.' },
  { topic: 'natur', text: 'Svampar är växter.', answer: false, explain: 'Svampar är en egen grupp av levande saker. De är varken växter eller djur.' },
  { topic: 'natur', text: 'Det tar ett år för jorden att åka ett varv runt solen.', answer: true, explain: 'Ett varv runt solen tar ett år.' },
  { topic: 'natur', text: 'Det finns luft att andas på månen.', answer: false, explain: 'På månen finns ingen luft. Astronauter måste ha rymddräkt.' },
  { topic: 'natur', text: 'Mars kallas den röda planeten.', answer: true, explain: 'Marken på Mars är rödaktig, därför kallas den den röda planeten.' },
  { topic: 'natur', text: 'Jupiter är den största planeten i vårt solsystem.', answer: true, explain: 'Jupiter är så stor att mer än tusen jordklot skulle få plats i den.' },
  { topic: 'natur', text: 'Morötter växer under jorden.', answer: true, explain: 'Moroten är en rot. Det gröna bladet syns ovanför jorden.' },

  // Geografi
  { topic: 'geografi', text: 'Stockholm är Sveriges huvudstad.', answer: true, explain: 'Stockholm är Sveriges huvudstad och största stad.' },
  { topic: 'geografi', text: 'Sverige har gräns mot både Norge och Finland.', answer: true, explain: 'Norge ligger i väster och Finland i öster.' },
  { topic: 'geografi', text: 'Afrika är ett land.', answer: false, explain: 'Afrika är en världsdel med fler än femtio länder.' },
  { topic: 'geografi', text: 'Kebnekaise är Sveriges högsta berg.', answer: true, explain: 'Kebnekaise ligger i Lappland långt upp i norr.' },
  { topic: 'geografi', text: 'Vänern är Sveriges största sjö.', answer: true, explain: 'Vänern är Sveriges största sjö och en av de största i Europa.' },
  { topic: 'geografi', text: 'Australien ligger i Europa.', answer: false, explain: 'Australien ligger på andra sidan jorden, långt bort från Europa.' },
  { topic: 'geografi', text: 'Det bor pingviner vid Nordpolen.', answer: false, explain: 'Vilda pingviner lever på södra delen av jorden, bland annat vid Sydpolen.' },
  { topic: 'geografi', text: 'Nilen är en flod i Afrika.', answer: true, explain: 'Nilen är en av världens längsta floder.' },
  { topic: 'geografi', text: 'Sveriges flagga är blå och gul.', answer: true, explain: 'Flaggan har ett gult kors på blå botten.' },
  { topic: 'geografi', text: 'Gotland är Sveriges största ö.', answer: true, explain: 'Gotland ligger i Östersjön och är Sveriges största ö.' },
  { topic: 'geografi', text: 'Det är sommar i Sverige i december.', answer: false, explain: 'I december är det vinter i Sverige. Sommar är det i juni, juli och augusti.' },

  // Kunskap
  { topic: 'kunskap', text: 'Hjärtat pumpar runt blodet i kroppen.', answer: true, explain: 'Hjärtat är en muskel som slår hela tiden och pumpar blod.' },
  { topic: 'kunskap', text: 'En vecka har åtta dagar.', answer: false, explain: 'En vecka har sju dagar, från måndag till söndag.' },
  { topic: 'kunskap', text: 'Ett år har tolv månader.', answer: true, explain: 'Året börjar med januari och slutar med december.' },
  { topic: 'kunskap', text: 'En triangel har fyra hörn.', answer: false, explain: 'En triangel har tre hörn och tre sidor.' },
  { topic: 'kunskap', text: 'En vuxen människa har ungefär 200 ben i kroppen.', answer: true, explain: 'En vuxen har 206 ben. Små barn har ännu fler som sedan växer ihop.' },
  { topic: 'kunskap', text: 'Man ska äta upp snö som är gul.', answer: false, explain: 'Gul snö ska man inte äta – och egentligen ingen annan snö heller!' },
  { topic: 'kunskap', text: 'Rött och gult blir orange när man blandar dem.', answer: true, explain: 'Blanda rött och gult så får du orange.' },
  { topic: 'kunskap', text: 'Blått och gult blir lila när man blandar dem.', answer: false, explain: 'Blått och gult blir grönt. Lila får man av rött och blått.' },
  { topic: 'kunskap', text: 'Ett dygn har 24 timmar.', answer: true, explain: 'Ett dygn är en dag och en natt tillsammans: 24 timmar.' },
];

export const QUIZ_ROUND = 10;

/** Tio blandade påståenden med ungefär lika många sanna och falska. */
export function buildQuizRound(topic: QuizTopic | 'alla', rng?: Rng, length = QUIZ_ROUND): Statement[] {
  const pool = topic === 'alla' ? STATEMENTS : STATEMENTS.filter((s) => s.topic === topic);
  const n = Math.min(length, pool.length);
  const trues = shuffle(pool.filter((s) => s.answer), rng);
  const falses = shuffle(pool.filter((s) => !s.answer), rng);
  const wantFalse = Math.min(falses.length, Math.round(n * 0.45));
  const chosen = [...falses.slice(0, wantFalse), ...trues.slice(0, n - wantFalse)];
  if (chosen.length < n) chosen.push(...sample(pool.filter((s) => !chosen.includes(s)), n - chosen.length, rng));
  return shuffle(chosen, rng);
}
