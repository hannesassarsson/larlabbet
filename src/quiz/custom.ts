import type { QuizQuestion } from './game';

/**
 * Lärarens egna quizfrågor, skrivna som vanlig text:
 *
 *   Vad heter Sveriges huvudstad?
 *   * Stockholm
 *   Göteborg
 *   Malmö
 *
 * En tom rad mellan frågorna. Rätt svar markeras med * först på raden.
 * En rad som börjar med "Förklaring:" visas när svaret avslöjas.
 *
 * Det går också att klistra in rader från ett kalkylark med tabbar mellan
 * kolumnerna: fråga, svar 1–4, (tid), rätt svar som siffra. Det är samma
 * ordning som i Kahoots mall för att importera frågor.
 */
export interface CustomResult {
  questions: QuizQuestion[];
  /** Begripliga felmeddelanden, med frågans nummer. */
  problems: string[];
}

export const CUSTOM_EXAMPLE = `Vad heter Sveriges huvudstad?
* Stockholm
Göteborg
Malmö

Hur många ben har en spindel?
6
* 8
10
Förklaring: Insekter har sex ben, spindlar har åtta.`;

const MAX = 4;
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function make(n: number, prompt: string, answers: string[], right: number, explain?: string): QuizQuestion {
  return {
    id: `egen-${n}`,
    prompt,
    options: answers.map((label) => ({ label })),
    answer: right,
    explain,
    subject: 'egen',
    topic: 'Egen fråga',
  };
}

function fromTable(lines: string[], problems: string[]): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  lines.forEach((line, i) => {
    const cols = line.split('\t').map(clean);
    const n = i + 1;
    // Rubrikrad från en mall.
    if (i === 0 && /^(question|fråga)/i.test(cols[0])) return;
    const prompt = cols[0];
    // Sista kolumnen med siffror är rätt svar. Tidskolumnen ignoreras.
    const last = cols.length - 1;
    const rightCol = /^[1-4](\s*,\s*[1-4])*$/.test(cols[last]) ? last : -1;
    const answerCols = cols.slice(1, rightCol > 0 ? Math.min(5, rightCol) : 5);
    const nonEmpty = answerCols.map((a, k) => ({ a, k })).filter((x) => x.a !== '');
    if (!prompt) return;
    if (rightCol < 0) {
      problems.push(`Rad ${n}: sista kolumnen ska vara numret på rätt svar (1–4).`);
      return;
    }
    const rightNum = Number(cols[rightCol].split(',')[0]) - 1;
    if (nonEmpty.length < 2) {
      problems.push(`Rad ${n}: behöver minst två svar.`);
      return;
    }
    const idx = nonEmpty.findIndex((x) => x.k === rightNum);
    if (idx < 0) {
      problems.push(`Rad ${n}: rätt svar nummer ${rightNum + 1} är tomt.`);
      return;
    }
    if (cols[rightCol].includes(',')) problems.push(`Rad ${n}: flera rätta svar går inte. Det första används.`);
    out.push(make(out.length + 1, prompt, nonEmpty.map((x) => x.a), idx));
  });
  return out;
}

function fromBlocks(text: string, problems: string[]): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((b) => b.length);
  blocks.forEach((lines, i) => {
    const n = i + 1;
    const prompt = clean(lines[0]);
    let explain: string | undefined;
    const answers: string[] = [];
    const rights: number[] = [];
    for (const raw of lines.slice(1)) {
      const ex = raw.match(/^förklaring\s*:\s*(.*)$/i);
      if (ex) {
        explain = clean(ex[1]) || undefined;
        continue;
      }
      const marked = /^[*+]/.test(raw);
      const label = clean(raw.replace(/^[*+]\s*/, '').replace(/^[-–•]\s+/, ''));
      if (!label) continue;
      if (marked) rights.push(answers.length);
      answers.push(label);
    }
    const name = `Fråga ${n} (”${prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt}”)`;
    if (answers.length < 2) return problems.push(`${name}: behöver minst två svar.`);
    if (answers.length > MAX) return problems.push(`${name}: högst fyra svar.`);
    if (rights.length === 0) return problems.push(`${name}: markera rätt svar med * först på raden.`);
    if (rights.length > 1) return problems.push(`${name}: bara ett svar kan vara rätt.`);
    if (new Set(answers.map((a) => a.toLocaleLowerCase('sv'))).size !== answers.length) return problems.push(`${name}: två svar är likadana.`);
    out.push(make(out.length + 1, prompt, answers, rights[0], explain));
  });
  return out;
}

export function parseCustom(text: string): CustomResult {
  const problems: string[] = [];
  const t = text.replace(/\r\n?/g, '\n').trim();
  if (!t) return { questions: [], problems };
  const lines = t.split('\n').filter((l) => l.trim());
  const table = lines.filter((l) => l.includes('\t')).length >= Math.max(1, lines.length / 2);
  const questions = table ? fromTable(lines, problems) : fromBlocks(t, problems);
  return { questions, problems };
}
