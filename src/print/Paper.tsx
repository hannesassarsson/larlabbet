import { LogoMark } from '../components/Logo';
import { levelLabel } from '../curriculum';
import { gradeLong, subjectOf, type ChoiceQuestion } from '../curriculum/types';
import { VisualView } from '../play/VisualView';
import { facitFor, promptParts, type PrintItem, type PrintSection, type PrintSheet, type SheetConfig } from './worksheet';

const LETTERS = 'ABCDEF';

function Blank({ wide = false }: { wide?: boolean }) {
  return <span className={`ws-blank${wide ? ' wide' : ''}`} aria-label="tom rad" />;
}

function ChooseOptions({ q }: { q: ChoiceQuestion }) {
  const pictures = q.options.every((o) => o.hideLabel);
  if (pictures) {
    return (
      <div className={`ws-pics n${q.options.length}`}>
        {q.options.map((o, i) => (
          <div key={i} className="ws-pic">
            <span className="ws-pic-img">{o.visual && <VisualView v={o.visual} />}</span>
            <span className="ws-letter">{LETTERS[i]}</span>
          </div>
        ))}
      </div>
    );
  }
  const long = q.options.some((o) => o.label.length > 20);
  return (
    <div className={`ws-options${long ? ' long' : ''}`}>
      {q.options.map((o, i) => (
        <span key={i} className="ws-option">
          <span className="ws-letter">{LETTERS[i]}</span>
          {o.visual && (
            <span className="ws-option-img">
              <VisualView v={o.visual} />
            </span>
          )}
          {!o.hideLabel && o.label}
        </span>
      ))}
    </div>
  );
}

