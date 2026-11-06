import type { PicId } from '../components/pictures';
import { sample, type Rng } from '../lib/random';
import { fromBank, mc } from './build';
import type { Activity, Grade, LevelOption, Question, WordList, WordPair } from './types';

/** Färdiga glosor. Orden är valda så att varje svenskt ord har ett tydligt engelskt ord. */
export const BUILTIN_LISTS: (WordList & { grades: [Grade, Grade]; pics?: Partial<Record<string, PicId>> })[] = [
  {
    id: 'farger',
    title: 'Färger',
    grades: [1, 3],
    pairs: [
      ['röd', 'red'],
      ['blå', 'blue'],
      ['gul', 'yellow'],
      ['grön', 'green'],
      ['svart', 'black'],
      ['vit', 'white'],
      ['rosa', 'pink'],
      ['lila', 'purple'],
      ['orange', 'orange'],
      ['brun', 'brown'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'djur',
    title: 'Djur',
    grades: [1, 3],
    pics: { hund: 'hund', katt: 'katt', ko: 'ko', gris: 'gris', fisk: 'fisk', mus: 'mus', lejon: 'lejon', elefant: 'elefant', apa: 'apa', orm: 'orm', anka: 'anka', uggla: 'uggla', räv: 'räv', zebra: 'zebra', val: 'val' },
    pairs: [
      ['hund', 'dog'],
      ['katt', 'cat'],
      ['häst', 'horse'],
      ['ko', 'cow'],
      ['gris', 'pig'],
      ['fågel', 'bird'],
      ['fisk', 'fish'],
      ['mus', 'mouse'],
      ['kanin', 'rabbit'],
      ['björn', 'bear'],
      ['lejon', 'lion'],
      ['elefant', 'elephant'],
      ['apa', 'monkey'],
      ['orm', 'snake'],
      ['anka', 'duck'],
      ['uggla', 'owl'],
      ['räv', 'fox'],
      ['zebra', 'zebra'],
      ['val', 'whale'],
      ['får', 'sheep'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'siffror',
    title: 'Siffror 1–20',
    grades: [1, 3],
    pairs: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'].map((en, i) => ({
      sv: String(i + 1),
      en,
    })),
  },
  {
    id: 'familj',
    title: 'Familjen',
    grades: [2, 4],
    pairs: [
      ['mamma', 'mother'],
      ['pappa', 'father'],
      ['syster', 'sister'],
      ['bror', 'brother'],
      ['farmor', 'grandmother'],
      ['farfar', 'grandfather'],
      ['kusin', 'cousin'],
      ['baby', 'baby'],
      ['familj', 'family'],
      ['vän', 'friend'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'kroppen',
    title: 'Kroppen',
    grades: [2, 4],
    pairs: [
      ['huvud', 'head'],
      ['hand', 'hand'],
      ['fot', 'foot'],
      ['arm', 'arm'],
      ['ben', 'leg'],
      ['öga', 'eye'],
      ['öra', 'ear'],
      ['näsa', 'nose'],
      ['mun', 'mouth'],
      ['hår', 'hair'],
      ['tand', 'tooth'],
      ['finger', 'finger'],
      ['knä', 'knee'],
      ['axel', 'shoulder'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'mat',
    title: 'Mat och dryck',
    grades: [2, 4],
    pics: { äpple: 'äpple', banan: 'banan', ost: 'ost', ägg: 'ägg', glass: 'glass', jordgubbe: 'jordgubbe', tomat: 'tomat', kaka: 'kaka' },
    pairs: [
      ['äpple', 'apple'],
      ['banan', 'banana'],
      ['bröd', 'bread'],
      ['mjölk', 'milk'],
      ['ost', 'cheese'],
      ['ägg', 'egg'],
      ['vatten', 'water'],
      ['glass', 'ice cream'],
      ['smör', 'butter'],
      ['jordgubbe', 'strawberry'],
      ['tomat', 'tomato'],
      ['morot', 'carrot'],
      ['potatis', 'potato'],
      ['kaka', 'cake'],
      ['juice', 'juice'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'skolan',
    title: 'I skolan',
    grades: [2, 5],
    pairs: [
      ['bok', 'book'],
      ['blyertspenna', 'pencil'],
      ['linjal', 'ruler'],
      ['lärare', 'teacher'],
      ['skola', 'school'],
      ['klassrum', 'classroom'],
      ['bord', 'table'],
      ['stol', 'chair'],
      ['sax', 'scissors'],
      ['väska', 'bag'],
      ['dator', 'computer'],
      ['tavla', 'board'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'veckodagar',
    title: 'Veckodagar och månader',
    grades: [3, 6],
    pairs: [
      ['måndag', 'Monday'],
      ['tisdag', 'Tuesday'],
      ['onsdag', 'Wednesday'],
      ['torsdag', 'Thursday'],
      ['fredag', 'Friday'],
      ['lördag', 'Saturday'],
      ['söndag', 'Sunday'],
      ['januari', 'January'],
      ['februari', 'February'],
      ['mars', 'March'],
      ['april', 'April'],
      ['maj', 'May'],
      ['juni', 'June'],
      ['juli', 'July'],
      ['augusti', 'August'],
      ['september', 'September'],
      ['oktober', 'October'],
      ['november', 'November'],
      ['december', 'December'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'klader',
    title: 'Kläder',
    grades: [3, 5],
    pics: { sko: 'sko' },
    pairs: [
      ['jacka', 'jacket'],
      ['sko', 'shoe'],
      ['strumpa', 'sock'],
      ['klänning', 'dress'],
      ['kjol', 'skirt'],
      ['skjorta', 'shirt'],
      ['handske', 'glove'],
      ['halsduk', 'scarf'],
      ['hatt', 'hat'],
      ['stövel', 'boot'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'vader',
    title: 'Väder och natur',
    grades: [3, 6],
    pics: { sol: 'sol', moln: 'moln', träd: 'träd', blomma: 'blomma', regnbåge: 'regnbåge', måne: 'måne', stjärna: 'stjärna' },
    pairs: [
      ['sol', 'sun'],
      ['regn', 'rain'],
      ['snö', 'snow'],
      ['vind', 'wind'],
      ['moln', 'cloud'],
      ['varm', 'warm'],
      ['kall', 'cold'],
      ['träd', 'tree'],
      ['blomma', 'flower'],
      ['regnbåge', 'rainbow'],
      ['måne', 'moon'],
      ['stjärna', 'star'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'hemma',
    title: 'Hemma',
    grades: [3, 6],
    pics: { hus: 'hus', dörr: 'dörr', lampa: 'lampa' },
    pairs: [
      ['hus', 'house'],
      ['rum', 'room'],
      ['kök', 'kitchen'],
      ['säng', 'bed'],
      ['dörr', 'door'],
      ['fönster', 'window'],
      ['lampa', 'lamp'],
      ['soffa', 'sofa'],
      ['badrum', 'bathroom'],
      ['trädgård', 'garden'],
    ].map(([sv, en]) => ({ sv, en })),
  },
  {
    id: 'fraser',
    title: 'Artiga fraser',
    grades: [4, 6],
    pairs: [
      ['hej', 'hello'],
      ['hejdå', 'goodbye'],
      ['tack', 'thank you'],
      ['varsågod', "you're welcome"],
      ['förlåt', 'sorry'],
      ['ursäkta mig', 'excuse me'],
      ['god morgon', 'good morning'],
      ['god natt', 'good night'],
      ['Hur mår du?', 'How are you?'],
      ['Vad heter du?', "What's your name?"],
    ].map(([sv, en]) => ({ sv, en })),
  },
];

export const GLOS_MODES: LevelOption[] = [
  { value: 'sv-en', label: 'Svenska → engelska', hint: 'Välj det engelska ordet' },
  { value: 'en-sv', label: 'Engelska → svenska', hint: 'Välj det svenska ordet' },
  { value: 'stava', label: 'Stava på engelska', hint: 'Bygg ordet med bokstäver' },
];

/** Gemensam generator för färdiga och lärarens egna listor. */
export function glosQuestions(list: WordList, mode: string, count: number, rng?: Rng, pics?: Partial<Record<string, PicId>>): Question[] {
  const pairs = list.pairs.filter((p) => p.sv.trim() && p.en.trim());
  if (pairs.length === 0) return [];
  const others = (p: WordPair, key: 'sv' | 'en') => sample(pairs.filter((x) => x[key] !== p[key]).map((x) => x[key]), 3, rng);
  return fromBank(pairs, count, rng, (p) => {
    const pic = pics?.[p.sv];
    const visual = pic ? ({ t: 'pic', id: pic } as const) : undefined;
    // Stavning fungerar bara för ord utan mellanslag och skiljetecken.
    const spellable = /^[A-Za-z]+$/.test(p.en);
    if (mode === 'stava' && spellable) {
      return { kind: 'spell', prompt: `Hur stavas ”${p.sv}” på engelska?`, visual, answer: p.en.toLowerCase(), extra: Math.min(2, Math.floor(p.en.length / 3)) };
    }
    if (mode === 'en-sv') return { ...mc(`Vad betyder ”${p.en}”?`, p.sv, others(p, 'sv'), rng, { visual, explain: `${p.en} = ${p.sv}` }), cue: p.en };
    return { ...mc(`Vad heter ”${p.sv}” på engelska?`, p.en, others(p, 'en'), rng, { visual, explain: `${p.sv} = ${p.en}` }), cue: p.sv };
  });
}

const builtinActivities: Activity[] = BUILTIN_LISTS.map((list) => ({
  id: `en-${list.id}`,
  title: `Glosor: ${list.title}`,
  description: `${list.pairs.length} ord: ${list.pairs
    .slice(0, 4)
    .map((p) => p.en)
    .join(', ')} …`,
  subject: 'engelska',
  grades: list.grades,
  area: list.id === 'fraser' ? 'Kommunikationens innehåll' : 'Ord och fraser',
  levels: GLOS_MODES,
  defaultLevel: 'sv-en',
  generate: (mode = 'sv-en', count, rng) => glosQuestions(list, mode, count, rng, list.pics),
}));

/** Lärarens egna glosor. Ordlistan skickas med när uppdraget startas. */
export const OWN_WORDS: Activity = {
  id: 'en-egna-glosor',
  title: 'Egna glosor',
  description: 'Glosor som läraren har skrivit in för klassen.',
  subject: 'engelska',
  grades: [1, 6],
  area: 'Ord och fraser',
  levels: GLOS_MODES,
  defaultLevel: 'sv-en',
  needsWordList: true,
  generate: (mode = 'sv-en', count, rng, ctx) => (ctx?.wordList ? glosQuestions(ctx.wordList, mode, count, rng) : []),
};

export const ENGELSKA_ACTIVITIES: Activity[] = [...builtinActivities, OWN_WORDS];

/** Tolkar inklistrade glosor: en rad per par, "svenska – engelska" (eller tab, komma, =, :). */
export function parseWordList(text: string): WordPair[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.split(/\s*(?:\t|–|—| - |=|;|:|,)\s*/);
      return m.length >= 2 ? { sv: m[0].trim(), en: m.slice(1).join(' ').trim() } : null;
    })
    .filter((p): p is WordPair => !!p && !!p.sv && !!p.en);
}
