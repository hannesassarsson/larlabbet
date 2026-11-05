import type { PicId } from '../components/pictures';
import { pick, randInt, sample, shuffle, type Rng } from '../lib/random';
import { buildMathRound } from '../games/matte/logic';
import { mc, unique } from './build';
import type { Activity, ChoiceQuestion, ShapeName } from './types';

/* ---------- Hjälpare ---------- */

/** Tre felaktiga svar nära det rätta, aldrig negativa (om inte tillåtet). */
function near(answer: number, spread: number[], rng?: Rng, allowNegative = false, decimals = 0): string[] {
  const f = (v: number) => fmt(v, decimals);
  const out = new Set<string>();
  for (const d of shuffle(spread, rng)) {
    const v = round(answer + d, decimals);
    if (v === answer || (!allowNegative && v < 0)) continue;
    out.add(f(v));
    if (out.size === 3) break;
  }
  let k = 1;
  while (out.size < 3) {
    const v = round(answer + k * (10 ** -decimals) * (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 3, decimals);
    if (v !== answer && (allowNegative || v >= 0)) out.add(f(v));
    k++;
  }
  return [...out];
}
const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
/** Svensk decimalform med komma. */
export const fmt = (v: number, d = 0) => (d ? v.toFixed(d).replace(/\.?0+$/, '') : String(Math.round(v))).replace('.', ',').replace('-', '−');

const num = (prompt: string, answer: number, rng?: Rng, spread = [1, -1, 2, -2, 10, -10], extra: Parameters<typeof mc>[4] = {}) =>
  mc(prompt, String(answer), near(answer, spread, rng).map((x) => x), rng, extra);

const COUNT_PICS: PicId[] = ['äpple', 'boll', 'fisk', 'stjärna', 'blomma', 'ägg', 'kaka', 'ballong', 'sol', 'jordgubbe'];

const HOURS = ['tolv', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];
/** Analog tid uttryckt på svenska, t.ex. "halv fyra" eller "kvart i fem". */
export function clockWords(h: number, m: number): string {
  const H = HOURS[h % 12 === 0 ? 12 : h % 12];
  const next = HOURS[(h % 12) + 1];
  switch (m) {
    case 0:
      return `${H}`;
    case 5:
      return `fem över ${H}`;
    case 10:
      return `tio över ${H}`;
    case 15:
      return `kvart över ${H}`;
    case 20:
      return `tjugo över ${H}`;
    case 25:
      return `fem i halv ${next}`;
    case 30:
      return `halv ${next}`;
    case 35:
      return `fem över halv ${next}`;
    case 40:
      return `tjugo i ${next}`;
    case 45:
      return `kvart i ${next}`;
    case 50:
      return `tio i ${next}`;
    case 55:
      return `fem i ${next}`;
  }
  return `${h}.${String(m).padStart(2, '0')}`;
}

/* ---------- Aktiviteter ---------- */

const raknaAntal: Activity = {
  id: 'ma-rakna-antal',
  title: 'Räkna saker',
  description: 'Hur många ser du? Räkna och välj rätt tal.',
  subject: 'matematik',
  grades: [0, 1],
  area: 'Taluppfattning och tals användning',
  readAloud: true,
  levels: [
    { value: '5', label: 'Upp till 5' },
    { value: '10', label: 'Upp till 10' },
    { value: '20', label: 'Upp till 20' },
  ],
  defaultLevel: '10',
  generate: (level = '10', count, rng) =>
    unique(count, () => {
      const max = Number(level);
      const n = randInt(1, max, rng);
      const id = pick(COUNT_PICS, rng);
      return num('Hur många är det?', n, rng, [1, -1, 2, -2, 3], { visual: { t: 'count', id, n } });
    }),
};

const jamfor: Activity = {
  id: 'ma-jamfor',
  title: 'Störst och minst',
  description: 'Vilket tal är störst – och vilket är minst?',
  subject: 'matematik',
  grades: [0, 2],
  area: 'Taluppfattning och tals användning',
  readAloud: true,
  levels: [
    { value: '10', label: 'Upp till 10' },
    { value: '20', label: 'Upp till 20' },
    { value: '100', label: 'Upp till 100' },
  ],
  defaultLevel: '10',
  generate: (level = '10', count, rng) =>
    unique(count, () => {
      const nums = sample(
        Array.from({ length: Number(level) + 1 }, (_, i) => i),
        3,
        rng
      );
      const biggest = rng ? rng() < 0.5 : Math.random() < 0.5;
      const ans = biggest ? Math.max(...nums) : Math.min(...nums);
      return mc(
        biggest ? 'Vilket tal är störst?' : 'Vilket tal är minst?',
        String(ans),
        nums.filter((n) => n !== ans).map(String),
        rng
      );
    }),
};

const talraden: Activity = {
  id: 'ma-talraden',
  title: 'Talraden',
  description: 'Vilket tal fattas i raden?',
  subject: 'matematik',
  grades: [0, 3],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: 'ett-10', label: 'Ett i taget', hint: 'Upp till 10' },
    { value: 'ett-20', label: 'Ett i taget', hint: 'Upp till 20' },
    { value: 'hopp', label: 'Hoppa', hint: 'Två, fem eller tio i taget' },
    { value: 'bak', label: 'Baklänges', hint: 'Räkna nedåt' },
  ],
  defaultLevel: 'ett-10',
  generate: (level = 'ett-10', count, rng) =>
    unique(count, () => {
      const step = level === 'hopp' ? pick([2, 5, 10], rng) : level === 'bak' ? -1 : 1;
      const max = level === 'ett-10' ? 10 : level === 'ett-20' ? 20 : 100;
      const len = 5;
      const start = step > 0 ? randInt(0, Math.max(0, max - step * (len - 1)), rng) : randInt(len, 20, rng);
      const seq = Array.from({ length: len }, (_, i) => start + step * i);
      const hole = randInt(1, len - 2, rng);
      const ans = seq[hole];
      const shown = seq.map((v, i) => (i === hole ? '__' : String(v))).join(',  ');
      return mc('Vilket tal fattas?', String(ans), near(ans, [step, -step, 1, -1, 2 * step], rng), rng, { detail: shown });
    }),
};

