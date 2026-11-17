import { describe, expect, it } from 'vitest';
import { CUSTOM_EXAMPLE, parseCustom } from './custom';
import { assembleQuiz, DEFAULT_QUIZ } from './game';

describe('Egna quizfrågor', () => {
  it('exemplet blir två frågor med rätt svar och förklaring', () => {
    const { questions, problems } = parseCustom(CUSTOM_EXAMPLE);
    expect(problems).toEqual([]);
    expect(questions.map((q) => q.prompt)).toEqual(['Vad heter Sveriges huvudstad?', 'Hur många ben har en spindel?']);
    expect(questions[0].options.map((o) => o.label)).toEqual(['Stockholm', 'Göteborg', 'Malmö']);
    expect(questions[0].answer).toBe(0);
    expect(questions[1].answer).toBe(1);
    expect(questions[1].explain).toBe('Insekter har sex ben, spindlar har åtta.');
    expect(questions.every((q) => q.subject === 'egen')).toBe(true);
  });

  it('tål windowsradslut, extra mellanrum, punktlistor och + som markering', () => {
    const { questions, problems } = parseCustom('  Vilken färg har himlen?  \r\n- grön\r\n+   blå\r\n\r\n\r\n2 + 2?\r\n* 4\r\n5\r\n');
    expect(problems).toEqual([]);
    expect(questions[0].options.map((o) => o.label)).toEqual(['grön', 'blå']);
    expect(questions[0].answer).toBe(1);
    expect(questions[1].prompt).toBe('2 + 2?');
  });

  it('säger tydligt vad som är fel, och tar med resten', () => {
    const text = 'Utan rätt svar?\nja\nnej\n\nFör få?\n* ja\n\nTvå rätt?\n* a\n* b\n\nFör många?\n* 1\n2\n3\n4\n5\n\nLikadana?\n* Ja\nja\n\nBra fråga?\n* ja\nnej';
    const { questions, problems } = parseCustom(text);
    expect(questions.map((q) => q.prompt)).toEqual(['Bra fråga?']);
    expect(problems).toHaveLength(5);
    expect(problems[0]).toMatch(/Fråga 1.*markera rätt svar/);
    expect(problems[1]).toMatch(/minst två svar/);
    expect(problems[2]).toMatch(/bara ett svar/);
    expect(problems[3]).toMatch(/högst fyra/);
    expect(problems[4]).toMatch(/likadana/);
  });

  it('klistrat från kalkylark i Kahoots kolumnordning', () => {
    const rows = [
      'Question\tAnswer 1\tAnswer 2\tAnswer 3\tAnswer 4\tTime limit\tCorrect answer(s)',
      'Huvudstad i Norge?\tBergen\tOslo\tTromsø\t\t20\t2',
      'Störst?\t3\t30\t300\t3000\t20\t4',
      'Trasig rad\tbara ett\t\t\t\t20\t1',
      'Flera rätt?\ta\tb\tc\td\t20\t1,3',
    ].join('\n');
    const { questions, problems } = parseCustom(rows);
    expect(questions.map((q) => q.prompt)).toEqual(['Huvudstad i Norge?', 'Störst?', 'Flera rätt?']);
    expect(questions[0].options.map((o) => o.label)).toEqual(['Bergen', 'Oslo', 'Tromsø']);
    expect(questions[0].answer).toBe(1);
    expect(questions[1].options[questions[1].answer].label).toBe('3000');
    expect(problems.join(' ')).toMatch(/Rad 4.*minst två/);
    expect(problems.join(' ')).toMatch(/flera rätta svar/);
  });

  it('quizet: egna frågor först, sedan övningar upp till antalet, eller bara egna', () => {
    const mixed = assembleQuiz({ ...DEFAULT_QUIZ, custom: CUSTOM_EXAMPLE, count: 10, grade: 4 });
    expect(mixed).toHaveLength(10);
    expect(mixed.slice(0, 2).every((q) => q.subject === 'egen')).toBe(true);
    expect(mixed.slice(2).every((q) => q.subject !== 'egen')).toBe(true);
    const own = assembleQuiz({ ...DEFAULT_QUIZ, custom: CUSTOM_EXAMPLE, customOnly: true, count: 10 });
    expect(own).toHaveLength(2);
    expect(new Set(mixed.map((q) => q.id)).size).toBe(10);
  });
});
