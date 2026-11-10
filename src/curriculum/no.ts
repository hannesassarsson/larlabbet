import { sample, type Rng } from '../lib/random';
import { fromBank, mc, unique } from './build';
import type { Activity, Grade, OrderQuestion, Question } from './types';

/**
 * NO – biologi, fysik och kemi.
 * Åk 1–3 följer Lgr22:s gemensamma centrala innehåll för NO-ämnena,
 * åk 4–6 är uppdelat på biologi, fysik och kemi.
 */

interface Fact {
  q: string;
  a: string;
  w: string[];
  e: string;
}

const AREA = {
  aret: 'Året runt i naturen (åk 1–3)',
  kropp: 'Kropp och hälsa (åk 1–3)',
  kraft: 'Kraft och rörelse (åk 1–3)',
  material: 'Material och ämnen (åk 1–3)',
  bi: 'Biologi (åk 4–6)',
  fy: 'Fysik (åk 4–6)',
  ke: 'Kemi (åk 4–6)',
};

const factQ = (f: Fact, rng?: Rng) => mc(f.q, f.a, f.w, rng, { explain: f.e });

/**
 * En övning som blandar faktafrågor med frågor från egna generatorer.
 * `extra` får ungefär var tredje plats, så att det blir omväxlande.
 */
function noActivity(
  id: string,
  title: string,
  description: string,
  grades: [Grade, Grade],
  area: string,
  facts: Fact[],
  extra?: (rng: Rng | undefined, i: number) => Question,
  /** Högst så många genererade frågor per omgång (när generatorn har få varianter). */
  maxExtra = Infinity
): Activity {
  return {
    id,
    title,
    description,
    subject: 'no',
    grades,
    area,
    generate: (_l, count, rng) => {
      if (!extra) return fromBank(facts, count, rng, (f) => factQ(f, rng));
      if (facts.length === 0) return unique(count, (i) => extra(rng, i));
      const nExtra = Math.min(maxExtra, Math.round(count / 3));
      const fq = fromBank(facts, count - nExtra, rng, (f) => factQ(f, rng));
      const xq = unique(nExtra, (i) => extra(rng, i));
      // Sprid ut genererade frågor jämnt: var tredje.
      const out: Question[] = [];
      let a = 0;
      let b = 0;
      for (let i = 0; i < count; i++) {
        if ((i % 3 === 2 && b < xq.length) || a >= fq.length) out.push(xq[b++]);
        else out.push(fq[a++]);
      }
      return out;
    },
  };
}

/* ================= Åk 1–3 ================= */

const ARSTIDER: Fact[] = [
  { q: 'Vilken årstid kommer efter vintern?', a: 'Våren', w: ['Sommaren', 'Hösten'], e: 'Vinter, vår, sommar, höst – och sedan vinter igen.' },
  { q: 'Vad gör igelkotten på vintern?', a: 'Den går i ide och sover', w: ['Den flyttar söderut', 'Den gräver tunnlar i snön'], e: 'Igelkotten sover i ett bo av löv hela vintern.' },
  { q: 'Varför flyttar många fåglar söderut på hösten?', a: 'Det blir svårt att hitta mat här', w: ['De vill bada i havet', 'De är rädda för mörkret'], e: 'Insekter och annan mat försvinner när det blir kallt.' },
  { q: 'Vad händer med lövträdens blad på hösten?', a: 'De byter färg och faller av', w: ['De blir större', 'De blir blå'], e: 'Träden vilar på vintern och behöver inte bladen.' },
  { q: 'Vilken årstid har längst dagar i Sverige?', a: 'Sommaren', w: ['Vintern', 'Hösten'], e: 'Långt i norr går solen inte ens ner på sommaren.' },
  { q: 'Vilket djur byter till vit päls på vintern?', a: 'Hermelinen', w: ['Räven', 'Grävlingen'], e: 'Den vita pälsen syns inte i snön.' },
  { q: 'Vad blir ett grodyngel till?', a: 'En groda', w: ['En fisk', 'En ödla'], e: 'Grodynglet får ben och tappar svansen.' },
  { q: 'Vad behöver en växt för att växa?', a: 'Vatten, ljus och näring', w: ['Bara mörker', 'Snö och is'], e: 'Utan ljus och vatten vissnar växten.' },
  { q: 'Vad samlar ekorren inför vintern?', a: 'Kottar och nötter', w: ['Snöbollar', 'Stenar'], e: 'Ekorren gömmer mat som den letar upp senare.' },
  { q: 'Vad är ett frö?', a: 'Början på en ny växt', w: ['En sorts sten', 'En liten insekt'], e: 'Om fröet får jord, vatten och värme börjar det gro.' },
  { q: 'Vilken blomma kommer ofta tidigt på våren?', a: 'Tussilago', w: ['Solros', 'Julstjärna'], e: 'Tussilagon blommar redan när snön smälter.' },
  { q: 'Vad gör björnen på vintern?', a: 'Den sover i ett ide', w: ['Den flyttar till Afrika', 'Den simmar i havet'], e: 'Björnen äter mycket på hösten och sover sedan hela vintern.' },
  { q: 'Hur många årstider har vi i Sverige?', a: 'Fyra', w: ['Två', 'Tolv'], e: 'Vår, sommar, höst och vinter.' },
  { q: 'Varför vaknar insekterna på våren?', a: 'Det blir varmare', w: ['Det blir mörkare', 'Det börjar snöa'], e: 'Insekter behöver värme för att kunna röra sig.' },
];

