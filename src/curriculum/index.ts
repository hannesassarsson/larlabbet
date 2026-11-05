import { ENGELSKA_ACTIVITIES } from './engelska';
import { MATH_ACTIVITIES } from './matematik';
import { SO_ACTIVITIES } from './so';
import { SVENSKA_ACTIVITIES } from './svenska';
import type { Activity, Grade, SubjectId } from './types';

/** Fristående spel som också passar i kursplanen och kan ges som uppdrag. */
const GAME_ACTIVITIES: Activity[] = [
  {
    id: 'sv-bokstavsljud',
    title: 'Bokstavsjakten',
    description: 'Vilken bild börjar på bokstaven? Koppla ljud till bokstav.',
    subject: 'svenska',
    grades: [0, 1],
    area: 'Läsa och skriva',
    readAloud: true,
    game: 'bokstavsjakten',
    levels: [
      { value: 'latt', label: 'Lätt', hint: '3 bilder' },
      { value: 'mellan', label: 'Mellan', hint: '4 bilder' },
      { value: 'svar', label: 'Svår', hint: '6 bilder' },
    ],
    defaultLevel: 'latt',
    generate: () => [],
  },
  {
    id: 'ma-monster',
    title: 'Mönsterdetektiven',
    description: 'Mönster i former, färger och talföljder.',
    subject: 'matematik',
    grades: [0, 6],
    area: 'Algebra',
    game: 'monster',
    levels: [
      { value: 'latt', label: 'Lätt', hint: 'Färger och former' },
      { value: 'mellan', label: 'Mellan', hint: 'Längre mönster' },
      { value: 'svar', label: 'Svår', hint: 'Tal och vridning' },
    ],
    defaultLevel: 'latt',
    generate: () => [],
  },
];

export const ACTIVITIES: Activity[] = [
  ...MATH_ACTIVITIES,
  ...SVENSKA_ACTIVITIES,
  ...ENGELSKA_ACTIVITIES,
  ...SO_ACTIVITIES,
  ...GAME_ACTIVITIES,
];

const byId = new Map(ACTIVITIES.map((a) => [a.id, a]));
export const getActivity = (id: string) => byId.get(id);

export function activitiesFor(subject: SubjectId | 'alla', grade: Grade | 'alla'): Activity[] {
  return ACTIVITIES.filter(
    (a) => (subject === 'alla' || a.subject === subject) && (grade === 'alla' || (a.grades[0] <= grade && grade <= a.grades[1]))
  ).sort((x, y) => x.grades[0] - y.grades[0] || x.grades[1] - y.grades[1]);
}

export function levelLabel(a: Activity, level?: string) {
  const l = a.levels?.find((x) => x.value === (level ?? a.defaultLevel));
  return l ? l.label + (l.hint ? ` (${l.hint})` : '') : '';
}
