import { describe, expect, it } from 'vitest';
import { GRADES, SUBJECTS, type Grade } from '../curriculum/types';
import { activePlayers, addPlayer, quizResultFrom, allAnswered, answer, buildQuiz, cleanName, counts, DEFAULT_QUIZ, newGame, next, openQuestion, pointsFor, publicState, quizActivities, ranking, removePlayer, reveal, showScores, startGame, summary, type QuizConfig } from './game';

const cfg = (c: Partial<QuizConfig> = {}): QuizConfig => ({ ...DEFAULT_QUIZ, ...c });
const key = (q: { prompt: string; detail?: string; visual?: unknown }) => `${q.prompt}|${q.detail ?? ''}|${JSON.stringify(q.visual ?? '')}`;

describe('Quizfrågor', () => {
  it('varje ämne och årskurs ger minst 30 olika frågor med 2–4 svar och exakt ett rätt', () => {
    for (const s of [...SUBJECTS.map((x) => x.id), 'alla' as const]) {
      for (const g of GRADES as Grade[]) {
        if (s === 'engelska' && g === 0) continue;
        const qs = buildQuiz(cfg({ subject: s, grade: g, count: 40, seed: 7 }));
        expect(qs.length, `${s} åk ${g}`).toBeGreaterThanOrEqual(30);
        expect(new Set(qs.map(key)).size, `dubbletter i ${s} åk ${g}`).toBe(qs.length);
        for (const q of qs) {
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          expect(q.options.length).toBeLessThanOrEqual(4);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
          expect(new Set(q.options.map((o) => o.label + JSON.stringify(o.visual ?? ''))).size).toBe(q.options.length);
        }
      }
    }
  });

  it('blandat quiz tar frågor från alla ämnen och flera övningar', () => {
    const qs = buildQuiz(cfg({ subject: 'alla', grade: 5, count: 30 }));
    expect(new Set(qs.map((q) => q.subject)).size).toBe(5);
    expect(new Set(qs.map((q) => q.topic)).size).toBeGreaterThanOrEqual(10);
  });

  it('samma inställning ger samma quiz, nytt frö ger nya frågor', () => {
    const a = buildQuiz(cfg({ seed: 3 }));
    expect(buildQuiz(cfg({ seed: 3 }))).toEqual(a);
    expect(buildQuiz(cfg({ seed: 4 })).map(key)).not.toEqual(a.map(key));
  });

  it('valda övningar och egna glosor', () => {
    const qs = buildQuiz(cfg({ subject: 'engelska', grade: 4, activityIds: ['en-egna-glosor'], words: 'hund – dog\nkatt – cat\nhäst – horse\nko – cow\nfisk – fish', count: 10 }));
    expect(qs.length).toBe(10);
    expect(qs.every((q) => q.topic === 'Egna glosor')).toBe(true);
    expect(buildQuiz(cfg({ activityIds: ['en-egna-glosor'], words: '' }))).toEqual([]);
  });

  it('bara flervalsövningar erbjuds', () => {
    const ids = quizActivities('alla', 'alla').map((a) => a.id);
    expect(ids).not.toContain('ma-monster');
    expect(ids.length).toBeGreaterThan(50);
  });
});