const KROPPEN: Fact[] = [
  { q: 'Vilket organ pumpar runt blodet i kroppen?', a: 'Hjärtat', w: ['Magen', 'Lungorna'], e: 'Hjärtat är en muskel som slår hela livet.' },
  { q: 'Vad gör lungorna?', a: 'De tar in luft när vi andas', w: ['De smälter maten', 'De pumpar blod'], e: 'Vi andas in syre och andas ut koldioxid.' },
  { q: 'Vilket sinne använder du när du känner en doft?', a: 'Luktsinnet', w: ['Synen', 'Hörseln'], e: 'Vi har fem sinnen: syn, hörsel, lukt, smak och känsel.' },
  { q: 'Vad är skelettet?', a: 'Alla ben i kroppen', w: ['All hud på kroppen', 'Allt blod i kroppen'], e: 'Skelettet bär upp kroppen och skyddar organen.' },
  { q: 'Varför ska man borsta tänderna?', a: 'För att de inte ska få hål', w: ['För att de ska växa', 'För att få bättre syn'], e: 'Bakterier och socker kan göra hål i tänderna.' },
  { q: 'Ungefär hur många timmar behöver ett barn sova varje natt?', a: 'Ungefär 10 timmar', w: ['Ungefär 3 timmar', 'Ungefär 20 timmar'], e: 'När vi sover växer kroppen och hjärnan vilar.' },
  { q: 'Varför ska man tvätta händerna?', a: 'För att få bort bakterier', w: ['För att bli längre', 'För att få starkare naglar'], e: 'Tvål och vatten tar bort bakterier som kan göra oss sjuka.' },
  { q: 'Vad skyddar hjärnan?', a: 'Skallen', w: ['Revbenen', 'Knäskålen'], e: 'Skallen är ett hårt skal av ben runt hjärnan.' },
  { q: 'Vad skyddar hjärtat och lungorna?', a: 'Revbenen', w: ['Skallen', 'Ryggraden'], e: 'Revbenen bildar en bur runt bröstet.' },
  { q: 'Vad gör att vi kan röra på oss?', a: 'Musklerna', w: ['Naglarna', 'Håret'], e: 'Musklerna drar i skelettet när vi rör oss.' },
  { q: 'Vart tar maten vägen när du har svalt den?', a: 'Ner i magsäcken', w: ['Upp i hjärnan', 'Ut i armarna'], e: 'Matstrupen leder ner till magsäcken.' },
  { q: 'Varför är det bra att röra på sig?', a: 'Hjärtat och musklerna blir starkare', w: ['Man slipper sova', 'Man blir aldrig hungrig'], e: 'Rörelse gör kroppen stark och man mår bättre.' },
  { q: 'Vad ska man dricka mest av när man är törstig?', a: 'Vatten', w: ['Läsk', 'Saft'], e: 'Vatten släcker törsten utan socker.' },
  { q: 'Vad är det som slår när du känner pulsen?', a: 'Hjärtat', w: ['Lungorna', 'Magen'], e: 'Pulsen är hjärtats slag som känns i blodkärlen.' },
];

