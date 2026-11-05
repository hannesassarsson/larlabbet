import { useCallback, useEffect, useRef, useState } from 'react';
import { GameIntro, GameTopBar, Overlay, PauseOverlay, type Phase } from '../../components/GameShell';
import { IconCheck, IconDownload, IconEraser, IconHome, IconTrash, IconUndo } from '../../components/Icons';
import { useRouter } from '../../lib/router';
import { play } from '../../lib/sound';
import { readJSON, removeKey, saveResult, useSessionState, writeJSON } from '../../lib/storage';
import type { GameMeta } from '../registry';

const COLORS = ['#3B2F5C', '#EF4B4B', '#FF8A5B', '#FFC53D', '#7BD389', '#2EC4B6', '#5BC0EB', '#A78BFA', '#F25F8C', '#8C5A3C'];
const COLOR_NAMES = ['mörklila', 'röd', 'orange', 'gul', 'grön', 'turkos', 'blå', 'lila', 'rosa', 'brun'];
const SIZES = [
  { value: 6, label: 'Tunn' },
  { value: 16, label: 'Mellan' },
  { value: 34, label: 'Tjock' },
];
type Tool = 'pen' | 'eraser' | 'star' | 'heart';
const PAPER = '#FFFDF8';
const DRAWING_KEY = 'game:malarladan-bild';

interface State {
  phase: Phase;
  color: string;
  size: number;
  tool: Tool;
  paused: boolean;
}

function stampPath(ctx: CanvasRenderingContext2D, tool: 'star' | 'heart', x: number, y: number, r: number) {
  ctx.beginPath();
  if (tool === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r : r * 0.45;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
  } else {
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.45);
    ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.5, y - r * 0.1, x, y + r * 0.9);
  }
  ctx.closePath();
  ctx.fill();
}

