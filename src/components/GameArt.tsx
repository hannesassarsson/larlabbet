import { PICTURES } from './pictures';

/** Omslagsillustrationer för spelkorten. viewBox 0 0 200 140. */
const INK = '#3B2F5C';

function Pic({ id, x, y, s, r = 0 }: { id: keyof typeof PICTURES; x: number; y: number; s: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r} ${s / 2} ${s / 2}) scale(${s / 100})`}>{PICTURES[id].art}</g>
  );
}

const Tile = ({ x, y, ch, fill, r = 0, w = 40 }: { x: number; y: number; ch: string; fill: string; r?: number; w?: number }) => (
  <g transform={`rotate(${r} ${x + w / 2} ${y + w / 2})`}>
    <rect x={x} y={y + 4} width={w} height={w} rx={w * 0.28} fill={INK} opacity=".15" />
    <rect x={x} y={y} width={w} height={w} rx={w * 0.28} fill={fill} />
    <text x={x + w / 2} y={y + w * 0.72} textAnchor="middle" fontSize={w * 0.62} fontWeight="800" fill={INK} fontFamily="ui-rounded, system-ui, sans-serif">
      {ch}
    </text>
  </g>
);

const arts: Record<string, () => JSX.Element> = {
  memory: () => (
    <g>
      <g transform="rotate(-10 62 72)">
        <rect x="30" y="28" width="64" height="84" rx="16" fill="#fff" />
        <Pic id="katt" x={36} y={44} s={52} />
      </g>
      <g transform="rotate(8 136 70)">
        <rect x="104" y="26" width="64" height="84" rx="16" fill="#4CAF65" />
        <rect x="112" y="34" width="48" height="68" rx="10" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="5 6" />
        <circle cx="136" cy="68" r="12" fill="#fff" opacity=".9" />
        <text x="136" y="75" textAnchor="middle" fontSize="20" fontWeight="800" fill="#4CAF65" fontFamily="ui-rounded, system-ui">?</text>
      </g>
    </g>
  ),
  bokstavsjakten: () => (
    <g>
      <Tile x={28} y={30} ch="B" fill="#FFD166" w={74} r={-6} />
      <g transform="rotate(6 140 70)">
        <circle cx="140" cy="70" r="40" fill="#fff" />
        <Pic id="boll" x={108} y={38} s={64} />
      </g>
      <circle cx="96" cy="112" r="5" fill="#fff" />
      <circle cx="110" cy="22" r="4" fill="#fff" />
    </g>
  ),
  stavning: () => (
    <g>
      <g transform="translate(70 4)">
        <circle cx="30" cy="34" r="30" fill="#fff" />
        <Pic id="sol" x={6} y={10} s={48} />
      </g>
      <Tile x={36} y={78} ch="S" fill="#fff" r={-6} />
      <Tile x={80} y={82} ch="O" fill="#FFD166" r={3} />
      <Tile x={124} y={78} ch="L" fill="#fff" r={8} />
    </g>
  ),
  matte: () => (
    <g>
      <rect x="22" y="28" width="156" height="66" rx="24" fill="#fff" />
      <text x="100" y="74" textAnchor="middle" fontSize="40" fontWeight="800" fill={INK} fontFamily="ui-rounded, system-ui">
        3 + 2
      </text>
      <g fill="#FF8A5B">
        <circle cx="54" cy="114" r="8" />
        <circle cx="76" cy="114" r="8" />
        <circle cx="98" cy="114" r="8" />
      </g>
      <g fill="#FFD166">
        <circle cx="128" cy="114" r="8" />
        <circle cx="150" cy="114" r="8" />
      </g>
    </g>
  ),
  monster: () => (
    <g>
      <circle cx="36" cy="64" r="18" fill="#F25F8C" />
      <rect x="64" y="46" width="36" height="36" rx="8" fill="#FFD166" />
      <circle cx="132" cy="64" r="18" fill="#F25F8C" />
      <rect x="152" y="40" width="40" height="48" rx="12" fill="#fff" stroke={INK} strokeWidth="3" strokeDasharray="6 5" />
      <text x="172" y="75" textAnchor="middle" fontSize="30" fontWeight="800" fill={INK} fontFamily="ui-rounded, system-ui">?</text>
      <g transform="translate(40 92)">
        <circle cx="24" cy="24" r="16" fill="none" stroke="#fff" strokeWidth="7" />
        <path d="M36 36l14 14" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
      </g>
    </g>
  ),
  santfalskt: () => (
    <g>
      <g transform="rotate(-8 60 66)">
        <rect x="24" y="32" width="72" height="68" rx="22" fill="#4CAF65" />
        <path d="M44 66l10 10 20-22" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="rotate(8 140 66)">
        <rect x="104" y="32" width="72" height="68" rx="22" fill="#EF4B4B" />
        <path d="M126 50l28 28M154 50l-28 28" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="116" r="14" fill="#fff" />
      <text x="100" y="123" textAnchor="middle" fontSize="20" fontWeight="800" fill={INK} fontFamily="ui-rounded, system-ui">?</text>
    </g>
  ),
  malarladan: () => (
    <g>
      <path d="M40 76c0-30 30-50 64-48 36 2 60 24 56 52-2 14-16 14-24 10s-14 2-14 10-8 18-28 16c-30-2-54-16-54-40z" fill="#fff" />
      <circle cx="76" cy="58" r="10" fill="#F25F8C" />
      <circle cx="104" cy="48" r="10" fill="#FFD166" />
      <circle cx="132" cy="58" r="10" fill="#5BC0EB" />
      <circle cx="70" cy="88" r="10" fill="#7BD389" />
      <circle cx="98" cy="96" r="8" fill="#FFDCE7" />
      <g transform="rotate(35 160 50)">
        <rect x="154" y="2" width="12" height="62" rx="6" fill="#A0674B" />
        <rect x="153" y="60" width="14" height="10" fill="#C9C3D9" />
        <path d="M153 70h14l-2 16q-5 6-10 0z" fill="#A78BFA" />
      </g>
    </g>
  ),
};

export function GameArt({ id, bg }: { id: string; bg: string }) {
  const Art = arts[id];
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true" className="game-art">
      <rect width="200" height="140" fill={bg} />
      <circle cx="180" cy="18" r="34" fill="#fff" opacity=".35" />
      <circle cx="14" cy="128" r="28" fill="#fff" opacity=".3" />
      {Art ? <Art /> : null}
    </svg>
  );
}