const plusMinus: Activity = {
  id: 'ma-plus-minus',
  title: 'Plus och minus',
  description: 'Räkna addition och subtraktion i ditt talområde.',
  subject: 'matematik',
  grades: [0, 3],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: 'plus-5', label: 'Plus upp till 5' },
    { value: 'plus-10', label: 'Plus upp till 10' },
    { value: 'minus-10', label: 'Minus upp till 10' },
    { value: 'blandat-20', label: 'Blandat upp till 20' },
    { value: 'blandat-100', label: 'Blandat upp till 100' },
  ],
  defaultLevel: 'plus-10',
  generate: (level = 'plus-10', count, rng) => {
    const [op, max] = level.split('-');
    const tasks = [];
    while (tasks.length < count) tasks.push(...buildMathRound({ op: op as 'plus', max: Number(max) }, rng));
    return tasks.slice(0, count).map(
      (t): ChoiceQuestion => ({
        kind: 'choice',
        prompt: `${t.a} ${t.op} ${t.b} = ?`,
        options: t.options.map((o) => ({ label: String(o) })),
        answer: t.options.indexOf(t.answer),
      })
    );
  },
};

const tiokompisar: Activity = {
  id: 'ma-tiokompisar',
  title: 'Tiokompisar',
  description: 'Vilka tal blir tio tillsammans?',
  subject: 'matematik',
  grades: [1, 2],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: '10', label: 'Kompisar till 10' },
    { value: '20', label: 'Kompisar till 20' },
    { value: '100', label: 'Hundrakompisar', hint: 'Tiotal till 100' },
  ],
  defaultLevel: '10',
  generate: (level = '10', count, rng) =>
    unique(count, () => {
      const total = Number(level);
      const a = total === 100 ? randInt(1, 9, rng) * 10 : randInt(1, total - 1, rng);
      const ans = total - a;
      return num(`${a} + __ = ${total}`, ans, rng, total === 100 ? [10, -10, 20, 1] : [1, -1, 2, -2]);
    }),
};

const dubbeltHalften: Activity = {
  id: 'ma-dubbelt-halften',
  title: 'Dubbelt och hälften',
  description: 'Dubbla talet eller ta hälften.',
  subject: 'matematik',
  grades: [1, 3],
  area: 'Samband och förändring',
  levels: [
    { value: 'dubbelt', label: 'Dubbelt' },
    { value: 'halften', label: 'Hälften' },
    { value: 'blandat', label: 'Blandat' },
  ],
  defaultLevel: 'blandat',
  generate: (level = 'blandat', count, rng) =>
    unique(count, () => {
      const mode = level === 'blandat' ? pick(['dubbelt', 'halften'], rng) : level;
      if (mode === 'dubbelt') {
        const n = randInt(1, 25, rng);
        return num(`Vad är dubbelt så mycket som ${n}?`, n * 2, rng, [1, -1, 2, -2, n, -n + 1]);
      }
      const n = randInt(1, 25, rng) * 2;
      return num(`Vad är hälften av ${n}?`, n / 2, rng, [1, -1, 2, -2, n / 2]);
    }),
};

const tiotalEntral: Activity = {
  id: 'ma-tiotal-ental',
  title: 'Tiotal och ental',
  description: 'Hur många tiotal och ental har talet?',
  subject: 'matematik',
  grades: [1, 3],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: 'bild', label: 'Räkna klossar' },
    { value: 'siffra', label: 'Positionssystemet' },
  ],
  defaultLevel: 'bild',
  generate: (level = 'bild', count, rng) =>
    unique(count, () => {
      const tens = randInt(1, 9, rng);
      const ones = randInt(0, 9, rng);
      const n = tens * 10 + ones;
      if (level === 'bild') return num('Vilket tal visar klossarna?', n, rng, [1, -1, 10, -10, 9 * (ones - tens)], { visual: { t: 'base10', tens, ones } });
      if (rng ? rng() < 0.5 : Math.random() < 0.5) return num(`Hur många tiotal finns i ${n}?`, tens, rng, [1, -1, ones - tens, 2]);
      const h = randInt(1, 9, rng);
      const big = h * 100 + n;
      return num(`Vilken siffra står för hundratalen i ${big}?`, h, rng, [tens - h, ones - h, 1, -1]);
    }),
};

