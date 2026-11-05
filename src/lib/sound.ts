import { getSettings } from './storage';

/**
 * Små ljudeffekter skapade med Web Audio – inga ljudfiler behövs.
 * Ljudsystemet startas först efter barnets första tryck (krav i Safari),
 * och spelar aldrig något automatiskt innan dess.
 */
type Ctx = AudioContext;
let ctx: Ctx | null = null;
let unlocked = false;

function getCtx(): Ctx | null {
  if (!unlocked) return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function installAudioUnlock() {
  const unlock = () => {
    unlocked = true;
    getCtx();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export type SoundName = 'tap' | 'flip' | 'good' | 'oops' | 'win' | 'pop';

export function play(name: SoundName) {
  if (!getSettings().sound) return;
  switch (name) {
    case 'tap':
      tone(660, 0, 0.07, 'triangle', 0.08);
      break;
    case 'flip':
      tone(520, 0, 0.06, 'triangle', 0.08);
      tone(780, 0.04, 0.06, 'triangle', 0.06);
      break;
    case 'pop':
      tone(880, 0, 0.08, 'sine', 0.12);
      break;
    case 'good':
      tone(660, 0, 0.12, 'sine');
      tone(990, 0.09, 0.18, 'sine');
      break;
    case 'oops':
      tone(300, 0, 0.14, 'triangle', 0.12);
      tone(240, 0.1, 0.2, 'triangle', 0.1);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.28, 'sine', 0.16));
      break;
  }
}
