import { Picture, PICTURES } from '../components/pictures';
import type { ShapeName, Visual } from '../curriculum/types';

const INK = '#3B2F5C';
const FONT = 'ui-rounded, system-ui, sans-serif';

function Clock({ h, m }: { h: number; m: number }) {
  const minAngle = m * 6;
  const hourAngle = ((h % 12) + m / 60) * 30;
  return (
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#fff" stroke={INK} strokeWidth="4" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1={i % 5 === 0 ? 9 : 8}
          x2="50"
          y2={i % 5 === 0 ? 15 : 11}
          stroke={INK}
          strokeWidth={i % 5 === 0 ? 2.4 : 1}
          strokeLinecap="round"
          transform={`rotate(${i * 6} 50 50)`}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 * Math.PI) / 180;
        return (
          <text key={i} x={50 + 29 * Math.sin(a)} y={50 - 29 * Math.cos(a) + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={INK} fontFamily={FONT}>
            {i + 1}
          </text>
        );
      })}
      <line x1="50" y1="50" x2="50" y2="27" stroke={INK} strokeWidth="5" strokeLinecap="round" transform={`rotate(${hourAngle} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="14" stroke="#EF4B4B" strokeWidth="3" strokeLinecap="round" transform={`rotate(${minAngle} 50 50)`} />
      <circle cx="50" cy="50" r="4" fill={INK} />
    </svg>
  );
}

function Fraction({ num, den }: { num: number; den: number }) {
  const r = 40;
  const slices = Array.from({ length: den }, (_, i) => {
    const a0 = (i / den) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / den) * Math.PI * 2 - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M50 50 L${50 + r * Math.cos(a0)} ${50 + r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${50 + r * Math.cos(a1)} ${50 + r * Math.sin(a1)}Z`;
    return <path key={i} d={d} fill={i < num ? '#FF8A5B' : '#fff'} stroke={INK} strokeWidth="3" strokeLinejoin="round" />;
  });
  return <svg viewBox="0 0 100 100">{slices}</svg>;
}

function Shape({ name }: { name: ShapeName }) {
  const fill = '#5BC0EB';
  const dark = '#3A9BC7';
  const light = '#A7DDF4';
  const s = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const };
  const art: Record<ShapeName, JSX.Element> = {
    cirkel: <circle cx="50" cy="50" r="36" fill={fill} {...s} />,
    kvadrat: <rect x="16" y="16" width="68" height="68" fill={fill} {...s} />,
    rektangel: <rect x="8" y="28" width="84" height="44" fill={fill} {...s} />,
    triangel: <path d="M50 12 88 84H12z" fill={fill} {...s} />,
    klot: (
      <g>
        <circle cx="50" cy="50" r="36" fill={fill} {...s} />
        <ellipse cx="50" cy="50" rx="36" ry="10" fill="none" stroke={dark} strokeWidth="2" strokeDasharray="4 4" />
        <ellipse cx="38" cy="36" rx="9" ry="6" fill="#fff" opacity=".5" />
      </g>
    ),
    kub: (
      <g>
        <path d="M22 36h44v44H22z" fill={fill} {...s} />
        <path d="M22 36l16-16h44L66 36z" fill={light} {...s} />
        <path d="M66 36l16-16v44L66 80z" fill={dark} {...s} />
      </g>
    ),
    cylinder: (
      <g>
        <path d="M24 26v48a26 9 0 0 0 52 0V26" fill={fill} {...s} />
        <ellipse cx="50" cy="26" rx="26" ry="9" fill={light} {...s} />
      </g>
    ),
    kon: (
      <g>
        <path d="M50 12 76 76a26 9 0 0 1-52 0z" fill={fill} {...s} />
        <path d="M24 76a26 9 0 0 0 52 0" fill="none" stroke={INK} strokeWidth="3" />
      </g>
    ),
    rätblock: (
      <g>
        <path d="M12 44h56v36H12z" fill={fill} {...s} />
        <path d="M12 44l18-14h56L68 44z" fill={light} {...s} />
        <path d="M68 44l18-14v36L68 80z" fill={dark} {...s} />
      </g>
    ),
  };
  return <svg viewBox="0 0 100 100">{art[name]}</svg>;
}