const MATERIAL: Fact[] = [
  { q: 'Vad händer med is när det blir varmt?', a: 'Den smälter till vatten', w: ['Den blir till sten', 'Den blir större'], e: 'Is är fruset vatten.' },
  { q: 'Vad händer med vatten som kokar?', a: 'Det blir till ånga', w: ['Det blir till is', 'Det blir till sand'], e: 'Ångan är vatten i gasform.' },
  { q: 'Vilka former kan vatten ha?', a: 'Is, flytande vatten och ånga', w: ['Sand, sten och lera', 'Bara flytande'], e: 'Fast, flytande och gas.' },
  { q: 'Vilket material görs papper av?', a: 'Trä', w: ['Plast', 'Glas'], e: 'Papper tillverkas av fibrer från träd.' },
  { q: 'Vad ska man göra med en tom glasburk?', a: 'Lämna den till återvinning', w: ['Kasta den i skogen', 'Gräva ner den i trädgården'], e: 'Glas kan smältas och bli nya burkar.' },
  { q: 'Vilket material är genomskinligt?', a: 'Glas', w: ['Trä', 'Sten'], e: 'Ljuset går igenom glas, därför används det i fönster.' },
  { q: 'Vad händer med socker i varmt te?', a: 'Det löser sig i vattnet', w: ['Det blir till sten', 'Det flyter upp till ytan'], e: 'Sockret finns kvar fast vi inte ser det. Teet blir sött.' },
  { q: 'Vilket material passar bäst till en regnjacka?', a: 'Ett material som inte släpper igenom vatten', w: ['Ett material som suger upp vatten', 'Papper'], e: 'Regnkläder är ofta gjorda av plast eller gummi.' },
  { q: 'Vad drar en magnet till sig?', a: 'Saker av järn', w: ['Saker av trä', 'Saker av plast'], e: 'Magneter drar till sig järn, till exempel spikar och gem.' },
  { q: 'Vad händer med en vattenpöl en varm dag?', a: 'Vattnet avdunstar och pölen försvinner', w: ['Pölen fryser', 'Pölen blir större'], e: 'Vattnet blir till osynlig vattenånga i luften.' },
];

/** Flyter eller sjunker. Allt är vanliga saker barn kan prova själva. */
const FLYTER = ['en kork', 'en träbit', 'ett äpple', 'en isbit', 'ett löv', 'en badboll'];
const SJUNKER = ['en sten', 'en spik', 'en nyckel', 'ett mynt', 'en glaskula', 'en sked av metall'];
function flytaSjunka(rng: Rng | undefined): Question {
  const float = (rng ?? Math.random)() < 0.5;
  const [right] = sample(float ? FLYTER : SJUNKER, 1, rng);
  const wrong = sample(float ? SJUNKER : FLYTER, 2, rng);
  return mc(float ? 'Vilken sak flyter i vatten?' : 'Vilken sak sjunker i vatten?', right, wrong, rng, {
    explain: float ? `${cap(right)} är lätt för sin storlek och flyter.` : `${cap(right)} är tung för sin storlek och sjunker.`,
  });
}

const KRAFT: Fact[] = [
  { q: 'Varför faller ett äpple ner mot marken?', a: 'Jorden drar i det', w: ['Luften trycker ner det', 'Äpplet vill ner'], e: 'Kraften kallas tyngdkraft.' },
  { q: 'Var är det lättast att glida?', a: 'På is', w: ['På sand', 'På en matta'], e: 'Is är slät, så det blir lite friktion.' },
  { q: 'Vad kallas kraften som gör det svårt att dra en låda över en matta?', a: 'Friktion', w: ['Magnetism', 'Elektricitet'], e: 'Friktion bromsar när två ytor gnids mot varandra.' },
  { q: 'Vad behövs för att det ska bli en skugga?', a: 'Ljus som stoppas av något', w: ['Mörker överallt', 'Regn'], e: 'Skuggan blir där ljuset inte kommer fram.' },
  { q: 'Hur kommer ljud fram till ditt öra?', a: 'Som vibrationer i luften', w: ['Som ljus', 'Genom marken bara'], e: 'Ljud är skakningar som sprids genom luften.' },
  { q: 'Varför kan vi se månen på natten?', a: 'Solen lyser på den', w: ['Den har egna lampor', 'Den brinner'], e: 'Månen lyser inte själv. Den speglar solens ljus.' },
  { q: 'Vad händer om två magneter vänds nord mot nord?', a: 'De stöter bort varandra', w: ['De fastnar i varandra', 'Ingenting'], e: 'Lika poler stöter bort varandra, olika poler drar.' },
  { q: 'Vad händer med en boll som du kastar rakt upp?', a: 'Den faller ner igen', w: ['Den flyger ut i rymden', 'Den stannar i luften'], e: 'Tyngdkraften drar ner bollen.' },
  { q: 'En tung och en lätt person sitter på en gungbräda. Hur blir det balans?', a: 'Den tunga sitter närmare mitten', w: ['Den lätta sitter närmare mitten', 'Båda sitter längst ut'], e: 'Ju närmare mitten, desto mindre trycker man ner sin sida.' },
  { q: 'Hur blir skuggan när solen står lågt på kvällen?', a: 'Lång', w: ['Kort', 'Den försvinner helt'], e: 'Mitt på dagen står solen högt och skuggorna är korta.' },
  { q: 'Vad gör hjälmen när man cyklar?', a: 'Skyddar huvudet om man ramlar', w: ['Gör att man cyklar fortare', 'Håller håret torrt'], e: 'Hjälmen tar emot stöten i stället för huvudet.' },
];

