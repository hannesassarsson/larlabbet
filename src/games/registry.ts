export type CategoryId = 'bokstaver' | 'lasning' | 'matte' | 'logik' | 'kreativ' | 'quiz';

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  soft: string;
}

export const CATEGORIES: Category[] = [
  { id: 'bokstaver', name: 'Bokstäver och ord', color: '#FF8A5B', soft: '#FFE3D6' },
  { id: 'lasning', name: 'Läsning och stavning', color: '#A78BFA', soft: '#ECE5FF' },
  { id: 'matte', name: 'Matematik', color: '#5BC0EB', soft: '#D8F0FB' },
  { id: 'logik', name: 'Minne och logik', color: '#7BD389', soft: '#DCF5DF' },
  { id: 'kreativ', name: 'Kreativitet', color: '#F25F8C', soft: '#FFDCE7' },
  { id: 'quiz', name: 'Quiz och kunskap', color: '#FFC53D', soft: '#FFF1C9' },
];

export interface GameMeta {
  id: string;
  title: string;
  tagline: string;
  description: string;
  categories: CategoryId[];
  age: string;
  color: string;
  soft: string;
  howTo: string[];
  keywords: string[];
}

export const GAMES: GameMeta[] = [
  {
    id: 'memory',
    title: 'Memory',
    tagline: 'Hitta alla par!',
    description: 'Vänd två kort i taget och hitta bilderna som hör ihop.',
    categories: ['logik'],
    age: '4–10 år',
    color: '#7BD389',
    soft: '#DCF5DF',
    howTo: ['Tryck på ett kort för att vända det.', 'Vänd ett till. Är det samma bild? Då har du hittat ett par!', 'Hitta alla par för att vinna.'],
    keywords: ['minne', 'par', 'kort', 'bilder', 'djur'],
  },
  {
    id: 'bokstavsjakten',
    title: 'Bokstavsjakten',
    tagline: 'Vad börjar på B?',
    description: 'Titta på bokstaven och hitta bilden vars ord börjar på den.',
    categories: ['bokstaver'],
    age: '5–7 år',
    color: '#FF8A5B',
    soft: '#FFE3D6',
    howTo: ['Titta på den stora bokstaven.', 'Säg orden för bilderna högt.', 'Tryck på bilden som börjar på bokstaven.'],
    keywords: ['bokstäver', 'alfabetet', 'ljud', 'ord', 'första bokstaven'],
  },
  {
    id: 'stavning',
    title: 'Stavningsmästaren',
    tagline: 'Bygg ordet!',
    description: 'Lägg bokstäverna i rätt ordning så att ordet stämmer med bilden.',
    categories: ['lasning', 'bokstaver'],
    age: '6–10 år',
    color: '#A78BFA',
    soft: '#ECE5FF',
    howTo: ['Titta på bilden och tänk på ordet.', 'Tryck på bokstäverna i rätt ordning.', 'Fel bokstav? Tryck på den i ordet så hoppar den tillbaka.'],
    keywords: ['stava', 'stavning', 'läsa', 'ord', 'bokstäver'],
  },
  {
    id: 'matte',
    title: 'Matteäventyret',
    tagline: 'Plus och minus',
    description: 'Räkna plus och minus och välj rätt svar. Du bestämmer hur stora talen är.',
    categories: ['matte'],
    age: '5–10 år',
    color: '#5BC0EB',
    soft: '#D8F0FB',
    howTo: ['Läs uppgiften.', 'Räkna i huvudet eller med prickarna.', 'Tryck på rätt svar.'],
    keywords: ['matte', 'matematik', 'räkna', 'plus', 'minus', 'addition', 'subtraktion', 'tal'],
  },
  {
    id: 'monster',
    title: 'Mönsterdetektiven',
    tagline: 'Vad kommer sen?',
    description: 'Titta noga på mönstret och lista ut vad som kommer härnäst.',
    categories: ['logik', 'matte'],
    age: '5–10 år',
    color: '#2EC4B6',
    soft: '#D4F4F0',
    howTo: ['Titta på raden från vänster till höger.', 'Hitta mönstret – vad upprepas?', 'Tryck på det som ska stå vid frågetecknet.'],
    keywords: ['mönster', 'logik', 'former', 'färger', 'serier', 'sekvens'],
  },
  {
    id: 'santfalskt',
    title: 'Sant eller falskt',
    tagline: 'Vad tror du?',
    description: 'Är påståendet sant eller falskt? Lär dig roliga saker om djur, natur och världen.',
    categories: ['quiz'],
    age: '6–10 år',
    color: '#FFC53D',
    soft: '#FFF1C9',
    howTo: ['Läs påståendet (eller be en vuxen läsa).', 'Tryck på Sant eller Falskt.', 'Läs förklaringen och lär dig något nytt!'],
    keywords: ['quiz', 'frågor', 'kunskap', 'djur', 'natur', 'geografi', 'allmänbildning'],
  },
  {
    id: 'malarladan',
    title: 'Målarlådan',
    tagline: 'Rita fritt!',
    description: 'Rita och måla med fingret. Välj färger, penslar och stämplar.',
    categories: ['kreativ'],
    age: '3–10 år',
    color: '#F25F8C',
    soft: '#FFDCE7',
    howTo: ['Välj en färg.', 'Rita med fingret på papperet.', 'Spara bilden när du är klar.'],
    keywords: ['rita', 'måla', 'färg', 'kreativ', 'skapa', 'teckna'],
  },
];

/** När ett fristående spel körs som uppdrag: låst nivå och rapportering av resultatet. */
export interface GameAssignment {
  key: string;
  level?: string;
  onFinish: (score: number, max: number) => void;
}

export function getGame(id: string) {
  return GAMES.find((g) => g.id === id);
}

/** Söker i titel, beskrivning, kategori och nyckelord. Tål versaler och å/ä/ö. */
export function searchGames(query: string, category: CategoryId | 'alla', games: GameMeta[] = GAMES): GameMeta[] {
  const q = query.trim().toLocaleLowerCase('sv');
  return games.filter((g) => {
    if (category !== 'alla' && !g.categories.includes(category)) return false;
    if (!q) return true;
    const hay = [
      g.title,
      g.tagline,
      g.description,
      ...g.keywords,
      ...g.categories.map((c) => CATEGORIES.find((x) => x.id === c)?.name ?? ''),
    ]
      .join(' ')
      .toLocaleLowerCase('sv');
    return q.split(/\s+/).every((word) => hay.includes(word));
  });
}