function Base10({ tens, ones }: { tens: number; ones: number }) {
  const w = 16 + tens * 10 + (ones ? 22 : 0);
  return (
    <svg viewBox={`0 0 ${Math.max(w, 60)} 104`}>
      {Array.from({ length: tens }, (_, i) => (
        <g key={i}>
          {Array.from({ length: 10 }, (_, j) => (
            <rect key={j} x={8 + i * 10} y={4 + j * 9.6} width="8" height="9" rx="1.5" fill="#5BC0EB" stroke={INK} strokeWidth="1" />
          ))}
        </g>
      ))}
      {Array.from({ length: ones }, (_, j) => (
        <rect key={j} x={12 + tens * 10 + (j % 2) * 10} y={95 - Math.floor(j / 2) * 10} width="8" height="8" rx="1.5" fill="#FFC53D" stroke={INK} strokeWidth="1" />
      ))}
    </svg>
  );
}

function Thermo({ value }: { value: number }) {
  // Skala −10 till +10. Streck för varje grad, siffror för varannan.
  const top = 10;
  const bottom = 118;
  const y = (v: number) => bottom - ((v + 10) / 20) * (bottom - top);
  return (
    <svg viewBox="0 0 100 140">
      <rect x="30" y="4" width="18" height={bottom + 4} rx="9" fill="#fff" stroke={INK} strokeWidth="3" />
      <circle cx="39" cy="126" r="11" fill="#EF4B4B" stroke={INK} strokeWidth="3" />
      <rect x="34.5" y={y(value)} width="9" height={126 - y(value)} fill="#EF4B4B" />
      {Array.from({ length: 21 }, (_, i) => {
        const v = -10 + i;
        const major = v % 2 === 0;
        return (
          <g key={v}>
            <line x1="48" y1={y(v)} x2={v === 0 ? 60 : major ? 56 : 52} y2={y(v)} stroke={INK} strokeWidth={v === 0 ? 2.4 : major ? 1.6 : 1} />
            {major && (
              <text x="62" y={y(v) + 3} fontSize="8" fontWeight={v === 0 ? 900 : 700} fill={INK} fontFamily={FONT}>
                {v > 0 ? `+${v}` : v === 0 ? '0' : `−${-v}`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Rect({ w, h }: { w: number; h: number }) {
  const k = Math.min(70 / w, 50 / h);
  const W = w * k;
  const H = h * k;
  const x = (100 - W) / 2;
  const y = (80 - H) / 2 + 6;
  return (
    <svg viewBox="0 0 100 92">
      {Array.from({ length: w - 1 }, (_, i) => (
        <line key={'v' + i} x1={x + (i + 1) * k} y1={y} x2={x + (i + 1) * k} y2={y + H} stroke="#A7DDF4" strokeWidth="1" />
      ))}
      {Array.from({ length: h - 1 }, (_, i) => (
        <line key={'h' + i} x1={x} y1={y + (i + 1) * k} x2={x + W} y2={y + (i + 1) * k} stroke="#A7DDF4" strokeWidth="1" />
      ))}
      <rect x={x} y={y} width={W} height={H} fill="none" stroke={INK} strokeWidth="2.5" />
      <text x="50" y={y + H + 10} textAnchor="middle" fontSize="8" fontWeight="800" fill={INK} fontFamily={FONT}>
        {w} cm
      </text>
      <text x={x - 3} y={y + H / 2 + 3} textAnchor="end" fontSize="8" fontWeight="800" fill={INK} fontFamily={FONT}>
        {h} cm
      </text>
    </svg>
  );
}

function Angle({ deg }: { deg: number }) {
  const ox = 22;
  const oy = 74;
  const L = 62;
  const a = (deg * Math.PI) / 180;
  const ex = ox + L * Math.cos(a);
  const ey = oy - L * Math.sin(a);
  const r = 16;
  return (
    <svg viewBox="0 0 100 90">
      <path d={`M${ox + r} ${oy} A${r} ${r} 0 0 0 ${ox + r * Math.cos(a)} ${oy - r * Math.sin(a)}`} fill="none" stroke="#FF8A5B" strokeWidth="3" />
      {deg === 90 && <path d={`M${ox + 10} ${oy}v-10h-10`} fill="none" stroke="#FF8A5B" strokeWidth="2.5" />}
      <line x1={ox} y1={oy} x2={ox + L + 10} y2={oy} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <line x1={ox} y1={oy} x2={ex} y2={ey} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <circle cx={ox} cy={oy} r="3.5" fill={INK} />
    </svg>
  );
}

function Coord({ x, y }: { x: number; y: number }) {
  const s = 12;
  const ox = 14;
  const oy = 88;
  return (
    <svg viewBox="0 0 100 100">
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i}>
          <line x1={ox + i * s} y1={oy} x2={ox + i * s} y2={oy - 6 * s} stroke="#E6DDF0" strokeWidth="1" />
          <line x1={ox} y1={oy - i * s} x2={ox + 6 * s} y2={oy - i * s} stroke="#E6DDF0" strokeWidth="1" />
          <text x={ox + i * s} y={oy + 9} textAnchor="middle" fontSize="6.5" fontWeight="700" fill={INK} fontFamily={FONT}>
            {i}
          </text>
          {i > 0 && (
            <text x={ox - 5} y={oy - i * s + 2.5} textAnchor="middle" fontSize="6.5" fontWeight="700" fill={INK} fontFamily={FONT}>
              {i}
            </text>
          )}
        </g>
      ))}
      <line x1={ox} y1={oy} x2={ox + 6 * s + 6} y2={oy} stroke={INK} strokeWidth="2" />
      <line x1={ox} y1={oy} x2={ox} y2={oy - 6 * s - 6} stroke={INK} strokeWidth="2" />
      <text x={ox + 6 * s + 8} y={oy + 3} fontSize="7" fontWeight="800" fill={INK} fontFamily={FONT}>
        x
      </text>
      <text x={ox - 2} y={oy - 6 * s - 8} fontSize="7" fontWeight="800" fill={INK} fontFamily={FONT}>
        y
      </text>
      <circle cx={ox + x * s} cy={oy - y * s} r="4.5" fill="#F25F8C" stroke={INK} strokeWidth="1.5" />
    </svg>
  );
}

function Marbles({ colors }: { colors: { color: string; n: number }[] }) {
  const balls = colors.flatMap((c) => Array.from({ length: c.n }, () => c.color));
  // Blanda deterministiskt så att färgerna inte ligger i klump.
  const mixed = balls.map((c, i) => ({ c, k: (i * 7919) % 97 })).sort((a, b) => a.k - b.k);
  return (
    <svg viewBox="0 0 100 100">
      <path d="M20 30h60l-6 60H26z" fill="#F6F1FB" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M16 30h68" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      {mixed.map((b, i) => (
        <circle key={i} cx={32 + (i % 5) * 9} cy={82 - Math.floor(i / 5) * 9} r="4.2" fill={b.c} stroke={INK} strokeWidth="1" />
      ))}
    </svg>
  );
}

function Count({ id, n }: { id: keyof typeof PICTURES; n: number }) {
  const cols = n <= 4 ? n : n <= 9 ? 3 : n <= 12 ? 4 : 5;
  const rows = Math.ceil(n / cols);
  const cell = 100 / Math.max(cols, rows);
  return (
    <svg viewBox="0 0 100 100">
      {Array.from({ length: n }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const ox = (100 - cols * cell) / 2;
        const oy = (100 - rows * cell) / 2;
        return (
          <g key={i} transform={`translate(${ox + c * cell + cell * 0.08} ${oy + r * cell + cell * 0.08}) scale(${(cell * 0.84) / 100})`}>
            {PICTURES[id].art}
          </g>
        );
      })}
    </svg>
  );
}

export function VisualView({ v }: { v: Visual }) {
  switch (v.t) {
    case 'pic':
      return <Picture id={v.id} />;
    case 'count':
      return <Count id={v.id} n={v.n} />;
    case 'dots':
      return <Count id="boll" n={v.n} />;
    case 'clock':
      return <Clock h={v.h} m={v.m} />;
    case 'fraction':
      return <Fraction num={v.num} den={v.den} />;
    case 'shape':
      return <Shape name={v.name} />;
    case 'base10':
      return <Base10 tens={v.tens} ones={v.ones} />;
    case 'thermo':
      return <Thermo value={v.value} />;
    case 'rect':
      return <Rect w={v.w} h={v.h} />;
    case 'angle':
      return <Angle deg={v.deg} />;
    case 'coord':
      return <Coord x={v.x} y={v.y} />;
    case 'marbles':
      return <Marbles colors={v.colors} />;
  }
}
