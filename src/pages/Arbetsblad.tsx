import { useEffect, useMemo, useState } from 'react';
import { ChoiceGroup, Overlay } from '../components/GameShell';
import { IconBack, IconBulb, IconClose, IconRestart, IconTrash } from '../components/Icons';
import { getActivity } from '../curriculum';
import { parseWordList } from '../curriculum/engelska';
import { GRADES, gradeLabel, gradeRange, SUBJECTS, subjectOf, type SubjectId } from '../curriculum/types';
import { readJSON, writeJSON } from '../lib/storage';
import { HASH_MODE, Link, useRouter } from '../lib/router';
import { useElementSize } from '../lib/useFit';
import { FacitPaper, SheetPaper } from '../print/Paper';
import { autoTitle, buildSheet, DEFAULT_CONFIG, newSeed, printableActivities, suggestSections, type AnswerMode, type SheetConfig } from '../print/worksheet';

const DRAFT_KEY = 'arbetsblad-utkast';
const SAVED_KEY = 'arbetsblad-sparade';
const PREFILL_KEY = 'arbetsblad-forval';
const COUNTS = [4, 6, 8, 10, 12, 16, 20];
const PAPER_PX = 794; // 210 mm vid 96 dpi

interface Saved {
  id: string;
  title: string;
  config: SheetConfig;
  savedAt: number;
}

/** Öppnar arbetsbladssidan med färdiga inställningar, t.ex. från ett uppdrag. */
export function openWorksheet(patch: Partial<SheetConfig>, navigate: (to: string) => void) {
  writeJSON(PREFILL_KEY, patch, 'session');
  navigate('/arbetsblad');
}

function loadInitial(): SheetConfig {
  const prefill = readJSON<Partial<SheetConfig> | null>(PREFILL_KEY, null, 'session');
  if (prefill) {
    writeJSON(PREFILL_KEY, null, 'session');
    return { ...DEFAULT_CONFIG, ...prefill, seed: prefill.seed ?? newSeed() };
  }
  return { ...DEFAULT_CONFIG, seed: newSeed(), ...readJSON<Partial<SheetConfig>>(DRAFT_KEY, {}) };
}