/* ================= Åk 4–6: Biologi ================= */

const EKOLOGI: Fact[] = [
  { q: 'Vad behöver en växt för att kunna göra fotosyntes?', a: 'Solljus, vatten och koldioxid', w: ['Syre, socker och mörker', 'Jord, kyla och syre'], e: 'Med solens energi gör växten socker och syre.' },
  { q: 'Vad bildar växterna vid fotosyntesen?', a: 'Socker och syre', w: ['Koldioxid och vatten', 'Salt och järn'], e: 'Sockret är växtens näring. Syret behöver vi för att andas.' },
  { q: 'Vad kallas de som bryter ner döda växter och djur?', a: 'Nedbrytare', w: ['Producenter', 'Rovdjur'], e: 'Till exempel maskar, svampar och bakterier.' },
  { q: 'Vad är en producent i en näringskedja?', a: 'En växt som tillverkar sin egen näring', w: ['Ett djur som äter andra djur', 'Ett djur som bara äter växter'], e: 'Alla näringskedjor börjar med en producent.' },
  { q: 'Vad betyder allemansrätten?', a: 'Alla får vara i naturen, men måste ta hänsyn', w: ['Man får plocka och ta vad man vill', 'Man får bara gå på vägar'], e: 'Inte störa, inte förstöra.' },
  { q: 'Vilka djur hjälper till att pollinera blommor?', a: 'Insekter, till exempel bin', w: ['Fiskar, till exempel gäddor', 'Maskar, till exempel daggmaskar'], e: 'Bina för pollen från blomma till blomma.' },
  { q: 'Vad är ett ekosystem?', a: 'Växter, djur och miljön de lever i, tillsammans', w: ['Ett djur som lever helt ensamt i skogen', 'En maskin som renar vattnet i sjöar'], e: 'En skog, en sjö och en äng är exempel på ekosystem.' },
  { q: 'Vad kallas ett djur som bara äter växter?', a: 'Växtätare', w: ['Rovdjur', 'Allätare'], e: 'Ett djur som äter både växter och djur kallas allätare.' },
  { q: 'Vad händer troligen om alla rävar i en skog försvinner?', a: 'Det blir fler harar och möss', w: ['Det blir färre harar och möss', 'Ingenting förändras'], e: 'Ingen jagar längre bytesdjuren, så de blir fler.' },
  { q: 'Vilken gas andas vi ut?', a: 'Koldioxid', w: ['Syre', 'Helium'], e: 'Vi andas in syre och ut koldioxid. Växterna gör tvärtom.' },
  { q: 'Varför är det viktigt att många olika arter finns?', a: 'Arterna behöver varandra i naturen', w: ['Det gör ingen skillnad', 'Så att det blir fler rovdjur'], e: 'Det kallas biologisk mångfald.' },
];

/** Näringskedjor, alltid fyra led, från producent till rovdjur. */
const KEDJOR: string[][] = [
  ['Gräs', 'Gräshoppa', 'Groda', 'Huggorm'],
  ['Växtplankton', 'Djurplankton', 'Strömming', 'Säl'],
  ['Eklöv', 'Fjärilslarv', 'Talgoxe', 'Sparvhök'],
  ['Frön', 'Skogsmus', 'Huggorm', 'Ormvråk'],
  ['Alger', 'Snäcka', 'Abborre', 'Gädda'],
];
function naringskedja(rng: Rng | undefined): OrderQuestion {
  const [k] = sample(KEDJOR, 1, rng);
  return {
    kind: 'order',
    prompt: 'Lägg näringskedjan i ordning. Börja med det som blir uppätet först.',
    items: k,
    notes: ['producent', 'äter ' + k[0].toLocaleLowerCase('sv'), 'äter ' + k[1].toLocaleLowerCase('sv'), 'äter ' + k[2].toLocaleLowerCase('sv')],
    explain: 'Energin kommer från solen och börjar i växten.',
  };
}