const klockan: Activity = {
  id: 'ma-klockan',
  title: 'Klockan',
  description: 'Vad är klockan? Läs av den analoga klockan.',
  subject: 'matematik',
  grades: [1, 3],
  area: 'Geometri',
  levels: [
    { value: 'hel-halv', label: 'Hel och halv' },
    { value: 'kvart', label: 'Kvart över och kvart i' },
    { value: 'fem', label: 'Fem minuter', hint: 'Fem över, tio i …' },
  ],
  defaultLevel: 'hel-halv',
  generate: (level = 'hel-halv', count, rng) =>
    unique(count, () => {
      const mins = level === 'hel-halv' ? [0, 30] : level === 'kvart' ? [0, 15, 30, 45] : [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      const h = randInt(1, 12, rng);
      const m = pick(mins, rng);
      const right = clockWords(h, m);
      const wrong = [
        clockWords(h % 12 + 1, m),
        clockWords(h === 1 ? 12 : h - 1, m),
        clockWords(h, pick(mins.filter((x) => x !== m), rng) ?? (m + 30) % 60),
        clockWords(h, (m + 30) % 60),
      ];
      return mc('Vad är klockan?', right, wrong, rng, { visual: { t: 'clock', h, m } });
    }),
};

const FORMER_2D: ShapeName[] = ['cirkel', 'kvadrat', 'rektangel', 'triangel'];
const FORMER_3D: ShapeName[] = ['klot', 'kub', 'cylinder', 'kon', 'rätblock'];
const former: Activity = {
  id: 'ma-former',
  title: 'Former',
  description: 'Känn igen cirkel, kvadrat, klot, kub och fler former.',
  subject: 'matematik',
  grades: [0, 3],
  area: 'Geometri',
  readAloud: true,
  levels: [
    { value: '2d', label: 'Platta former', hint: 'Cirkel, kvadrat …' },
    { value: '3d', label: 'Kroppar', hint: 'Klot, kub, kon …' },
  ],
  defaultLevel: '2d',
  generate: (level = '2d', count, rng) =>
    unique(count, () => {
      const pool = level === '3d' ? FORMER_3D : FORMER_2D;
      const name = pick(pool, rng);
      if (rng ? rng() < 0.5 : Math.random() < 0.5) {
        return mc(
          `Vilken av dem är en ${name}?`,
          { label: name, visual: { t: 'shape', name }, hideLabel: true },
          pool.filter((p) => p !== name).map((p) => ({ label: p, visual: { t: 'shape', name: p } as const, hideLabel: true })),
          rng
        );
      }
      return mc('Vad heter formen?', name, pool.filter((p) => p !== name), rng, { visual: { t: 'shape', name } });
    }),
};

const BRAK: [number, number, string][] = [
  [1, 2, 'en halv'],
  [1, 3, 'en tredjedel'],
  [1, 4, 'en fjärdedel'],
  [2, 3, 'två tredjedelar'],
  [3, 4, 'tre fjärdedelar'],
  [1, 5, 'en femtedel'],
  [2, 5, 'två femtedelar'],
  [1, 6, 'en sjättedel'],
];
const brak: Activity = {
  id: 'ma-brak',
  title: 'Bråk',
  description: 'Hur stor del är färgad? Halv, tredjedel, fjärdedel …',
  subject: 'matematik',
  grades: [2, 5],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: 'ord', label: 'Med ord', hint: 'en halv, en fjärdedel' },
    { value: 'siffror', label: 'Med siffror', hint: '1/2, 3/4' },
  ],
  defaultLevel: 'ord',
  generate: (level = 'ord', count, rng) => {
    const pool = level === 'ord' ? BRAK.slice(0, 5) : BRAK;
    return unique(count, () => {
      const [n, d, word] = pick(pool, rng);
      const label = (x: [number, number, string]) => (level === 'ord' ? x[2] : `${x[0]}/${x[1]}`);
      return mc('Hur stor del är färgad?', label([n, d, word]), pool.filter((x) => x[2] !== word).map(label), rng, { visual: { t: 'fraction', num: n, den: d } });
    });
  },
};

const likhet: Activity = {
  id: 'ma-likhet',
  title: 'Likhetstecknet',
  description: 'Båda sidor ska vara lika mycket. Vilket tal fattas?',
  subject: 'matematik',
  grades: [1, 4],
  area: 'Algebra',
  levels: [
    { value: 'latt', label: 'Inom 10' },
    { value: 'mellan', label: 'Inom 20' },
    { value: 'svar', label: 'Inom 100' },
  ],
  defaultLevel: 'latt',
  generate: (level = 'latt', count, rng) =>
    unique(count, () => {
      const max = level === 'latt' ? 10 : level === 'mellan' ? 20 : 100;
      const sum = randInt(4, max, rng);
      const a = randInt(1, sum - 1, rng);
      const c = randInt(1, sum - 1, rng);
      const ans = sum - c;
      if (a === c) return num(`${a} + ${sum - a} = __ + ${c}`, ans, rng, [1, -1, 2, c]);
      return num(`${a} + ${sum - a} = ${c} + __`, ans, rng, [1, -1, 2, -2, c - ans]);
    }),
};