describe('Quizspelet', () => {
  const qs = buildQuiz(cfg({ subject: 'matematik', grade: 2, count: 3, seconds: 20 }));
  const start = () => {
    let g = newGame('123456', cfg({ seconds: 20 }), qs, 'Test');
    g = addPlayer(g, 'a', 'Alva');
    g = addPlayer(g, 'b', 'Bo');
    g = addPlayer(g, 'c', '  alva  ');
    return g;
  };

  it('namn städas och blir unika', () => {
    const g = start();
    expect(activePlayers(g).map((p) => p.name)).toEqual(['Alva', 'Bo', 'alva 2']);
    expect(cleanName('<script>Kim</script>!!')).toBe('scriptKimscript');
    expect(cleanName('En väldigt lång namnrad här')).toHaveLength(16);
  });

  it('poäng: snabbt rätt ger mer, fel ger noll, svit ger bonus', () => {
    expect(pointsFor(true, 0, 20000, 1)).toBe(1000);
    expect(pointsFor(true, 20000, 20000, 1)).toBe(500);
    expect(pointsFor(true, 10000, 20000, 3)).toBe(750 + 100);
    expect(pointsFor(true, 0, 20000, 20)).toBe(1250);
    expect(pointsFor(false, 0, 20000, 5)).toBe(0);
  });

  it('en hel omgång: svar, avslöjande, ställning och slut', () => {
    let g = startGame(start());
    expect(g.phase).toBe('ready');
    // Svar innan frågan är öppen räknas inte.
    expect(answer(g, 'a', 0, qs[0].answer, 100)).toBe(g);
    g = openQuestion(g);
    const pub = publicState(g);
    expect(pub.question.answer).toBeUndefined();
    expect(pub.question.explain).toBeUndefined();
    const wrong = (qs[0].answer + 1) % qs[0].options.length;
    g = answer(g, 'a', 0, qs[0].answer, 2000);
    g = answer(g, 'a', 0, wrong, 100); // andra svaret ignoreras
    g = answer(g, 'b', 0, wrong, 1000);
    expect(allAnswered(g)).toBe(false);
    g = answer(g, 'c', 0, qs[0].answer, 8000);
    expect(allAnswered(g)).toBe(true);
    expect(counts(g)[qs[0].answer]).toBe(2);
    g = reveal(g);
    expect(publicState(g).question.answer).toBe(qs[0].answer);
    expect(publicState(g).players.a.last).toEqual({ correct: true, gained: g.players.a.answers[0].gained });
    expect(ranking(g).map((r) => r.id)).toEqual(['a', 'c', 'b']);
    g = next(showScores(g));
    expect(g.phase).toBe('ready');
    expect(g.index).toBe(1);
    g = next(reveal(openQuestion(g)));
    g = next(reveal(openQuestion(g)));
    expect(g.phase).toBe('end');
    const sum = summary(g);
    expect(sum[0].right).toBe(2);
    expect(sum[1].answered).toBe(0);
  });

  it('borttagen elev syns inte och kan inte svara', () => {
    let g = openQuestion(startGame(removePlayer(start(), 'b')));
    expect(answer(g, 'b', 0, 0, 1)).toBe(g);
    expect(addPlayer(g, 'b', 'Bo igen')).toBe(g);
    expect(publicState(g).removed).toEqual(['b']);
    expect(Object.keys(publicState(g).players)).toEqual(['a', 'c']);
    g = answer(answer(g, 'a', 0, 0, 1), 'c', 0, 0, 1);
    expect(allAnswered(g)).toBe(true);
  });

  it('lika poäng ger samma placering', () => {
    let g = openQuestion(startGame(start()));
    for (const id of ['a', 'b', 'c']) g = answer(g, id, 0, qs[0].answer, 5000);
    expect(ranking(reveal(g)).map((r) => r.rank)).toEqual([1, 1, 1]);
  });

  it('resultatet för klassen: placering, antal rätt, elevkoppling bara när quizet hör till en klass', () => {
    const cls = { id: 'c1', name: '4A' };
    let g = newGame('123456', cfg({ seconds: 20 }), qs, 'Test', cls);
    g = addPlayer(g, 'a', 'Alva', 's1');
    g = addPlayer(g, 'b', 'Bo');
    g = openQuestion(startGame(g));
    g = answer(g, 'a', 0, qs[0].answer, 1000);
    g = answer(g, 'b', 0, (qs[0].answer + 1) % qs[0].options.length, 1000);
    const r = quizResultFrom(reveal(g), 42);
    expect(r.at).toBe(42);
    expect(r.players).toEqual([
      { name: 'Alva', studentId: 's1', score: g.players.a.score, right: 1, rank: 1 },
      { name: 'Bo', score: 0, right: 0, rank: 2 },
    ]);
    expect(r.questions[0]).toMatchObject({ right: 1, answered: 2 });
    expect(r.questions[1]).toMatchObject({ right: 0, answered: 0 });
    // Utan klass sparas ingen elevkoppling.
    expect(addPlayer(newGame('1', cfg(), qs, 'T'), 'a', 'Alva', 's1').players.a.studentId).toBeUndefined();
  });
});