const DJURGRUPPER: Record<string, { djur: string[]; om: string }> = {
  Däggdjur: { djur: ['Hund', 'Val', 'Fladdermus', 'Igelkott', 'Älg', 'Delfin', 'Ekorre', 'Säl'], om: 'Däggdjur föder levande ungar som dricker mjölk.' },
  Fåglar: { djur: ['Pingvin', 'Struts', 'Kråka', 'Uggla', 'Svan', 'Hackspett'], om: 'Fåglar har fjädrar och lägger ägg. Alla kan inte flyga.' },
  Fiskar: { djur: ['Gädda', 'Lax', 'Haj', 'Abborre', 'Torsk'], om: 'Fiskar andas med gälar och har fenor.' },
  Groddjur: { djur: ['Groda', 'Padda', 'Vattensalamander'], om: 'Groddjur börjar livet i vatten och kan sedan leva på land.' },
  Kräldjur: { djur: ['Huggorm', 'Ödla', 'Krokodil', 'Sköldpadda'], om: 'Kräldjur har torr hud med fjäll.' },
  Insekter: { djur: ['Myra', 'Bi', 'Fjäril', 'Nyckelpiga', 'Mygga'], om: 'Insekter har sex ben och kroppen i tre delar.' },
};
const GRUPPNAMN = Object.keys(DJURGRUPPER);
function djurgrupp(rng: Rng | undefined): Question {
  const [grupp] = sample(GRUPPNAMN, 1, rng);
  const { djur, om } = DJURGRUPPER[grupp];
  const [d] = sample(djur, 1, rng);
  if ((rng ?? Math.random)() < 0.5) {
    return mc(`Vilken djurgrupp hör ${d.toLocaleLowerCase('sv')} till?`, grupp, GRUPPNAMN.filter((g) => g !== grupp), rng, { explain: om });
  }
  const others = sample(
    GRUPPNAMN.filter((g) => g !== grupp),
    3,
    rng
  ).map((g) => sample(DJURGRUPPER[g].djur, 1, rng)[0]);
  const singular: Record<string, string> = { Däggdjur: 'ett däggdjur', Fåglar: 'en fågel', Fiskar: 'en fisk', Groddjur: 'ett groddjur', Kräldjur: 'ett kräldjur', Insekter: 'en insekt' };
  return mc(`Vilket djur är ${singular[grupp]}?`, d, others, rng, { explain: om });
}

const KROPPEN_46: Fact[] = [
  { q: 'Vad gör de röda blodkropparna?', a: 'Transporterar syre', w: ['Bekämpar bakterier', 'Smälter maten'], e: 'De hämtar syre i lungorna och lämnar det i kroppen.' },
  { q: 'Vad gör de vita blodkropparna?', a: 'Försvarar kroppen mot bakterier och virus', w: ['Transporterar syre runt i kroppen', 'Gör att blodet blir rött och tjockt'], e: 'De är en del av immunförsvaret.' },
  { q: 'Var tas syret upp i blodet?', a: 'I lungorna', w: ['I magsäcken', 'I njurarna'], e: 'I lungornas små blåsor går syret över till blodet.' },
  { q: 'Vad gör tunntarmen?', a: 'Tar upp näring från maten till blodet', w: ['Pumpar runt blodet i kroppen', 'Renar luften vi andas in'], e: 'Tunntarmen är flera meter lång.' },
  { q: 'Vad gör njurarna?', a: 'Renar blodet och bildar urin', w: ['Tar upp syre från luften', 'Gör maten mjuk innan magen'], e: 'Vi har två njurar.' },
  { q: 'Ungefär hur många ben har en vuxen människa?', a: 'Ungefär 200', w: ['Ungefär 20', 'Ungefär 2 000'], e: 'En vuxen har 206 ben. En bebis har fler, som växer ihop.' },
  { q: 'Vad kallas tiden när kroppen förändras från barn till vuxen?', a: 'Puberteten', w: ['Förkylningen', 'Ämnesomsättningen'], e: 'Det sker vid olika ålder för olika personer.' },
  { q: 'Vad behöver kroppen protein till?', a: 'Att bygga och laga muskler och celler', w: ['Att hålla kroppen varm på natten', 'Att göra skelettet mjukt och böjligt'], e: 'Protein finns till exempel i bönor, fisk, ägg och kött.' },
  { q: 'Hur fungerar ett vaccin?', a: 'Kroppen lär sig försvara sig mot en sjukdom', w: ['Det dödar alla bakterier i kroppen', 'Det gör en starkare i musklerna'], e: 'Immunförsvaret kommer ihåg sjukdomen och är redo.' },
  { q: 'Var börjar matsmältningen?', a: 'I munnen', w: ['I tjocktarmen', 'I njurarna'], e: 'Tänderna tuggar och saliven börjar bryta ner maten.' },
  { q: 'Vilket är kroppens största organ?', a: 'Huden', w: ['Hjärnan', 'Hjärtat'], e: 'Huden skyddar kroppen och känner beröring, värme och kyla.' },
];