const TABELLER: Record<string, number[]> = {
  '2-5-10': [2, 5, 10],
  '3-4': [3, 4],
  '6-9': [6, 7, 8, 9],
  alla: [2, 3, 4, 5, 6, 7, 8, 9, 10],
};
const gangertabell: Activity = {
  id: 'ma-multiplikation',
  title: 'Gångertabellen',
  description: 'Multiplikation och division med tabellerna 1–10.',
  subject: 'matematik',
  grades: [2, 6],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: '2-5-10', label: '2, 5 och 10' },
    { value: '3-4', label: '3 och 4' },
    { value: '6-9', label: '6 till 9' },
    { value: 'alla', label: 'Alla tabeller' },
    { value: 'division', label: 'Division', hint: 'Alla tabeller' },
  ],
  defaultLevel: '2-5-10',
  generate: (level = '2-5-10', count, rng) =>
    unique(count, () => {
      const t = pick(TABELLER[level] ?? TABELLER.alla, rng);
      const k = randInt(1, 10, rng);
      if (level === 'division') return num(`${t * k} / ${t} = ?`, k, rng, [1, -1, 2, -2]);
      const ans = t * k;
      return num(`${k} · ${t} = ?`, ans, rng, [t, -t, 1, -1, 10, 2 * t]);
    }),
};

const ENHETER: { q: string; a: string; w: string[] }[] = [
  { q: 'Hur långt är en penna? Vilken enhet passar?', a: 'centimeter (cm)', w: ['kilometer (km)', 'kilogram (kg)', 'liter (l)'] },
  { q: 'Hur långt är det till nästa stad? Vilken enhet passar?', a: 'kilometer (km)', w: ['centimeter (cm)', 'gram (g)', 'deciliter (dl)'] },
  { q: 'Hur mycket väger en vuxen människa? Vilken enhet passar?', a: 'kilogram (kg)', w: ['gram (g)', 'meter (m)', 'liter (l)'] },
  { q: 'Hur mycket väger ett russin? Vilken enhet passar?', a: 'gram (g)', w: ['kilogram (kg)', 'meter (m)', 'liter (l)'] },
  { q: 'Hur mycket vatten får plats i en hink? Vilken enhet passar?', a: 'liter (l)', w: ['gram (g)', 'meter (m)', 'kilometer (km)'] },
  { q: 'Hur mycket mjölk ska det vara i pannkakssmeten? Vilken enhet passar?', a: 'deciliter (dl)', w: ['kilometer (km)', 'kilogram (kg)', 'centimeter (cm)'] },
  { q: 'Hur långt är ett klassrum? Vilken enhet passar?', a: 'meter (m)', w: ['gram (g)', 'deciliter (dl)', 'kilometer (km)'] },
  { q: 'Hur lång tid tar det att borsta tänderna?', a: 'några minuter', w: ['några sekunder', 'några timmar', 'några dagar'] },
];
const OMVANDLA: { q: string; a: number; spread: number[] }[] = [
  { q: '1 meter = __ centimeter', a: 100, spread: [-90, 900, -50, 900] },
  { q: '1 kilometer = __ meter', a: 1000, spread: [-900, -990, 9000] },
  { q: '1 kilogram = __ gram', a: 1000, spread: [-900, -990, 9000] },
  { q: '1 liter = __ deciliter', a: 10, spread: [90, -9, 990] },
  { q: '3 meter = __ centimeter', a: 300, spread: [-270, 2700, -297] },
  { q: '2 liter = __ deciliter', a: 20, spread: [180, -18, 1980] },
  { q: '5 kilogram = __ gram', a: 5000, spread: [-4500, -4950, 45000] },
  { q: '1 timme = __ minuter', a: 60, spread: [40, -36, 40] },
  { q: '2 timmar = __ minuter', a: 120, spread: [-20, -100, 80] },
  { q: '1 minut = __ sekunder', a: 60, spread: [40, -50, -40] },
  { q: '500 meter = __ kilometer', a: 0.5, spread: [4.5, 49.5, 0.5] },
];
const matenheter: Activity = {
  id: 'ma-enheter',
  title: 'Mäta och enheter',
  description: 'Vilken enhet passar – och hur många centimeter är en meter?',
  subject: 'matematik',
  grades: [2, 6],
  area: 'Geometri',
  levels: [
    { value: 'valj', label: 'Välj enhet' },
    { value: 'omvandla', label: 'Byt enhet', hint: 'm, cm, kg, dl, minuter' },
  ],
  defaultLevel: 'valj',
  generate: (level = 'valj', count, rng) =>
    level === 'valj'
      ? unique(count, () => {
          const e = pick(ENHETER, rng);
          return mc(e.q, e.a, e.w, rng);
        })
      : unique(count, () => {
          const e = pick(OMVANDLA, rng);
          return mc(e.q, fmt(e.a, 1), e.spread.map((d) => fmt(e.a + d, 1)), rng);
        }),
};

