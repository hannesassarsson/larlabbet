import '../../styles/quiz.css';
import type { ChoiceOption } from '../../curriculum/types';
import { VisualView } from '../../play/VisualView';

/** Fyra svarsfärger med var sin form, så att färgblinda också ser skillnad. */
export const ANSWER_NAMES = ['Triangel', 'Romb', 'Cirkel', 'Kvadrat'];

export function Shape({ i, size = 28 }: { i: number; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'currentColor' } as const;
  if (i === 0) return <svg {...p}><path d="M12 3 22 20H2z" /></svg>;
  if (i === 1) return <svg {...p}><path d="M12 2 22 12 12 22 2 12z" /></svg>;
  if (i === 2) return <svg {...p}><circle cx="12" cy="12" r="10" /></svg>;
  return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /></svg>;
}

export function OptionContent({ o }: { o: ChoiceOption }) {
  return (
    <>
      {o.visual && (
        <span className="qz-opt-visual">
          <VisualView v={o.visual} />
        </span>
      )}
      {!o.hideLabel && o.label && <span className="qz-opt-label">{o.label}</span>}
    </>
  );
}

/** Nedräkning som en stapel som krymper. Ren CSS-animation, så den går mjukt. */
export function TimeBar({ ms, k }: { ms: number; k: string | number }) {
  return (
    <div className="qz-timebar" aria-hidden="true">
      <span key={k} style={{ animationDuration: `${ms}ms` }} />
    </div>
  );
}
