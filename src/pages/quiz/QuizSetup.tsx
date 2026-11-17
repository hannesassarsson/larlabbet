import "../../styles/quiz.css";
import { useMemo, useState } from "react";
import { ChoiceGroup } from "../../components/GameShell";
import {
  GRADES,
  gradeLabel,
  SUBJECTS,
  subjectOf,
  type Grade,
  type SubjectId,
} from "../../curriculum/types";
import { readJSON, writeJSON } from "../../lib/storage";
import { Link, useRouter } from "../../lib/router";
import {
  assembleQuiz,
  COUNTS,
  DEFAULT_QUIZ,
  makeQuizCode,
  newGame,
  quizActivities,
  SECONDS,
  subjectName,
  type QuizConfig,
} from "../../quiz/game";
import { CUSTOM_EXAMPLE, parseCustom } from "../../quiz/custom";
import { hostQuiz, linkKind } from "../../quiz/link";
import { PortalShell } from "../skola/ui";
import { HOST_KEY } from "./QuizHost";

const CONFIG_KEY = "quiz-installning";

/** Läraren väljer ämne, årskurs och övningar och startar ett quiz med kod. */
export default function QuizSetup() {
  const { navigate } = useRouter();
  const [config, setConfig] = useState<QuizConfig>(() => ({
    ...DEFAULT_QUIZ,
    ...readJSON<Partial<QuizConfig>>(CONFIG_KEY, {}),
    seed: 1 + Math.floor(Math.random() * 1e6),
  }));
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (c: Partial<QuizConfig>) => {
    const nextConfig = { ...config, ...c };
    setConfig(nextConfig);
    setRemoved(new Set());
    const { seed: _seed, ...keep } = nextConfig;
    writeJSON(CONFIG_KEY, keep);
  };

  const available = useMemo(
    () => quizActivities(config.subject, config.grade),
    [config.subject, config.grade],
  );
  // Övningar som inte längre passar ämnet eller årskursen tas bort ur valet.
  const chosen = config.activityIds.filter((id) =>
    available.some((a) => a.id === id),
  );
  const effective = { ...config, activityIds: chosen };
  // Bygg några extra så att det finns frågor kvar när läraren tar bort någon.
  const built = useMemo(
    () => assembleQuiz({ ...effective, count: effective.count + 10 }),
    [JSON.stringify(effective)],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const kept = built.filter((q) => !removed.has(q.id));
  const questions = config.customOnly ? kept : kept.slice(0, config.count);
  const custom = useMemo(() => parseCustom(config.custom), [config.custom]);
  const [customOpen, setCustomOpen] = useState(() => !!config.custom.trim());
  const needsWords = chosen.includes("en-egna-glosor");

  const toggle = (id: string) =>
    set({
      activityIds: chosen.includes(id)
        ? chosen.filter((x) => x !== id)
        : [...chosen, id],
    });

  const title = config.customOnly
    ? "Egna frågor"
    : chosen.length === 1
      ? available.find((a) => a.id === chosen[0])!.title
      : config.subject === "alla"
        ? "Blandat quiz"
        : `${subjectOf(config.subject).short}-quiz`;

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const { code, link } = await hostQuiz(() => makeQuizCode());
      link.close(); // värdsidan ansluter igen
      writeJSON(HOST_KEY, newGame(code, config, questions, title), "session");
      navigate("/quiz/vard");
    } catch (e) {
      setError((e as Error).message || "Kunde inte starta quizet.");
      setBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const m = new Map<SubjectId, typeof available>();
    for (const a of available)
      m.set(a.subject, [...(m.get(a.subject) ?? []), a]);
    return [...m.entries()];
  }, [available]);

  return (
    <PortalShell
      title="Klassquiz"
      kicker="Alla svarar samtidigt"
      back="/lar"
      actions={
        <Link to="/quiz/spela" className="btn btn-soft">
          Elev? Gå med här
        </Link>
      }
    >
      <p className="lead muted">
        Frågorna visas på tavlan. Eleverna går med på sina plattor med en
        sifferkod och svarar så snabbt de kan. Rätt och snabbt svar ger mest
        poäng.
      </p>
      {linkKind() === "local" && (
        <p className="notice" role="note">
          Demoläge: utan Firebase kan eleverna bara gå med från andra flikar i
          samma webbläsare på den här enheten. Prova genom att öppna ”Elev? Gå
          med här” i en ny flik. Med Firebase fungerar det mellan alla plattor.
        </p>
      )}

      <div className="qz-setup">
        <section className="card qz-setup-form" aria-label="Inställningar">
          {!config.customOnly && (
            <ChoiceGroup<SubjectId | "alla">
              label="Ämne"
              value={config.subject}
              options={[
                { value: "alla", label: "Alla ämnen" },
                ...SUBJECTS.map((s) => ({ value: s.id, label: s.short })),
              ]}
              onChange={(v) => set({ subject: v, activityIds: [] })}
            />
          )}
          <ChoiceGroup<Grade>
            label="Årskurs"
            value={config.grade}
            options={GRADES.map((g) => ({ value: g, label: gradeLabel(g) }))}
            onChange={(v) => set({ grade: v })}
          />

          <fieldset className="choice-fieldset qz-custom">
            <legend>Egna frågor</legend>
            {!customOpen ? (
              <button
                type="button"
                className="btn btn-soft"
                onClick={() => setCustomOpen(true)}
              >
                Skriv egna frågor
              </button>
            ) : (
              <>
                <p className="small muted">
                  En fråga i taget med en tom rad emellan. Skriv svaren på
                  varsin rad, två till fyra stycken, och sätt * framför det
                  rätta. Du kan också klistra in rader från ett kalkylark:
                  fråga, svar 1–4, tid och numret på rätt svar, som i Kahoots
                  mall.
                </p>
                <label className="field">
                  <span className="sr-only">Egna frågor</span>
                  <textarea
                    id="qz-custom"
                    rows={9}
                    value={config.custom}
                    onChange={(e) => set({ custom: e.target.value })}
                    placeholder={CUSTOM_EXAMPLE}
                    spellCheck
                  />
                </label>
                <div className="qz-custom-status" role="status">
                  {config.custom.trim() === "" ? (
                    <button
                      type="button"
                      className="btn btn-soft btn-small"
                      onClick={() => set({ custom: CUSTOM_EXAMPLE })}
                    >
                      Fyll i ett exempel
                    </button>
                  ) : (
                    <p className={custom.questions.length ? "ok" : ""}>
                      {custom.questions.length === 1
                        ? "1 fråga klar"
                        : `${custom.questions.length} frågor klara`}
                    </p>
                  )}
                  {custom.problems.length > 0 && (
                    <ul className="qz-problems">
                      {custom.problems.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={config.customOnly}
                    onChange={(e) => set({ customOnly: e.target.checked })}
                  />
                  <span>
                    Bara mina egna frågor (annars fylls quizet på med frågor
                    från övningarna)
                  </span>
                </label>
              </>
            )}
          </fieldset>

          {!config.customOnly && (
            <fieldset className="choice-fieldset">
              <legend>Övningar</legend>
              <p className="small muted">
                {chosen.length === 0
                  ? `Inget valt: frågorna blandas från alla ${available.length} övningar som passar.`
                  : `${chosen.length} valda.`}
              </p>
              <div className="qz-acts">
                {grouped.map(([subj, acts]) => (
                  <div key={subj} className="qz-act-group">
                    {config.subject === "alla" && (
                      <h3
                        style={{
                          ["--subject" as string]: subjectOf(subj).color,
                        }}
                      >
                        {subjectName(subj)}
                      </h3>
                    )}
                    <div className="qz-act-chips">
                      {acts.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="chip"
                          aria-pressed={chosen.includes(a.id)}
                          onClick={() => toggle(a.id)}
                        >
                          {a.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {chosen.length > 0 && (
                <button
                  type="button"
                  className="btn btn-soft btn-small"
                  onClick={() => set({ activityIds: [] })}
                >
                  Blanda alla i stället
                </button>
              )}
            </fieldset>
          )}

          {needsWords && (
            <label className="field">
              <span>Egna glosor, en per rad: svenska – engelska</span>
              <textarea
                id="qz-words"
                rows={5}
                value={config.words}
                onChange={(e) => set({ words: e.target.value })}
                placeholder={"hund – dog\nkatt – cat"}
              />
            </label>
          )}

          {!config.customOnly && (
            <ChoiceGroup<number>
              label="Antal frågor"
              value={config.count}
              options={COUNTS.map((n) => ({ value: n, label: String(n) }))}
              onChange={(v) => set({ count: v })}
            />
          )}
          <ChoiceGroup<number>
            label="Tid per fråga"
            value={config.seconds}
            options={SECONDS.map((n) => ({ value: n, label: `${n} s` }))}
            onChange={(v) => set({ seconds: v })}
          />
          <label className="check">
            <input
              type="checkbox"
              checked={config.showOnDevice}
              onChange={(e) => set({ showOnDevice: e.target.checked })}
            />
            <span>
              Visa frågan och svaren på elevernas skärmar också (bra för de som
              har svårt att se tavlan)
            </span>
          </label>
        </section>

        <section className="card qz-preview" aria-labelledby="qz-prev-title">
          <div className="qz-preview-head">
            <h2 id="qz-prev-title">{questions.length} frågor</h2>
            <button
              type="button"
              className="btn btn-soft btn-small"
              onClick={() => {
                setConfig({ ...config, seed: config.seed + 1 });
                setRemoved(new Set());
              }}
            >
              Nya frågor
            </button>
          </div>
          {!config.customOnly &&
            questions.length < config.count &&
            questions.length > 0 && (
              <p className="notice small">
                Det finns bara {questions.length} olika frågor för det här
                valet. Välj fler övningar eller en annan årskurs för fler.
              </p>
            )}
          {questions.length === 0 ? (
            <p className="notice">
              {config.customOnly
                ? "Skriv minst en egen fråga."
                : needsWords
                  ? "Skriv in minst två glosor."
                  : "Det finns inga quizfrågor för det här valet."}
            </p>
          ) : (
            <ol className="qz-qlist">
              {(showAll ? questions : questions.slice(0, 8)).map((q) => (
                <li key={q.id}>
                  <div>
                    <span>
                      {q.prompt}
                      {q.detail ? ` ${q.detail}` : ""}
                      <small>
                        {q.subject === 'egen' ? 'Egen fråga' : `${subjectName(q.subject)} · ${q.topic}`}
                        {!q.options[q.answer].hideLabel && (
                          <> · Svar: {q.options[q.answer].label}</>
                        )}
                      </small>
                    </span>
                    <button
                      type="button"
                      className="icon-btn small"
                      aria-label={`Ta bort frågan ${q.prompt}`}
                      onClick={() => setRemoved(new Set([...removed, q.id]))}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {questions.length > 8 && (
            <button
              type="button"
              className="btn btn-soft btn-small"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Visa färre" : `Visa alla ${questions.length}`}
            </button>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn btn-big qz-start"
            disabled={busy || questions.length === 0}
            onClick={start}
          >
            {busy ? "Startar …" : "Starta quiz"}
          </button>
        </section>
      </div>
    </PortalShell>
  );
}