const avrundning: Activity = {
  id: 'ma-avrundning',
  title: 'Avrunda',
  description: 'Avrunda till närmaste tiotal eller hundratal.',
  subject: 'matematik',
  grades: [3, 5],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: '10', label: 'Till tiotal' },
    { value: '100', label: 'Till hundratal' },
  ],
  defaultLevel: '10',
  generate: (level = '10', count, rng) =>
    unique(count, () => {
      const to = Number(level);
      const n = to === 10 ? randInt(11, 99, rng) : randInt(101, 999, rng);
      if (n % to === 0) return num(`Avrunda ${n + 1} till närmaste ${to === 10 ? 'tiotal' : 'hundratal'}`, Math.round((n + 1) / to) * to, rng, [to, -to]);
      const ans = Math.round(n / to) * to;
      const lower = Math.floor(n / to) * to;
      const upper = lower + to;
      return mc(`Avrunda ${n} till närmaste ${to === 10 ? 'tiotal' : 'hundratal'}`, String(ans), [String(lower === ans ? upper : lower), String(ans + to), String(n)], rng);
    }),
};

const decimaltal: Activity = {
  id: 'ma-decimaltal',
  title: 'Decimaltal',
  description: 'Jämför och räkna med tal som 0,5 och 2,75.',
  subject: 'matematik',
  grades: [4, 6],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: 'jamfor', label: 'Vilket är störst?' },
    { value: 'rakna', label: 'Plus och minus' },
    { value: 'gange10', label: 'Gånger och delat med 10' },
  ],
  defaultLevel: 'jamfor',
  generate: (level = 'jamfor', count, rng) =>
    unique(count, () => {
      if (level === 'jamfor') {
        const base = randInt(0, 9, rng);
        const vals = [base + randInt(1, 9, rng) / 10, base + randInt(1, 99, rng) / 100, base + randInt(1, 9, rng) / 100];
        const uniq = [...new Set(vals.map((v) => round(v, 2)))];
        if (uniq.length < 3) uniq.push(base + 0.05, base + 0.5);
        const three = uniq.slice(0, 3);
        const max = Math.max(...three);
        return mc('Vilket tal är störst?', fmt(max, 2), three.filter((v) => v !== max).map((v) => fmt(v, 2)), rng);
      }
      if (level === 'rakna') {
        const a = randInt(1, 50, rng) / 10;
        const b = randInt(1, 50, rng) / 10;
        const plus = rng ? rng() < 0.6 : Math.random() < 0.6;
        const [x, y] = plus ? [a, b] : [Math.max(a, b), Math.min(a, b)];
        const ans = round(plus ? x + y : x - y, 1);
        return mc(`${fmt(x, 1)} ${plus ? '+' : '−'} ${fmt(y, 1)} = ?`, fmt(ans, 1), near(ans, [0.1, -0.1, 1, -1, 0.2], rng, false, 1), rng);
      }
      const a = randInt(1, 999, rng) / 10;
      const times = rng ? rng() < 0.5 : Math.random() < 0.5;
      const ans = round(times ? a * 10 : a / 10, 3);
      return mc(`${fmt(a, 1)} ${times ? '·' : '/'} 10 = ?`, fmt(ans, 3), [fmt(round(times ? a / 10 : a * 10, 3), 3), fmt(round(ans * 100, 3), 3), fmt(round(a + 10, 1), 1)], rng);
    }),
};

const negativa: Activity = {
  id: 'ma-negativa',
  title: 'Minusgrader',
  description: 'Läs av termometern och räkna med negativa tal.',
  subject: 'matematik',
  grades: [4, 6],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: 'termometer', label: 'Läs termometern' },
    { value: 'andring', label: 'Kallare och varmare' },
  ],
  defaultLevel: 'termometer',
  generate: (level = 'termometer', count, rng) =>
    unique(count, () => {
      if (level === 'termometer') {
        const v = randInt(-10, 10, rng);
        return mc('Hur många grader visar termometern?', `${fmt(v)} °C`, [v, -v, v + 2, v - 2, v + 1].filter((x) => x !== v).map((x) => `${fmt(x)} °C`), rng, { visual: { t: 'thermo', value: v } });
      }
      const start = randInt(-8, 8, rng);
      const d = randInt(2, 10, rng) * (rng ? (rng() < 0.5 ? 1 : -1) : Math.random() < 0.5 ? 1 : -1);
      const ans = start + d;
      return mc(
        `Det är ${fmt(start)} °C. Det blir ${Math.abs(d)} grader ${d > 0 ? 'varmare' : 'kallare'}. Hur varmt är det då?`,
        `${fmt(ans)} °C`,
        [start - d, -ans, ans + 1, ans - 2].filter((x) => x !== ans).map((x) => `${fmt(x)} °C`),
        rng
      );
    }),
};