/* ================= Åk 4–6: Fysik ================= */

const EL_ENERGI: Fact[] = [
  { q: 'Vad behövs för att en lampa ska lysa i en elektrisk krets?', a: 'En sluten krets med en strömkälla', w: ['En öppen krets utan strömkälla', 'En enda sladd till lampan'], e: 'Strömmen måste kunna gå hela varvet.' },
  { q: 'Vad händer med lampan om kretsen bryts?', a: 'Den slocknar', w: ['Den lyser starkare', 'Den byter färg'], e: 'När kretsen är öppen kan ingen ström gå.' },
  { q: 'Vad gör en strömbrytare?', a: 'Öppnar och stänger kretsen', w: ['Gör strömmen starkare', 'Laddar batteriet'], e: 'Tänd: kretsen är sluten. Släckt: kretsen är öppen.' },
  { q: 'Vilken energikälla tar inte slut?', a: 'Vindkraft', w: ['Olja', 'Kol'], e: 'Vind, sol och vatten är förnybara energikällor.' },
  { q: 'Varför ser man blixten innan man hör åskan?', a: 'Ljuset färdas snabbare än ljudet', w: ['Ljudet startar senare', 'Ögonen är snabbare än öronen'], e: 'Räkna sekunderna och dela med tre, så vet du ungefär hur många kilometer bort åskan är.' },
  { q: 'Varför hörs inget ljud i rymden?', a: 'Det finns ingen luft som ljudet kan färdas i', w: ['Det är för kallt för att ljud ska höras', 'Det är för långt mellan stjärnorna'], e: 'Ljud är vibrationer och behöver något att vibrera i.' },
  { q: 'Vad händer med ljus som träffar en spegel?', a: 'Det studsar tillbaka', w: ['Det försvinner', 'Det blir till ljud'], e: 'Det kallas reflektion.' },
  { q: 'Vad händer med energin när en lampa lyser?', a: 'Elenergi blir ljus och värme', w: ['Energin försvinner', 'Ljus blir till el'], e: 'Energi kan inte försvinna, bara omvandlas.' },
  { q: 'Varför ska man aldrig klättra nära kraftledningar?', a: 'Elen kan ge livsfarliga stötar', w: ['Ledningarna är vassa', 'Fåglarna blir arga'], e: 'Strömmen kan hoppa över till en person även utan att man rör ledningen.' },
  { q: 'Vad drar en kompassnål mot norr?', a: 'Jordens magnetfält', w: ['Solens ljus', 'Vindens riktning'], e: 'Jorden fungerar som en stor magnet.' },
];

const LEDARE = ['En spik', 'Aluminiumfolie', 'Ett gem av metall', 'En nyckel', 'En kopparsladd', 'Ett mynt'];
const ISOLATORER = ['En plastlinjal', 'Ett suddgummi', 'En träpinne', 'Ett glas', 'Ett papper', 'Ett gummiband'];
function ledareIsolator(rng: Rng | undefined): Question {
  const leder = (rng ?? Math.random)() < 0.5;
  const [right] = sample(leder ? LEDARE : ISOLATORER, 1, rng);
  const wrong = sample(leder ? ISOLATORER : LEDARE, 2, rng);
  return mc(leder ? 'Vilken sak leder elektrisk ström?' : 'Vilken sak leder inte elektrisk ström?', right, wrong, rng, {
    explain: 'Metaller leder ström. Plast, trä, glas och gummi är isolatorer.',
  });
}