export default function Arbetsblad() {
  const { navigate } = useRouter();
  const [config, setConfig] = useState<SheetConfig>(loadInitial);
  const [subject, setSubject] = useState<SubjectId | 'alla'>('alla');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [saved, setSaved] = useState<Saved[]>(() => readJSON<Saved[]>(SAVED_KEY, []));
  const [toast, setToast] = useState<string | null>(null);
  const [printHelp, setPrintHelp] = useState(false);
  const [boxRef, box] = useElementSize<HTMLDivElement>();

  const set = (patch: Partial<SheetConfig>) => setConfig((c) => ({ ...c, ...patch }));
  useEffect(() => writeJSON(DRAFT_KEY, config), [config]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const title = autoTitle(config);
  const sheets = useMemo(() => Array.from({ length: config.variants }, (_, v) => buildSheet(config, v)), [config]);
  const catalog = useMemo(() => printableActivities(subject, config.grade), [subject, config.grade]);
  const needsWords = config.sections.some((s) => getActivity(s.activityId)?.needsWordList);
  const wordCount = parseWordList(config.words).length;
  const hasContent = sheets[0].sections.some((s) => !s.problem && s.items.length);
  const zoom = box.width ? Math.min(1, (box.width - 4) / PAPER_PX) : 1;

  const updateSection = (i: number, patch: Partial<SheetConfig['sections'][number]>) =>
    set({ sections: config.sections.map((s, k) => (k === i ? { ...s, ...patch } : s)) });

  const suggest = () => {
    const seed = newSeed();
    set({ sections: suggestSections(subject, config.grade, seed), seed, title: '', big: config.grade <= 1 });
    setToast('Här är ett förslag. Byt gärna övningar eller tryck igen.');
  };

  const add = (id: string) => {
    const a = getActivity(id)!;
    set({ sections: [...config.sections, { activityId: id, level: a.defaultLevel, count: config.grade <= 1 ? 6 : 8 }] });
    setToast(`${a.title} lades till.`);
  };

  const save = () => {
    const entry: Saved = { id: String(Date.now()), title, config, savedAt: Date.now() };
    const list = [entry, ...saved.filter((s) => !(s.title === title && s.config.seed === config.seed))].slice(0, 30);
    setSaved(list);
    writeJSON(SAVED_KEY, list);
    setToast('Bladet är sparat på den här enheten.');
  };

  const doPrint = () => {
    if (HASH_MODE) {
      setPrintHelp(true);
      return;
    }
    window.print();
  };

  return (
    <div className="page worksheet-page">
      <div className="container no-print">
        <header className="portal-top">
          <button className="icon-btn" onClick={() => navigate('/skola')} aria-label="Tillbaka">
            <IconBack />
          </button>
          <div className="portal-title">
            <p className="hero-kicker">För lärare och föräldrar</p>
            <h1>Arbetsblad att skriva ut</h1>
          </div>
        </header>
      </div>

      <div className="ws-layout">
        <aside className="ws-controls no-print" aria-label="Inställningar för bladet">
          <section className="card ws-step">
            <h2>
              <span className="step-num">1</span> Vilken årskurs?
            </h2>
            <div className="grade-row" role="radiogroup" aria-label="Årskurs">
              {GRADES.map((g) => (
                <button key={g} role="radio" aria-checked={config.grade === g} className="grade-btn" onClick={() => set({ grade: g, big: g <= 1 })}>
                  {gradeLabel(g)}
                </button>
              ))}
            </div>
            <div className="chip-row wrap" role="group" aria-label="Ämne">
              <button className="chip small" aria-pressed={subject === 'alla'} onClick={() => setSubject('alla')}>
                Alla ämnen
              </button>
              {SUBJECTS.map((s) => (
                <button key={s.id} className="chip small" aria-pressed={subject === s.id} onClick={() => setSubject(s.id)}>
                  <i className="chip-dot" style={{ background: s.color }} /> {s.short}
                </button>
              ))}
            </div>
            <button className="btn btn-big suggest-btn" onClick={suggest}>
              <IconBulb /> Föreslå ett blad
            </button>
          </section>

          <section className="card ws-step">
            <h2>
              <span className="step-num">2</span> Övningar på bladet
            </h2>
            {config.sections.length === 0 && <p className="muted">Tryck på ”Föreslå ett blad” eller lägg till övningar själv.</p>}
            <ol className="editor-items">
              {config.sections.map((sec, i) => {
                const a = getActivity(sec.activityId);
                if (!a) return null;
                const subj = subjectOf(a.subject);
                return (
                  <li key={i} className="editor-item" style={{ borderColor: subj.color }}>
                    <div className="editor-item-head">
                      <b>{a.title}</b>
                      <span className="muted small">
                        {subj.short} · åk {gradeRange(a.grades)}
                      </span>
                      <span className="row-actions">
                        <button className="icon-btn small" onClick={() => set({ sections: config.sections.filter((_, k) => k !== i) })} aria-label={`Ta bort ${a.title}`}>
                          <IconClose />
                        </button>
                      </span>
                    </div>
                    <div className="editor-item-opts">
                      {a.levels && (
                        <label className="field compact">
                          <span>Nivå</span>
                          <select value={sec.level ?? a.defaultLevel} onChange={(e) => updateSection(i, { level: e.target.value })}>
                            {a.levels.map((l) => (
                              <option key={l.value} value={l.value}>
                                {l.label}
                                {l.hint ? ` – ${l.hint}` : ''}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <label className="field compact">
                        <span>Uppgifter</span>
                        <select value={sec.count} onChange={(e) => updateSection(i, { count: Number(e.target.value) })}>
                          {COUNTS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button className="btn btn-soft" onClick={() => setCatalogOpen(true)}>
              Lägg till övning
            </button>
            {needsWords && (
              <label className="field">
                <span>
                  Egna glosor <small>(en per rad: svenska – engelska)</small>
                </span>
                <textarea id="ws-words" rows={6} value={config.words} onChange={(e) => set({ words: e.target.value })} placeholder={'päron – pear\nplommon – plum\nvindruva – grape'} />
                <small>{wordCount} glosor</small>
              </label>
            )}
          </section>

          <section className="card ws-step">
            <h2>
              <span className="step-num">3</span> Utseende
            </h2>
            <label className="field">
              <span>
                Rubrik <small>(lämna tom för automatisk)</small>
              </span>
              <input id="ws-title" value={config.title} onChange={(e) => set({ title: e.target.value })} placeholder={title} />
            </label>
            <ChoiceGroup<AnswerMode>
              label="Hur ska eleven svara?"
              value={config.mode}
              onChange={(mode) => set({ mode })}
              options={[
                { value: 'auto', label: 'Automatiskt', hint: 'Skriva i matte och glosor' },
                { value: 'choose', label: 'Ringa in', hint: 'Flervalsalternativ' },
                { value: 'write', label: 'Skriva', hint: 'Där det går' },
              ]}
            />
            <ChoiceGroup<number>
              label="Olika blad till grannarna"
              value={config.variants}
              onChange={(variants) => set({ variants })}
              options={[
                { value: 1, label: 'Ett blad' },
                { value: 2, label: 'A och B' },
                { value: 3, label: 'A–C' },
                { value: 4, label: 'A–D' },
              ]}
            />
            <div className="toggles">
              <label className="check">
                <input type="checkbox" checked={config.facit} onChange={(e) => set({ facit: e.target.checked })} />
                <span>Facit på sista sidan</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={config.nameLine} onChange={(e) => set({ nameLine: e.target.checked })} />
                <span>Rad för namn och datum</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={config.big} onChange={(e) => set({ big: e.target.checked })} />
                <span>Stor text (bra i F–1)</span>
              </label>
            </div>
          </section>

          <section className="card ws-step ws-actions">
            <button className="btn btn-big" onClick={doPrint} disabled={!hasContent}>
              Skriv ut
            </button>
            <div className="ws-action-row">
              <button className="btn btn-soft" onClick={() => set({ seed: newSeed() })} disabled={!hasContent}>
                <IconRestart /> Nya frågor
              </button>
              <button className="btn btn-soft" onClick={save} disabled={!hasContent}>
                Spara bladet
              </button>
            </div>
            <p className="muted small">
              Tips: välj ”Spara som PDF” i utskriftsrutan för att mejla eller lägga bladet i lärplattformen. Bladnummer {config.seed} ger exakt samma frågor nästa gång.
            </p>
          </section>

          {saved.length > 0 && (
            <section className="card ws-step">
              <h2>Sparade blad</h2>
              <ul className="saved-list">
                {saved.map((s) => (
                  <li key={s.id}>
                    <button className="saved-open" onClick={() => (setConfig(s.config), setToast(`”${s.title}” är öppnat.`))}>
                      <b>{s.title}</b>
                      <small>
                        Åk {gradeLabel(s.config.grade)} · nr {s.config.seed} · {new Date(s.savedAt).toLocaleDateString('sv-SE')}
                      </small>
                    </button>
                    <button
                      className="icon-btn small"
                      aria-label={`Ta bort ${s.title}`}
                      onClick={() => {
                        const list = saved.filter((x) => x.id !== s.id);
                        setSaved(list);
                        writeJSON(SAVED_KEY, list);
                      }}
                    >
                      <IconTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <div className="ws-preview" ref={boxRef}>
          <p className="ws-preview-label no-print">
            Förhandsvisning · {config.variants > 1 ? `${config.variants} olika blad` : '1 blad'}
            {config.facit ? ' + facit' : ''}
          </p>
          {hasContent ? (
            <div className="paper-stack" style={{ zoom }}>
              {sheets.map((sheet) => (
                <SheetPaper key={sheet.variant} sheet={sheet} config={config} title={title} />
              ))}
              {config.facit && <FacitPaper sheets={sheets} config={config} title={title} />}
            </div>
          ) : (
            <div className="paper empty-paper no-print" style={{ zoom }}>
              <p>Bladet är tomt.</p>
              <p className="muted">Välj årskurs och tryck på ”Föreslå ett blad”.</p>
              {config.sections.length > 0 && sheets[0].sections.map((s, i) => s.problem && <p key={i} className="form-error">{s.heading}: {s.problem}</p>)}
            </div>
          )}
        </div>
      </div>

      {catalogOpen && (
        <Overlay label="Lägg till övning" onClose={() => setCatalogOpen(false)}>
          <div className="catalog-overlay">
            <div className="catalog-overlay-head">
              <h2>Lägg till övning</h2>
              <button className="icon-btn small" onClick={() => setCatalogOpen(false)} aria-label="Stäng">
                <IconClose />
              </button>
            </div>
            <p className="muted small">
              Visar övningar för {config.grade === 0 ? 'förskoleklass' : `årskurs ${config.grade}`}
              {subject !== 'alla' ? ` i ${subjectOf(subject).short.toLowerCase()}` : ''}.
            </p>
            <ul className="catalog-list">
              {catalog.map((a) => {
                const subj = subjectOf(a.subject);
                const n = config.sections.filter((s) => s.activityId === a.id).length;
                return (
                  <li key={a.id}>
                    <div className="catalog-item">
                      <span className="item-dot" style={{ background: subj.color }} aria-hidden="true" />
                      <span className="item-text">
                        <b>{a.title}</b>
                        <small>
                          {subj.short} · {a.area}
                        </small>
                      </span>
                      <span className="catalog-buttons">
                        <button className="btn btn-small" onClick={() => add(a.id)}>
                          {n ? `Lägg till igen` : 'Lägg till'}
                        </button>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button className="btn btn-big" onClick={() => setCatalogOpen(false)}>
              Klar
            </button>
          </div>
        </Overlay>
      )}

      {printHelp && (
        <Overlay label="Utskrift" onClose={() => setPrintHelp(false)}>
          <h2>Utskrift fungerar i appen</h2>
          <p>Det här är en förhandsvisning där webbläsaren inte får öppna utskriftsrutan. När Leklandet ligger på sin egen adress skriver knappen ut bladet direkt, eller sparar det som PDF.</p>
          <button className="btn btn-big" onClick={() => setPrintHelp(false)}>
            Okej
          </button>
        </Overlay>
      )}

      {toast && (
        <div className="toast no-print" role="status">
          <span>{toast}</span>
        </div>
      )}
      <p className="container no-print muted small ws-footnote">
        Vill du ge övningarna digitalt i stället? <Link to="/larare">Skapa en klass</Link> eller låt eleverna <Link to="/ova">öva fritt</Link>.
      </p>
    </div>
  );
}