const PROCENT: { q: string; a: string; w: string[] }[] = [
  { q: '50 % är samma som …', a: 'hälften', w: ['en fjärdedel', 'en tiondel', 'allt'] },
  { q: '25 % är samma som …', a: 'en fjärdedel', w: ['hälften', 'en tredjedel', 'en femtedel'] },
  { q: '10 % är samma som …', a: 'en tiondel', w: ['hälften', 'en fjärdedel', 'tio hela'] },
  { q: '100 % är samma som …', a: 'allt', w: ['hälften', 'ingenting', 'en hundradel'] },
  { q: '75 % är samma som …', a: 'tre fjärdedelar', w: ['en fjärdedel', 'hälften', 'sju femtedelar'] },
  { q: '1/2 skrivet i procent är …', a: '50 %', w: ['12 %', '20 %', '2 %'] },
  { q: '0,25 skrivet i procent är …', a: '25 %', w: ['2,5 %', '0,25 %', '250 %'] },
];
const procent: Activity = {
  id: 'ma-procent',
  title: 'Procent',
  description: 'Procent, bråk och decimaltal – och hur mycket är 25 % av 80?',
  subject: 'matematik',
  grades: [5, 6],
  area: 'Taluppfattning och tals användning',
  levels: [
    { value: 'samband', label: 'Procent och bråk' },
    { value: 'rakna', label: 'Räkna procent', hint: '10 %, 25 %, 50 %' },
  ],
  defaultLevel: 'samband',
  generate: (level = 'samband', count, rng) =>
    level === 'samband'
      ? unique(count, () => {
          const p = pick(PROCENT, rng);
          return mc(p.q, p.a, p.w, rng);
        })
      : unique(count, () => {
          const p = pick([10, 25, 50], rng);
          const whole = (p === 25 ? randInt(1, 20, rng) * 4 : p === 50 ? randInt(1, 50, rng) * 2 : randInt(1, 30, rng) * 10);
          const ans = (whole * p) / 100;
          return num(`Hur mycket är ${p} % av ${whole}?`, ans, rng, [ans, -ans / 2, 10, 5, -5].map((d) => Math.round(d)));
        }),
};

const prioritering: Activity = {
  id: 'ma-prioritering',
  title: 'Räkneordning',
  description: 'Gånger och delat med räknas först – sedan plus och minus.',
  subject: 'matematik',
  grades: [4, 6],
  area: 'Taluppfattning och tals användning',
  generate: (_level, count, rng) =>
    unique(count, () => {
      const a = randInt(1, 10, rng);
      const b = randInt(2, 6, rng);
      const c = randInt(2, 6, rng);
      const kind = randInt(0, 2, rng);
      if (kind === 0) return mc(`${a} + ${b} · ${c} = ?`, String(a + b * c), [String((a + b) * c), String(a + b + c), String(a * b + c)], rng, { explain: `Först ${b} · ${c} = ${b * c}, sedan ${a} + ${b * c}.` });
      if (kind === 1) return mc(`${a * 0 + b * c + a} − ${b} · ${c} = ?`, String(a), [String((b * c + a - b) * c), String(b * c + a - b - c), String(a + c)], rng, { explain: `Först ${b} · ${c} = ${b * c}, sedan ${b * c + a} − ${b * c}.` });
      return mc(`(${a} + ${b}) · ${c} = ?`, String((a + b) * c), [String(a + b * c), String(a * c + b), String(a + b + c)], rng, { explain: 'Det som står inom parentes räknas först.' });
    }),
};

const ekvation: Activity = {
  id: 'ma-ekvationer',
  title: 'Ekvationer',
  description: 'Vilket tal är x? Lös enkla ekvationer.',
  subject: 'matematik',
  grades: [4, 6],
  area: 'Algebra',
  levels: [
    { value: 'plus', label: 'x + 7 = 15' },
    { value: 'gange', label: '3x = 12' },
    { value: 'blandat', label: 'Blandat' },
  ],
  defaultLevel: 'plus',
  generate: (level = 'plus', count, rng) =>
    unique(count, () => {
      const kind = level === 'blandat' ? pick(['plus', 'minus', 'gange'], rng) : level === 'plus' ? pick(['plus', 'minus'], rng) : 'gange';
      const x = randInt(1, 20, rng);
      if (kind === 'plus') {
        const a = randInt(1, 30, rng);
        return num(`x + ${a} = ${x + a}`, x, rng, [a, 1, -1, 2 * a].map((d) => d), { detail: 'Vad är x?' });
      }
      if (kind === 'minus') {
        const a = randInt(1, x, rng);
        return num(`x − ${a} = ${x - a}`, x, rng, [-2 * a, 1, -1, 2], { detail: 'Vad är x?' });
      }
      const k = randInt(2, 9, rng);
      const xx = randInt(1, 10, rng);
      return num(`${k}x = ${k * xx}`, xx, rng, [k * xx - xx, 1, -1, k], { detail: 'Vad är x?' });
    }),
};

const omkretsArea: Activity = {
  id: 'ma-omkrets-area',
  title: 'Omkrets och area',
  description: 'Räkna omkrets och area på rektanglar.',
  subject: 'matematik',
  grades: [4, 6],
  area: 'Geometri',
  levels: [
    { value: 'omkrets', label: 'Omkrets' },
    { value: 'area', label: 'Area' },
    { value: 'blandat', label: 'Blandat' },
  ],
  defaultLevel: 'blandat',
  generate: (level = 'blandat', count, rng) =>
    unique(count, () => {
      const w = randInt(2, 9, rng);
      const h = randInt(2, 7, rng);
      const kind = level === 'blandat' ? pick(['omkrets', 'area'], rng) : level;
      const o = 2 * (w + h);
      const a = w * h;
      if (kind === 'omkrets') return mc('Vad är rektangelns omkrets?', `${o} cm`, [`${a} cm`, `${w + h} cm`, `${o + 2} cm`, `${o - 2} cm`], rng, { visual: { t: 'rect', w, h }, explain: `${w} + ${h} + ${w} + ${h} = ${o} cm` });
      return mc('Vad är rektangelns area?', `${a} cm²`, [`${o} cm²`, `${a + w} cm²`, `${w + h} cm²`, `${a - h} cm²`], rng, { visual: { t: 'rect', w, h }, explain: `${w} · ${h} = ${a} cm²` });
    }),
};