function Item({ it, n }: { it: PrintItem; n: number }) {
  const q = it.q;
  const visual = 'visual' in q ? q.visual : undefined;
  const detail = 'detail' in q ? q.detail : undefined;
  const parts = promptParts(q.prompt);
  const inlineBlank = it.answer === 'write' && parts.blank;

  return (
    <li className={`ws-item${visual ? ' has-visual' : ''}`}>
      <span className="ws-num">{n}</span>
      <div className="ws-body">
        <p className="ws-prompt">
          {inlineBlank ? (
            <>
              {parts.before}
              <Blank />
              {parts.after}
            </>
          ) : (
            q.prompt
          )}
        </p>
        {detail && <p className="ws-detail">{detail.replace(/__/g, '_____')}</p>}
        <div className="ws-answer-row">
          {visual && (
            <span className={`ws-visual v-${visual.t}`}>
              <VisualView v={visual} />
            </span>
          )}
          <div className="ws-answer">
            {it.answer === 'choose' && q.kind === 'choice' && <ChooseOptions q={q} />}
            {it.answer === 'write' && !inlineBlank && (
              <p className="ws-write">
                Svar: <Blank wide />
              </p>
            )}
            {it.answer === 'order' && q.kind === 'order' && (
              <ul className="ws-order">
                {(it.shuffled ?? q.items).map((t) => (
                  <li key={t}>
                    <span className="ws-box" />
                    {t}
                  </li>
                ))}
              </ul>
            )}
            {it.answer === 'spell' && q.kind === 'spell' && (
              <div className="ws-spell">
                <div className="ws-spell-boxes">
                  {q.answer.split('').map((_, i) => (
                    <span key={i} className="ws-box big" />
                  ))}
                </div>
                <div className="ws-bank" aria-label="Bokstäver att använda">
                  {it.letters?.map((l, i) => (
                    <span key={i}>{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Section({ s, start }: { s: PrintSection; start: number }) {
  const subject = subjectOf(s.activity.subject);
  if (s.problem) {
    return (
      <section className="ws-section ws-problem no-print">
        <h2>{s.heading}</h2>
        <p>{s.problem}</p>
      </section>
    );
  }
  // Korta uppgifter får två spalter så att bladet inte blir onödigt långt.
  const twoCol =
    s.layout === 'pictures' ||
    (s.layout === 'list' &&
      s.items.every((it) => {
        const q = it.q;
        if (q.kind === 'order') return false;
        if (q.prompt.length > 70) return false;
        if (q.kind === 'choice' && it.answer === 'choose') return q.options.every((o) => o.label.length <= 16);
        return true;
      }));
  return (
    <section className={`ws-section layout-${s.layout}${twoCol ? ' two-col' : ''}`}>
      <header className="ws-section-head" style={{ ['--subject' as string]: subject.color }}>
        <h2>{s.heading}</h2>
        <p>{s.instruction}</p>
      </header>
      {s.layout === 'glosor' ? (
        <ol className="ws-glosor" start={start}>
          {s.items.map((it, i) => (
            <li key={i}>
              <span className="ws-num">{start + i}</span>
              <span className="ws-cue">{(it.q as ChoiceQuestion).cue}</span>
              <Blank wide />
            </li>
          ))}
        </ol>
      ) : (
        <ol className="ws-items">
          {s.items.map((it, i) => (
            <Item key={i} it={it} n={start + i} />
          ))}
        </ol>
      )}
    </section>
  );
}

export function SheetPaper({ sheet, config, title, className }: { sheet: PrintSheet; config: SheetConfig; title: string; className?: string }) {
  let counter = 1;
  const starts = sheet.sections.map((s) => {
    const st = counter;
    if (!s.problem) counter += s.items.length;
    return st;
  });
  const total = counter - 1;
  return (
    <article className={`paper${config.big ? ' big' : ''}${className ? ' ' + className : ''}`} aria-label={`Arbetsblad ${sheet.variant}`}>
      <header className="ws-head">
        <div className="ws-brand">
          <LogoMark size={34} mode="lar" />
          <span>Lärlabbet</span>
        </div>
        <div className="ws-title">
          <h1>{title}</h1>
          <p>
            {gradeLong(config.grade)} · {total} uppgifter{config.variants > 1 ? ` · Blad ${sheet.variant}` : ''}
          </p>
        </div>
        {config.nameLine && (
          <div className="ws-name">
            <span>
              Namn <Blank wide />
            </span>
            <span>
              Datum <Blank />
            </span>
          </div>
        )}
      </header>
      {sheet.sections.map((s, i) => (
        <Section key={i} s={s} start={starts[i]} />
      ))}
      <footer className="ws-foot">
        <span>Bladnummer {sheet.number}</span>
        <span>lärlabbet · arbetsblad</span>
      </footer>
    </article>
  );
}

export function FacitPaper({ sheets, config, title }: { sheets: PrintSheet[]; config: SheetConfig; title: string }) {
  return (
    <article className="paper facit" aria-label="Facit">
      <header className="ws-head">
        <div className="ws-brand">
          <LogoMark size={34} mode="lar" />
          <span>Lärlabbet</span>
        </div>
        <div className="ws-title">
          <h1>Facit: {title}</h1>
          <p>För läraren</p>
        </div>
      </header>
      <div className={`facit-grid n${sheets.length}`}>
        {sheets.map((sheet) => {
          let n = 1;
          return (
            <section key={sheet.variant} className="facit-sheet">
              {sheets.length > 1 && <h2>Blad {sheet.variant}</h2>}
              {facitFor(sheet).map((sec, si) => (
                <div key={si} className="facit-section">
                  <h3>{sec.heading}</h3>
                  <ol>
                    {sec.answers.map((a, i) => (
                      <li key={i}>
                        <b>{n++}.</b> {a}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <p className="facit-num">Bladnummer {sheet.number}</p>
            </section>
          );
        })}
      </div>
      <footer className="ws-foot">
        <span>
          {config.sections
            .map((s) => {
              const sheet = sheets[0].sections.find((x) => x.activity.id === s.activityId);
              return sheet ? `${sheet.heading}${s.level ? ` (${levelLabel(sheet.activity, s.level)})` : ''}` : '';
            })
            .filter(Boolean)
            .join(' · ')}
        </span>
      </footer>
    </article>
  );
}