const RYMDEN: Fact[] = [
  { q: 'Varför blir det dag och natt?', a: 'Jorden snurrar runt sin egen axel', w: ['Solen åker runt jorden', 'Månen skymmer solen'], e: 'Ett varv tar ett dygn.' },
  { q: 'Hur lång tid tar det för jorden att gå ett varv runt solen?', a: 'Ett år', w: ['Ett dygn', 'En månad'], e: 'Ungefär 365 dygn.' },
  { q: 'Varför har vi årstider?', a: 'Jordaxeln lutar', w: ['Jorden är närmare solen på sommaren', 'Solen lyser starkare på sommaren'], e: 'På sommaren lutar vår del av jorden mot solen.' },
  { q: 'Vilken planet är störst?', a: 'Jupiter', w: ['Jorden', 'Mars'], e: 'Jupiter är en gasjätte. Över tusen jordklot skulle få plats i den.' },
  { q: 'Vad är solen?', a: 'En stjärna', w: ['En planet', 'En måne'], e: 'Solen är den stjärna som ligger närmast oss.' },
  { q: 'Varför ser månen olika ut under en månad?', a: 'Vi ser olika mycket av dess solbelysta sida', w: ['Jordens skugga täcker den', 'Månen krymper och växer'], e: 'Det kallas månens faser.' },
  { q: 'Ungefär hur lång tid tar det för månen att gå ett varv runt jorden?', a: 'En månad', w: ['Ett dygn', 'Ett år'], e: 'Ordet månad kommer från månen.' },
  { q: 'Vilken planet kallas den röda planeten?', a: 'Mars', w: ['Venus', 'Saturnus'], e: 'Marken på Mars innehåller rost, som gör den röd.' },
  { q: 'Vad heter vår galax?', a: 'Vintergatan', w: ['Andromeda', 'Karlavagnen'], e: 'Karlavagnen är en stjärnbild.' },
  { q: 'Vilken planet har tydliga ringar?', a: 'Saturnus', w: ['Merkurius', 'Mars'], e: 'Ringarna består av is och sten.' },
];

const PLANETER = ['Merkurius', 'Venus', 'Jorden', 'Mars', 'Jupiter', 'Saturnus', 'Uranus', 'Neptunus'];
function planetordning(rng: Rng | undefined): OrderQuestion {
  const idx = sample(
    PLANETER.map((_, i) => i),
    4,
    rng
  ).sort((a, b) => a - b);
  return {
    kind: 'order',
    prompt: 'Lägg planeterna i ordning, närmast solen först.',
    items: idx.map((i) => PLANETER[i]),
    notes: idx.map((i) => `planet ${i + 1}`),
    explain: 'Merkurius, Venus, Jorden, Mars, Jupiter, Saturnus, Uranus, Neptunus.',
  };
}

/* ================= Åk 4–6: Kemi ================= */

const KEMI: Fact[] = [
  { q: 'Vilka tre former kan ett ämne ha?', a: 'Fast, flytande och gas', w: ['Hård, mjuk och blöt', 'Varm, kall och ljum'], e: 'Vatten kan vara is, vatten och vattenånga.' },
  { q: 'Vad kallas det när vatten blir vattenånga utan att koka?', a: 'Avdunstning', w: ['Kondensation', 'Frysning'], e: 'Tvätt torkar för att vattnet avdunstar.' },
  { q: 'Vad kallas det när vattenånga blir till droppar på en kall spegel?', a: 'Kondensation', w: ['Avdunstning', 'Smältning'], e: 'Ångan kyls av och blir flytande igen.' },
  { q: 'Vad behöver en eld för att kunna brinna?', a: 'Bränsle, syre och värme', w: ['Bara ved', 'Vatten och ved'], e: 'Tar man bort en av de tre slocknar elden.' },
  { q: 'Varför kan man släcka en liten brand med en brandfilt?', a: 'Elden får inget syre', w: ['Filten är kall', 'Filten är blöt'], e: 'Utan syre slocknar elden.' },
  { q: 'Vilken av de här vätskorna är sur?', a: 'Citronsaft', w: ['Rent vatten', 'Tvålvatten'], e: 'Tvålvatten är basiskt. Rent vatten är neutralt.' },
  { q: 'Hur kan man få tillbaka saltet ur saltvatten?', a: 'Låta vattnet avdunsta', w: ['Frysa vattnet', 'Röra snabbt'], e: 'Vattnet försvinner som ånga och saltet blir kvar.' },
  { q: 'Varför sorterar vi sopor?', a: 'Materialen kan återvinnas till nya saker', w: ['Det blir mindre luft i påsen', 'Soporna blir lättare'], e: 'Återvinning sparar råvaror och energi.' },
  { q: 'Vad behövs för att järn ska rosta?', a: 'Syre och vatten', w: ['Bara solljus', 'Mörker och kyla'], e: 'Därför rostar en cykel som står ute i regnet.' },
  { q: 'Vilken gas finns det mest av i luften?', a: 'Kväve', w: ['Syre', 'Koldioxid'], e: 'Luften är ungefär fyra femtedelar kväve och en femtedel syre.' },
  { q: 'Vad händer med de flesta ämnen när de värms upp?', a: 'De utvidgar sig', w: ['De krymper alltid', 'De blir tyngre'], e: 'Därför finns det skarvar i järnvägsräls och broar.' },
];