const vinklar: Activity = {
  id: 'ma-vinklar',
  title: 'Vinklar',
  description: 'Är vinkeln spetsig, rät eller trubbig?',
  subject: 'matematik',
  grades: [4, 6],
  area: 'Geometri',
  generate: (_l, count, rng) =>
    unique(count, () => {
      const kind = pick(['spetsig', 'rät', 'trubbig'], rng);
      const deg = kind === 'spetsig' ? randInt(2, 8, rng) * 10 : kind === 'rät' ? 90 : randInt(10, 17, rng) * 10;
      return mc('Vilken sorts vinkel är det?', `${kind} vinkel`, ['spetsig vinkel', 'rät vinkel', 'trubbig vinkel'].filter((x) => x !== `${kind} vinkel`), rng, {
        visual: { t: 'angle', deg },
        explain: kind === 'spetsig' ? 'Mindre än 90 grader är en spetsig vinkel.' : kind === 'rät' ? 'Precis 90 grader är en rät vinkel.' : 'Mellan 90 och 180 grader är en trubbig vinkel.',
      });
    }),
};

const lagesmatt: Activity = {
  id: 'ma-lagesmatt',
  title: 'Medelvärde, median, typvärde',
  description: 'Räkna ut medelvärde, median och typvärde i små talserier.',
  subject: 'matematik',
  grades: [5, 6],
  area: 'Sannolikhet och statistik',
  levels: [
    { value: 'typvarde', label: 'Typvärde' },
    { value: 'median', label: 'Median' },
    { value: 'medelvarde', label: 'Medelvärde' },
    { value: 'blandat', label: 'Blandat' },
  ],
  defaultLevel: 'blandat',
  generate: (level = 'blandat', count, rng) =>
    unique(count, () => {
      const kind = level === 'blandat' ? pick(['typvarde', 'median', 'medelvarde'], rng) : level;
      if (kind === 'typvarde') {
        const mode = randInt(1, 9, rng);
        const others = sample([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== mode), 3, rng);
        const list = shuffle([mode, mode, mode, ...others], rng);
        return mc('Vilket är typvärdet?', String(mode), others.map(String), rng, { detail: list.join(',  '), explain: 'Typvärdet är det tal som finns flest gånger.' });
      }
      if (kind === 'median') {
        const list = sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 5, rng);
        const sorted = [...list].sort((a, b) => a - b);
        const med = sorted[2];
        return mc('Vilket är medianen?', String(med), [String(list[2]), String(sorted[1]), String(sorted[3])], rng, { detail: list.join(',  '), explain: `I storleksordning: ${sorted.join(', ')}. Talet i mitten är ${med}.` });
      }
      const n = 4;
      const mean = randInt(3, 12, rng);
      const devs = [randInt(-3, 3, rng), randInt(-3, 3, rng), randInt(-3, 3, rng)];
      const list = [...devs.map((d) => mean + d), mean - devs.reduce((a, b) => a + b, 0)];
      if (list.some((v) => v < 0)) return mc('Vilket är medelvärdet?', '5', ['4', '6', '20'], rng, { detail: '2,  4,  6,  8', explain: '(2 + 4 + 6 + 8) / 4 = 5' });
      return mc('Vilket är medelvärdet?', String(mean), [String(mean + 1), String(mean - 1), String(mean * n)], rng, { detail: list.join(',  '), explain: `Summan är ${mean * n}. ${mean * n} delat med ${n} är ${mean}.` });
    }),
};

const koordinater: Activity = {
  id: 'ma-koordinater',
  title: 'Koordinatsystem',
  description: 'Vilka koordinater har punkten?',
  subject: 'matematik',
  grades: [5, 6],
  area: 'Samband och förändring',
  generate: (_l, count, rng) =>
    unique(count, () => {
      const x = randInt(0, 6, rng);
      const y = randInt(0, 6, rng);
      return mc('Vilka koordinater har punkten?', `(${x}, ${y})`, [`(${y}, ${x})`, `(${x + 1}, ${y})`, `(${x}, ${y + 1})`, `(${Math.max(0, x - 1)}, ${Math.max(0, y - 1)})`], rng, {
        visual: { t: 'coord', x, y },
        explain: 'Först x – hur långt åt höger. Sedan y – hur högt upp.',
      });
    }),
};