export default function MalarladanGame({ meta }: { meta: GameMeta }) {
  const [s, setS] = useSessionState<State>('malarladan', () => ({
    phase: 'intro',
    color: COLORS[1],
    size: 16,
    tool: 'pen',
    paused: false,
  }));
  const { navigate } = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const history = useRef<string[]>([]);
  const drawing = useRef<{ id: number; x: number; y: number } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [hasDrawing] = useState(() => !!readJSON<string | null>(DRAWING_KEY, null, 'session'));

  const ctx = () => canvasRef.current?.getContext('2d') ?? null;

  const paintImage = useCallback((url: string | null) => {
    const canvas = canvasRef.current;
    const c = ctx();
    if (!canvas || !c) return;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = PAPER;
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.restore();
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      const k = ctx();
      if (!k || !canvasRef.current) return;
      k.save();
      k.setTransform(1, 0, 0, 1, 0, 0);
      k.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      k.restore();
    };
    img.src = url;
  }, []);

  const snapshot = () => canvasRef.current?.toDataURL('image/png') ?? '';

  const persist = () => {
    const url = snapshot();
    if (url) writeJSON(DRAWING_KEY, url, 'session');
  };

  // Anpassa duken efter skärmen (även vid vridning) och behåll teckningen.
  useEffect(() => {
    if (s.phase !== 'playing') return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const prev = canvas.width ? snapshot() : readJSON<string | null>(DRAWING_KEY, null, 'session');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const c = ctx();
      if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintImage(prev);
    };
    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase, paintImage]);

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const pushHistory = () => {
    history.current.push(snapshot());
    if (history.current.length > 20) history.current.shift();
    setCanUndo(true);
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (s.paused || drawing.current) return;
    const c = ctx();
    if (!c) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pushHistory();
    const { x, y } = point(e);
    if (s.tool === 'star' || s.tool === 'heart') {
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = s.color;
      stampPath(c, s.tool, x, y, s.size * 1.4 + 14);
      play('pop');
      persist();
      return;
    }
    drawing.current = { id: e.pointerId, x, y };
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = s.tool === 'eraser' ? PAPER : s.color;
    c.fillStyle = c.strokeStyle;
    c.lineWidth = s.tool === 'eraser' ? s.size * 1.8 : s.size;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.arc(x, y, c.lineWidth / 2, 0, Math.PI * 2);
    c.fill();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drawing.current;
    if (!d || d.id !== e.pointerId) return;
    const c = ctx();
    if (!c) return;
    const events = 'getCoalescedEvents' in e.nativeEvent ? e.nativeEvent.getCoalescedEvents() : [];
    const pts = events.length ? events.map((ev) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    }) : [point(e)];
    c.beginPath();
    c.moveTo(d.x, d.y);
    for (const p of pts) c.lineTo(p.x, p.y);
    c.stroke();
    const last = pts[pts.length - 1];
    drawing.current = { ...d, x: last.x, y: last.y };
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawing.current?.id === e.pointerId) {
      drawing.current = null;
      persist();
    }
  };

  const undo = () => {
    const prev = history.current.pop();
    if (prev === undefined) return;
    play('tap');
    paintImage(prev);
    writeJSON(DRAWING_KEY, prev, 'session');
    setCanUndo(history.current.length > 0);
  };

  const clear = () => {
    pushHistory();
    paintImage(null);
    removeKey(DRAWING_KEY, 'session');
    setConfirmClear(false);
  };

  const finish = () => {
    const url = snapshot();
    persist();
    saveResult(meta.id, {});
    setFinalImage(url);
    play('win');
  };

  const save = async () => {
    const canvas = canvasRef.current;
    const url = finalImage ?? canvas?.toDataURL('image/png');
    if (!url) return;
    const name = `leklandet-teckning-${new Date().toISOString().slice(0, 10)}.png`;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], name, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: 'Min teckning från Leklandet' });
        return;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (s.phase === 'intro') {
    return (
      <GameIntro
        meta={meta}
        startLabel="Börja rita"
        resumable={hasDrawing}
        onResume={() => setS({ ...s, phase: 'playing' })}
        onStart={() => {
          removeKey(DRAWING_KEY, 'session');
          history.current = [];
          setS({ ...s, phase: 'playing' });
        }}
      />
    );
  }

  return (
    <div className="game-screen" style={{ ['--game' as string]: meta.color, ['--game-soft' as string]: meta.soft }}>
      <GameTopBar meta={meta} onPause={() => setS({ ...s, paused: true })} onRestart={clear} />
      <div className="draw-layout">
        <div className="draw-paper" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="draw-canvas"
            aria-label="Ritpapper. Rita med fingret."
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </div>
        <div className="draw-tools" role="toolbar" aria-label="Ritverktyg">
          <div className="tool-group colors">
            {COLORS.map((c, i) => (
              <button
                key={c}
                className="swatch"
                style={{ background: c }}
                aria-label={`Färg ${COLOR_NAMES[i]}`}
                aria-pressed={s.color === c && s.tool !== 'eraser'}
                onClick={() => {
                  play('tap');
                  setS({ ...s, color: c, tool: s.tool === 'eraser' ? 'pen' : s.tool });
                }}
              />
            ))}
          </div>
          <div className="tool-group">
            {SIZES.map((z) => (
              <button
                key={z.value}
                className="tool-btn"
                aria-label={`Pensel ${z.label.toLowerCase()}`}
                aria-pressed={s.size === z.value}
                onClick={() => setS({ ...s, size: z.value })}
              >
                <i style={{ width: Math.max(8, z.value * 0.8), height: Math.max(8, z.value * 0.8), background: s.tool === 'eraser' ? '#C9C3D9' : s.color }} />
              </button>
            ))}
          </div>
          <div className="tool-group">
            <button className="tool-btn" aria-label="Penna" aria-pressed={s.tool === 'pen'} onClick={() => setS({ ...s, tool: 'pen' })}>
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                <path d="M4 20l4-1L19 8l-3-3L5 16z" fill={s.color} stroke="#3B2F5C" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="tool-btn" aria-label="Stjärnstämpel" aria-pressed={s.tool === 'star'} onClick={() => setS({ ...s, tool: 'star' })}>
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                <path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.3 6.8 19l1-5.8-4.2-4.1 5.8-.8z" fill={s.color} />
              </svg>
            </button>
            <button className="tool-btn" aria-label="Hjärtstämpel" aria-pressed={s.tool === 'heart'} onClick={() => setS({ ...s, tool: 'heart' })}>
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                <path d="M12 20C5 15 3 11.5 3 9a4.3 4.3 0 0 1 9-1.8A4.3 4.3 0 0 1 21 9c0 2.5-2 6-9 11z" fill={s.color} />
              </svg>
            </button>
            <button className="tool-btn" aria-label="Suddgummi" aria-pressed={s.tool === 'eraser'} onClick={() => setS({ ...s, tool: 'eraser' })}>
              <IconEraser width={28} height={28} />
            </button>
          </div>
          <div className="tool-group">
            <button className="tool-btn" aria-label="Ångra" onClick={undo} disabled={!canUndo}>
              <IconUndo width={28} height={28} />
            </button>
            <button className="tool-btn" aria-label="Sudda bort allt" onClick={() => setConfirmClear(true)}>
              <IconTrash width={28} height={28} />
            </button>
            <button className="btn draw-done" onClick={finish}>
              <IconCheck /> Klar
            </button>
          </div>
        </div>
      </div>

      {confirmClear && (
        <Overlay label="Sudda bort allt?" onClose={() => setConfirmClear(false)}>
          <h2>Sudda bort allt?</h2>
          <p>Du kan ångra efteråt om du ändrar dig.</p>
          <div className="overlay-actions">
            <button className="btn btn-big" onClick={clear}>
              <IconTrash /> Ja, sudda
            </button>
            <button className="btn btn-big btn-soft" onClick={() => setConfirmClear(false)}>
              Nej
            </button>
          </div>
        </Overlay>
      )}

      {finalImage && (
        <Overlay label="Din teckning" onClose={() => setFinalImage(null)}>
          <h2>Vilket konstverk!</h2>
          <img className="final-drawing" src={finalImage} alt="Din teckning" />
          <div className="overlay-actions">
            <button className="btn btn-big" onClick={save}>
              <IconDownload /> Spara bilden
            </button>
            <button className="btn btn-big btn-soft" onClick={() => setFinalImage(null)}>
              Rita mer
            </button>
            <button
              className="btn btn-big btn-soft"
              onClick={() => {
                setFinalImage(null);
                clear();
                history.current = [];
                setCanUndo(false);
              }}
            >
              Ny teckning
            </button>
            <button className="btn btn-big btn-soft" onClick={() => navigate('/')}>
              <IconHome /> Fler spel
            </button>
          </div>
        </Overlay>
      )}

      {s.paused && <PauseOverlay onResume={() => setS({ ...s, paused: false })} onRestart={() => { setS({ ...s, paused: false }); clear(); }} />}
    </div>
  );
}