const KRETSLOPP = ['Solen värmer vattnet i havet', 'Vattnet avdunstar och blir vattenånga', 'Ångan kyls av och bildar moln', 'Det regnar och vattnet rinner tillbaka till havet'];
const PAPPER = ['Gamla tidningar samlas in', 'Pappret blöts upp till en massa', 'Massan rensas från färg', 'Massan pressas och torkas till nytt papper'];
const BRÖD = ['Vete växer på åkern', 'Vetet mals till mjöl', 'Degen jäser', 'Brödet gräddas i ugnen'];
const KEMI_ORDNING: OrderQuestion[] = [
  { kind: 'order', prompt: 'Lägg vattnets kretslopp i rätt ordning.', items: KRETSLOPP, explain: 'Vattnet går runt, runt i naturen.' },
  { kind: 'order', prompt: 'Hur blir gamla tidningar nytt papper? Lägg i ordning.', items: PAPPER, explain: 'Papper kan återvinnas ungefär sju gånger.' },
  { kind: 'order', prompt: 'Hur blir det bröd? Lägg i rätt ordning.', items: BRÖD, explain: 'Jästen bildar gas som får degen att jäsa.' },
];
function kemiOrdning(rng: Rng | undefined, i: number): OrderQuestion {
  // Kretsloppet först, sedan i tur och ordning, med slumpad start för omväxling.
  const start = i === 0 ? 0 : Math.floor((rng ?? Math.random)() * KEMI_ORDNING.length);
  return KEMI_ORDNING[(start + i) % KEMI_ORDNING.length];
}

function cap(s: string) {
  return s.charAt(0).toLocaleUpperCase('sv') + s.slice(1);
}

export const NO_ACTIVITIES: Activity[] = [
  noActivity('no-arstider', 'Året runt i naturen', 'Årstider, djur och växter under året.', [0, 3], AREA.aret, ARSTIDER),
  noActivity('no-kroppen', 'Kroppen', 'Hjärtat, lungorna, sinnena och hur vi håller oss friska.', [0, 3], AREA.kropp, KROPPEN),
  noActivity('no-material', 'Material och vatten', 'Flyta eller sjunka, is och ånga, sortera och återvinna.', [1, 3], AREA.material, MATERIAL, (rng) => flytaSjunka(rng)),
  noActivity('no-kraft', 'Kraft, ljud och ljus', 'Tyngdkraft, friktion, skuggor och magneter.', [1, 3], AREA.kraft, KRAFT),
  noActivity('bi-djurgrupper', 'Djurgrupper', 'Däggdjur, fåglar, fiskar, groddjur, kräldjur och insekter.', [2, 6], AREA.bi, [], (rng) => djurgrupp(rng)),
  noActivity('bi-ekologi', 'Ekologi och näringskedjor', 'Fotosyntes, nedbrytare, näringskedjor och allemansrätten.', [4, 6], AREA.bi, EKOLOGI, (rng) => naringskedja(rng)),
  noActivity('bi-kroppen', 'Människokroppen', 'Blodet, matsmältningen, immunförsvaret och puberteten.', [4, 6], AREA.bi, KROPPEN_46),
  noActivity('fy-el-energi', 'El, energi, ljud och ljus', 'Elektriska kretsar, ledare, energikällor och ljudets fart.', [4, 6], AREA.fy, EL_ENERGI, (rng) => ledareIsolator(rng)),
  noActivity('fy-rymden', 'Solsystemet', 'Dag och natt, årstider, månens faser och planeterna.', [3, 6], AREA.fy, RYMDEN, (rng) => planetordning(rng)),
  noActivity('ke-vardag', 'Kemi i vardagen', 'Fast, flytande och gas, förbränning, syror och återvinning.', [4, 6], AREA.ke, KEMI, (rng, i) => kemiOrdning(rng, i), 2),
];