const sannolikhet: Activity = {
  id: 'ma-sannolikhet',
  title: 'Chans och risk',
  description: 'Vilken färg är det störst chans att få?',
  subject: 'matematik',
  grades: [3, 6],
  area: 'Sannolikhet och statistik',
  generate: (_l, count, rng) =>
    unique(count, () => {
      const palette = [
        { color: '#EF4B4B', name: 'röd' },
        { color: '#5BC0EB', name: 'blå' },
        { color: '#7BD389', name: 'grön' },
        { color: '#FFC53D', name: 'gul' },
      ];
      const chosen = sample(palette, 3, rng);
      const counts = shuffle([randInt(5, 7, rng), randInt(2, 4, rng), 1], rng);
      const most = counts.indexOf(Math.max(...counts));
      const least = counts.indexOf(Math.min(...counts));
      const askMost = rng ? rng() < 0.6 : Math.random() < 0.6;
      const idx = askMost ? most : least;
      return mc(
        askMost ? 'Du tar en kula utan att titta. Vilken färg är det störst chans att få?' : 'Du tar en kula utan att titta. Vilken färg är det minst chans att få?',
        chosen[idx].name,
        chosen.filter((_, i) => i !== idx).map((c) => c.name),
        rng,
        { visual: { t: 'marbles', colors: chosen.map((c, i) => ({ color: c.color, n: counts[i] })) } }
      );
    }),
};

const NAMN = ['Alva', 'Noah', 'Elsa', 'Liam', 'Maja', 'Hugo', 'Saga', 'Omar', 'Ella', 'William', 'Nora', 'Ali'];
const SAKER = ['kulor', 'kakor', 'pennor', 'äpplen', 'kort', 'stenar', 'klistermärken'];
const problemlosning: Activity = {
  id: 'ma-problemlosning',
  title: 'Lästal',
  description: 'Korta räknehistorier från vardagen.',
  subject: 'matematik',
  grades: [1, 6],
  area: 'Problemlösning',
  levels: [
    { value: 'latt', label: 'Lätt', hint: 'Plus och minus inom 20' },
    { value: 'mellan', label: 'Mellan', hint: 'Pengar och gånger' },
    { value: 'svar', label: 'Svår', hint: 'Dela lika och tid' },
  ],
  defaultLevel: 'latt',
  generate: (level = 'latt', count, rng) =>
    unique(count, () => {
      const n = pick(NAMN, rng);
      const sak = pick(SAKER, rng);
      const kinds = level === 'latt' ? ['plus', 'minus'] : level === 'mellan' ? ['pengar', 'gange', 'minus100'] : ['dela', 'tid', 'gange'];
      const kind = pick(kinds, rng);
      if (kind === 'plus') {
        const a = randInt(2, 10, rng);
        const b = randInt(1, 9, rng);
        return num(`${n} har ${a} ${sak}. ${n} får ${b} till. Hur många ${sak} har ${n} nu?`, a + b, rng, [1, -1, 2, -b - b]);
      }
      if (kind === 'minus') {
        const a = randInt(6, 20, rng);
        const b = randInt(1, a - 1, rng);
        return num(`${n} har ${a} ${sak} och ger bort ${b}. Hur många är kvar?`, a - b, rng, [1, -1, 2, b + b]);
      }
      if (kind === 'minus100') {
        const a = randInt(30, 99, rng);
        const b = randInt(11, a - 5, rng);
        return num(`I en burk finns ${a} ${sak}. ${n} tar ${b}. Hur många ${sak} finns kvar i burken?`, a - b, rng, [10, -10, 1, -1]);
      }
      if (kind === 'pengar') {
        const a = randInt(5, 25, rng);
        const b = randInt(5, 25, rng);
        return mc(`En glass kostar ${a} kr och en bulle kostar ${b} kr. Vad kostar båda tillsammans?`, `${a + b} kr`, [`${a + b + 10} kr`, `${a + b - 1} kr`, `${Math.abs(a - b)} kr`, `${a + b + 1} kr`], rng);
      }
      if (kind === 'gange') {
        const a = randInt(2, 9, rng);
        const b = randInt(2, 6, rng);
        return num(`${n} köper ${a} påsar. Det är ${b} ${sak} i varje påse. Hur många ${sak} blir det?`, a * b, rng, [b, -b, a + b - a * b, 1]);
      }
      if (kind === 'dela') {
        const kids = randInt(2, 6, rng);
        const each = randInt(2, 9, rng);
        return num(`${kids * each} ${sak} ska delas lika mellan ${kids} barn. Hur många får varje barn?`, each, rng, [1, -1, kids - each, 2]);
      }
      const startH = randInt(14, 19, rng);
      const startM = pick([0, 15, 30, 45], rng);
      const dur = pick([45, 60, 75, 90], rng);
      const endTotal = startH * 60 + startM + dur;
      const t = (min: number) => `${Math.floor(min / 60)}.${String(min % 60).padStart(2, '0')}`;
      const durText = dur === 45 ? '45 minuter' : dur === 60 ? '1 timme' : dur === 75 ? '1 timme och 15 minuter' : '1 och en halv timme';
      return mc(`Filmen börjar ${t(startH * 60 + startM)} och är ${durText} lång. När slutar den?`, t(endTotal), [t(endTotal + 15), t(endTotal - 15), t(endTotal + 60)], rng);
    }),
};

export const MATH_ACTIVITIES: Activity[] = [
  raknaAntal,
  jamfor,
  talraden,
  plusMinus,
  tiokompisar,
  former,
  likhet,
  dubbeltHalften,
  tiotalEntral,
  klockan,
  brak,
  gangertabell,
  matenheter,
  problemlosning,
  avrundning,
  sannolikhet,
  decimaltal,
  negativa,
  prioritering,
  ekvation,
  omkretsArea,
  vinklar,
  procent,
  lagesmatt,
  koordinater,
];
