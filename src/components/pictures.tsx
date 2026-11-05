import type { ReactElement } from 'react';

/**
 * Leklandets bildbibliotek. Alla bilder är handritade SVG i samma stil:
 * platta färger, rundade former, mörklila detaljer (#3B2F5C) och en mjuk
 * bakgrundsfärg. viewBox är alltid 0 0 100 100.
 */
const INK = '#3B2F5C';

const Eyes = ({ y = 48, dx = 9, cx = 50, r = 3.6 }: { y?: number; dx?: number; cx?: number; r?: number }) => (
  <g fill={INK}>
    <circle cx={cx - dx} cy={y} r={r} />
    <circle cx={cx + dx} cy={y} r={r} />
    <circle cx={cx - dx + 1.2} cy={y - 1.2} r={r * 0.32} fill="#fff" />
    <circle cx={cx + dx + 1.2} cy={y - 1.2} r={r * 0.32} fill="#fff" />
  </g>
);

const Smile = ({ y = 58, w = 7, cx = 50 }: { y?: number; w?: number; cx?: number }) => (
  <path d={`M${cx - w} ${y}q${w} ${w * 0.8} ${w * 2} 0`} stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
);

const Cheeks = ({ y = 56, dx = 15, cx = 50 }: { y?: number; dx?: number; cx?: number }) => (
  <g fill="#FF8FA8" opacity=".55">
    <ellipse cx={cx - dx} cy={y} rx="4.5" ry="3" />
    <ellipse cx={cx + dx} cy={y} rx="4.5" ry="3" />
  </g>
);

export interface PictureDef {
  word: string;
  bg: string;
  art: ReactElement;
}

export const PICTURES = {
  sol: {
    word: 'sol',
    bg: '#FFF1C9',
    art: (
      <g>
        <g fill="#FFB830">
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="46" y="8" width="8" height="16" rx="4" transform={`rotate(${i * 45} 50 50)`} />
          ))}
        </g>
        <circle cx="50" cy="50" r="24" fill="#FFD166" />
        <Eyes y={47} dx={8} />
        <Cheeks y={55} dx={13} />
        <Smile y={56} w={6} />
      </g>
    ),
  },
  hus: {
    word: 'hus',
    bg: '#D8F0FB',
    art: (
      <g>
        <rect x="64" y="22" width="9" height="18" rx="2" fill="#A35D4F" />
        <rect x="22" y="46" width="56" height="40" rx="5" fill="#FF8A5B" />
        <path d="M14 50 50 18l36 32z" fill="#F25F8C" strokeLinejoin="round" stroke="#F25F8C" strokeWidth="5" />
        <rect x="43" y="62" width="15" height="24" rx="4" fill={INK} />
        <circle cx="54" cy="75" r="1.6" fill="#FFD166" />
        <rect x="27" y="55" width="12" height="12" rx="3" fill="#fff" />
        <rect x="63" y="55" width="11" height="12" rx="3" fill="#fff" />
        <rect x="10" y="85" width="80" height="5" rx="2.5" fill="#7BD389" />
      </g>
    ),
  },
  bil: {
    word: 'bil',
    bg: '#FFE3D6',
    art: (
      <g>
        <path d="M30 44h30c5 0 8 2 11 6l7 8h6c4 0 7 3 7 7v7H9v-8c0-4 3-7 7-7h6l4-8c1-3 2-5 4-5z" fill="#5BC0EB" />
        <path d="M32 48h11v10H27zM48 48h12l7 10H48z" fill="#fff" />
        <circle cx="29" cy="73" r="10" fill={INK} />
        <circle cx="29" cy="73" r="4" fill="#DDD6EE" />
        <circle cx="71" cy="73" r="10" fill={INK} />
        <circle cx="71" cy="73" r="4" fill="#DDD6EE" />
        <rect x="84" y="61" width="5" height="5" rx="2" fill="#FFD166" />
      </g>
    ),
  },
  katt: {
    word: 'katt',
    bg: '#ECE5FF',
    art: (
      <g>
        <path d="M24 46 26 16l20 16zM76 46 74 16 54 32z" fill="#FF9E5E" />
        <path d="M29 36 30 24l9 8zM71 36 70 24l-9 8z" fill="#FFC8B0" />
        <ellipse cx="50" cy="56" rx="30" ry="27" fill="#FFAE6E" />
        <path d="M50 30v10M42 31l2 8M58 31l-2 8" stroke="#F08A44" strokeWidth="3" strokeLinecap="round" />
        <Eyes y={53} dx={11} r={4} />
        <path d="M46 61h8l-4 4z" fill="#F25F8C" />
        <path d="M50 65q-4 5-8 2M50 65q4 5 8 2" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M30 62 14 60M30 66l-15 4M70 62l16-2M70 66l15 4" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  },
  hund: {
    word: 'hund',
    bg: '#DCF5DF',
    art: (
      <g>
        <ellipse cx="50" cy="52" rx="27" ry="28" fill="#D99A68" />
        <ellipse cx="23" cy="48" rx="10" ry="20" fill="#8C5A3C" transform="rotate(14 23 48)" />
        <ellipse cx="77" cy="48" rx="10" ry="20" fill="#8C5A3C" transform="rotate(-14 77 48)" />
        <ellipse cx="50" cy="66" rx="16" ry="12" fill="#F3D3B2" />
        <circle cx="62" cy="42" r="7" fill="#8C5A3C" opacity=".5" />
        <Eyes y={46} dx={10} r={4} />
        <ellipse cx="50" cy="60" rx="6" ry="4.5" fill={INK} />
        <path d="M50 64v4M44 69q6 5 12 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M47 71q3 7 6 0" fill="#F25F8C" />
      </g>
    ),
  },
  fisk: {
    word: 'fisk',
    bg: '#D8F0FB',
    art: (
      <g>
        <path d="M70 50 92 32v36z" fill="#FF8A5B" />
        <ellipse cx="46" cy="50" rx="32" ry="22" fill="#FFB347" />
        <path d="M40 29q8-10 18 0z" fill="#FF8A5B" />
        <path d="M50 34q-8 16 0 32M60 37q-6 13 0 26" stroke="#FF8A5B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="28" cy="46" r="5" fill={INK} />
        <circle cx="29.5" cy="44.5" r="1.6" fill="#fff" />
        <path d="M17 56q4 3 8 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <g fill="#fff" opacity=".8">
          <circle cx="16" cy="26" r="3" />
          <circle cx="10" cy="16" r="2" />
        </g>
      </g>
    ),
  },
  boll: {
    word: 'boll',
    bg: '#FFF1C9',
    art: (
      <g>
        <ellipse cx="50" cy="88" rx="24" ry="4" fill={INK} opacity=".12" />
        <circle cx="50" cy="50" r="33" fill="#F25F8C" />
        <path d="M18 44q32 12 64 0M22 66q28-8 56 0" stroke="#FFD166" strokeWidth="7" fill="none" />
        <path d="M50 17q-14 33 0 66" stroke="#fff" strokeWidth="6" fill="none" />
        <ellipse cx="36" cy="30" rx="7" ry="4" fill="#fff" opacity=".5" transform="rotate(-30 36 30)" />
      </g>
    ),
  },
  träd: {
    word: 'träd',
    bg: '#D8F0FB',
    art: (
      <g>
        <rect x="44" y="56" width="12" height="32" rx="4" fill="#A0674B" />
        <circle cx="50" cy="38" r="24" fill="#5DBB6F" />
        <circle cx="32" cy="50" r="16" fill="#7BD389" />
        <circle cx="68" cy="50" r="16" fill="#7BD389" />
        <circle cx="50" cy="28" r="16" fill="#7BD389" />
        <g fill="#F25F8C">
          <circle cx="38" cy="36" r="3.5" />
          <circle cx="62" cy="30" r="3.5" />
          <circle cx="66" cy="52" r="3.5" />
          <circle cx="34" cy="55" r="3.5" />
        </g>
        <rect x="18" y="86" width="64" height="5" rx="2.5" fill="#7BD389" />
      </g>
    ),
  },
  blomma: {
    word: 'blomma',
    bg: '#DCF5DF',
    art: (
      <g>
        <path d="M50 52v38" stroke="#4CAF65" strokeWidth="5" strokeLinecap="round" />
        <path d="M50 76q-16-4-18-16 14 0 18 16zM50 70q14-2 18-14-14 0-18 14z" fill="#7BD389" />
        <g fill="#F25F8C">
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse key={i} cx="50" cy="22" rx="9" ry="13" transform={`rotate(${i * 60} 50 36)`} />
          ))}
        </g>
        <circle cx="50" cy="36" r="10" fill="#FFD166" />
        <Eyes y={35} dx={4} r={1.8} />
        <Smile y={38.5} w={2.5} />
      </g>
    ),
  },
  äpple: {
    word: 'äpple',
    bg: '#DCF5DF',
    art: (
      <g>
        <path d="M50 30c-6-6-28-8-30 16-2 22 14 40 24 40 3 0 4-2 6-2s3 2 6 2c10 0 26-18 24-40-2-24-24-22-30-16z" fill="#EF4B4B" />
        <path d="M50 30q0-10 6-16" stroke="#8C5A3C" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M54 24q10-12 22-6-8 12-22 6z" fill="#7BD389" />
        <ellipse cx="34" cy="44" rx="5" ry="9" fill="#fff" opacity=".35" transform="rotate(20 34 44)" />
      </g>
    ),
  },
  banan: {
    word: 'banan',
    bg: '#D8F0FB',
    art: (
      <g>
        <path d="M22 30c-6 26 10 52 46 50 10 0 14-6 8-8-30 4-44-16-44-40 0-6-8-8-10-2z" fill="#FFD166" />
        <path d="M26 36c2 20 16 36 40 38" stroke="#F0B43C" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M22 30l-2-8 6 2z" fill="#8C5A3C" strokeLinejoin="round" stroke="#8C5A3C" strokeWidth="2" />
      </g>
    ),
  },
  mus: {
    word: 'mus',
    bg: '#FFF1C9',
    art: (
      <g>
        <circle cx="26" cy="32" r="16" fill="#B9B4C9" />
        <circle cx="74" cy="32" r="16" fill="#B9B4C9" />
        <circle cx="26" cy="32" r="9" fill="#FFC1D1" />
        <circle cx="74" cy="32" r="9" fill="#FFC1D1" />
        <ellipse cx="50" cy="58" rx="26" ry="24" fill="#CFCADC" />
        <Eyes y={54} dx={10} r={4} />
        <Cheeks y={63} dx={16} />
        <circle cx="50" cy="64" r="4.5" fill="#F25F8C" />
        <path d="M34 66 18 64M34 70l-14 4M66 66l16-2M66 70l14 4" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  },
  ko: {
    word: 'ko',
    bg: '#DCF5DF',
    art: (
      <g>
        <path d="M30 30q-10-6-12-16M70 30q10-6 12-16" stroke="#E9D9B8" strokeWidth="6" strokeLinecap="round" fill="none" />
        <ellipse cx="18" cy="40" rx="11" ry="6" fill="#fff" stroke="#E6DDF0" strokeWidth="2" />
        <ellipse cx="82" cy="40" rx="11" ry="6" fill="#fff" stroke="#E6DDF0" strokeWidth="2" />
        <ellipse cx="50" cy="48" rx="26" ry="28" fill="#fff" stroke="#E6DDF0" strokeWidth="2" />
        <path d="M30 30q10 4 8 14-8 2-12-6zM62 26q10 0 12 12-10 2-12-12z" fill={INK} />
        <Eyes y={46} dx={10} r={3.8} />
        <ellipse cx="50" cy="68" rx="20" ry="13" fill="#FFB3C7" />
        <ellipse cx="43" cy="68" rx="3" ry="4" fill="#E2748F" />
        <ellipse cx="57" cy="68" rx="3" ry="4" fill="#E2748F" />
      </g>
    ),
  },
  gris: {
    word: 'gris',
    bg: '#FFF1C9',
    art: (
      <g>
        <path d="M24 38 22 16l20 12zM76 38l2-22-20 12z" fill="#FF94B4" />
        <circle cx="50" cy="54" r="30" fill="#FFB3C7" />
        <Eyes y={46} dx={12} r={4} />
        <Cheeks y={58} dx={21} />
        <ellipse cx="50" cy="62" rx="14" ry="10" fill="#FF8FB0" />
        <ellipse cx="45" cy="62" rx="3" ry="4" fill="#D35A80" />
        <ellipse cx="55" cy="62" rx="3" ry="4" fill="#D35A80" />
        <path d="M44 76q6 4 12 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  anka: {
    word: 'anka',
    bg: '#D8F0FB',
    art: (
      <g>
        <path d="M12 78q38 10 76 0" stroke="#5BC0EB" strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx="54" cy="62" rx="30" ry="18" fill="#FFD166" />
        <path d="M84 56q8-6 6 6z" fill="#FFD166" />
        <circle cx="38" cy="36" r="17" fill="#FFD166" />
        <path d="M50 60q12 10 22-2" stroke="#F0B43C" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M14 38q4-8 12-4l2 6q-8 4-14-2z" fill="#FF8A5B" />
        <circle cx="38" cy="32" r="3.8" fill={INK} />
        <circle cx="39.2" cy="30.8" r="1.2" fill="#fff" />
      </g>
    ),
  },
  uggla: {
    word: 'uggla',
    bg: '#ECE5FF',
    art: (
      <g>
        <path d="M26 30 22 12l16 10zM74 30l4-18-16 10z" fill="#8C5A3C" />
        <ellipse cx="50" cy="54" rx="30" ry="34" fill="#A0674B" />
        <ellipse cx="50" cy="66" rx="18" ry="18" fill="#E9C9A5" />
        <path d="M42 62q3 3 6 0M52 70q3 3 6 0M42 74q3 3 6 0" stroke="#C49A72" strokeWidth="2" fill="none" />
        <circle cx="38" cy="40" r="12" fill="#fff" />
        <circle cx="62" cy="40" r="12" fill="#fff" />
        <circle cx="39" cy="41" r="6" fill={INK} />
        <circle cx="61" cy="41" r="6" fill={INK} />
        <circle cx="41" cy="39" r="2" fill="#fff" />
        <circle cx="63" cy="39" r="2" fill="#fff" />
        <path d="M46 50h8l-4 7z" fill="#FFB347" />
        <path d="M40 87l-4 5M46 88v5M54 88v5M60 87l4 5" stroke="#FFB347" strokeWidth="3" strokeLinecap="round" />
      </g>
    ),
  },
  orm: {
    word: 'orm',
    bg: '#FFF1C9',
    art: (
      <g>
        <path d="M16 78q14-18 28 0t28-4q10-6 6-20" stroke="#4CAF65" strokeWidth="15" fill="none" strokeLinecap="round" />
        <path d="M16 78q14-18 28 0t28-4q10-6 6-20" stroke="#7BD389" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="2 9" />
        <ellipse cx="74" cy="40" rx="16" ry="13" fill="#4CAF65" />
        <circle cx="68" cy="36" r="3.4" fill={INK} />
        <circle cx="80" cy="36" r="3.4" fill={INK} />
        <circle cx="69" cy="35" r="1.1" fill="#fff" />
        <circle cx="81" cy="35" r="1.1" fill="#fff" />
        <path d="M74 52v8m0 0-3 4m3-4 3 4" stroke="#F25F8C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M68 46q6 4 12 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  måne: {
    word: 'måne',
    bg: '#3B2F5C',
    art: (
      <g>
        <path d="M60 14a36 36 0 1 0 24 56A30 30 0 0 1 60 14z" fill="#FFE08A" />
        <circle cx="38" cy="54" r="3.4" fill={INK} />
        <path d="M34 64q6 5 12 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <g fill="#fff">
          <circle cx="78" cy="24" r="2" />
          <circle cx="86" cy="44" r="1.5" />
          <circle cx="70" cy="86" r="1.6" />
          <circle cx="14" cy="22" r="1.6" />
        </g>
      </g>
    ),
  },
  stjärna: {
    word: 'stjärna',
    bg: '#ECE5FF',
    art: (
      <g>
        <path
          d="M50 10l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3z"
          fill="#FFD166"
          stroke="#FFD166"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <Eyes y={48} dx={8} r={3.4} />
        <Smile y={56} w={5} />
      </g>
    ),
  },
  båt: {
    word: 'båt',
    bg: '#D8F0FB',
    art: (
      <g>
        <path d="M50 14v50" stroke="#8C5A3C" strokeWidth="4" strokeLinecap="round" />
        <path d="M54 18q26 18 24 40H54z" fill="#fff" />
        <path d="M46 26q-20 14-20 32h20z" fill="#FFD166" />
        <path d="M14 62h72l-10 18H24z" fill="#F25F8C" strokeLinejoin="round" stroke="#F25F8C" strokeWidth="4" />
        <circle cx="38" cy="70" r="3" fill="#fff" />
        <circle cx="50" cy="70" r="3" fill="#fff" />
        <circle cx="62" cy="70" r="3" fill="#fff" />
        <path d="M6 88q8-6 16 0t16 0 16 0 16 0 16 0 16 0" stroke="#5BC0EB" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  tåg: {
    word: 'tåg',
    bg: '#FFF1C9',
    art: (
      <g>
        <circle cx="30" cy="18" r="6" fill="#E6DDF0" />
        <circle cx="22" cy="10" r="4" fill="#E6DDF0" />
        <rect x="26" y="26" width="10" height="16" rx="2" fill={INK} />
        <rect x="16" y="40" width="44" height="30" rx="6" fill="#EF4B4B" />
        <rect x="52" y="24" width="32" height="46" rx="6" fill="#5BC0EB" />
        <rect x="58" y="31" width="20" height="14" rx="3" fill="#fff" />
        <rect x="10" y="66" width="80" height="6" rx="3" fill={INK} />
        <circle cx="28" cy="78" r="9" fill={INK} />
        <circle cx="28" cy="78" r="3.5" fill="#DDD6EE" />
        <circle cx="70" cy="78" r="9" fill={INK} />
        <circle cx="70" cy="78" r="3.5" fill="#DDD6EE" />
        <circle cx="22" cy="54" r="3" fill="#FFD166" />
      </g>
    ),
  },
  glass: {
    word: 'glass',
    bg: '#D8F0FB',
    art: (
      <g>
        <path d="M30 52h40L50 92z" fill="#F0B46A" strokeLinejoin="round" stroke="#F0B46A" strokeWidth="4" />
        <path d="M36 60l22 18M44 54l20 16M64 60 42 78M56 54 36 70" stroke="#D99A4E" strokeWidth="2" />
        <circle cx="50" cy="30" r="15" fill="#7BD389" />
        <circle cx="38" cy="46" r="13" fill="#FFB3C7" />
        <circle cx="62" cy="46" r="13" fill="#FFE08A" />
        <circle cx="50" cy="12" r="5" fill="#EF4B4B" />
        <g fill="#fff" opacity=".6">
          <circle cx="44" cy="26" r="2.5" />
          <circle cx="34" cy="42" r="2" />
        </g>
      </g>
    ),
  },
  kaka: {
    word: 'kaka',
    bg: '#ECE5FF',
    art: (
      <g>
        <circle cx="50" cy="52" r="34" fill="#E3A65E" />
        <circle cx="50" cy="52" r="34" fill="none" stroke="#C98840" strokeWidth="4" />
        <g fill="#6B4026">
          <ellipse cx="36" cy="38" rx="5" ry="4" />
          <ellipse cx="62" cy="36" rx="4" ry="3.5" />
          <ellipse cx="66" cy="60" rx="5" ry="4" />
          <ellipse cx="40" cy="66" rx="4.5" ry="3.5" />
          <ellipse cx="52" cy="52" rx="3.5" ry="3" />
          <ellipse cx="30" cy="54" rx="3" ry="2.5" />
        </g>
      </g>
    ),
  },
  nyckel: {
    word: 'nyckel',
    bg: '#D8F0FB',
    art: (
      <g>
        <circle cx="32" cy="50" r="18" fill="#FFC53D" />
        <circle cx="32" cy="50" r="7" fill="#D8F0FB" />
        <rect x="46" y="45" width="42" height="10" rx="4" fill="#FFC53D" />
        <rect x="70" y="53" width="7" height="14" rx="2" fill="#FFC53D" />
        <rect x="80" y="53" width="7" height="10" rx="2" fill="#FFC53D" />
      </g>
    ),
  },
  lampa: {
    word: 'lampa',
    bg: '#ECE5FF',
    art: (
      <g>
        <path d="M30 18h40l12 34H18z" fill="#FFD166" strokeLinejoin="round" stroke="#FFD166" strokeWidth="5" />
        <path d="M18 52h64" stroke="#F0B43C" strokeWidth="5" strokeLinecap="round" />
        <rect x="46" y="54" width="8" height="24" fill="#8C5A3C" />
        <ellipse cx="50" cy="84" rx="20" ry="6" fill="#5BC0EB" />
        <path d="M50 58v8" stroke={INK} strokeWidth="2" />
      </g>
    ),
  },
  ägg: {
    word: 'ägg',
    bg: '#FFE3D6',
    art: (
      <g>
        <ellipse cx="50" cy="86" rx="20" ry="4" fill={INK} opacity=".12" />
        <path d="M50 14c-18 0-28 30-28 44s12 26 28 26 28-12 28-26-10-44-28-44z" fill="#FFFDF7" />
        <path d="M50 14c-18 0-28 30-28 44s12 26 28 26 28-12 28-26-10-44-28-44z" fill="none" stroke="#F1DCC2" strokeWidth="3" />
        <ellipse cx="40" cy="40" rx="5" ry="9" fill="#F1DCC2" opacity=".6" transform="rotate(20 40 40)" />
      </g>
    ),
  },
  ö: {
    word: 'ö',
    bg: '#D8F0FB',
    art: (
      <g>
        <ellipse cx="50" cy="80" rx="42" ry="10" fill="#5BC0EB" />
        <path d="M20 78q30-24 60 0z" fill="#FFE08A" />
        <path d="M52 72q-2-30 6-44" stroke="#A0674B" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M58 28q-20-6-28 6 14-4 28-6zM58 28q18-8 28 4-14-2-28-4zM58 28q-8 10-6 22 6-12 6-22zM58 28q14 4 16 16-8-8-16-16z" fill="#4CAF65" />
        <circle cx="56" cy="32" r="3" fill="#8C5A3C" />
        <circle cx="62" cy="31" r="3" fill="#8C5A3C" />
      </g>
    ),
  },
  apa: {
    word: 'apa',
    bg: '#DCF5DF',
    art: (
      <g>
        <circle cx="20" cy="48" r="11" fill="#9A6646" />
        <circle cx="80" cy="48" r="11" fill="#9A6646" />
        <circle cx="20" cy="48" r="6" fill="#F3C9A0" />
        <circle cx="80" cy="48" r="6" fill="#F3C9A0" />
        <circle cx="50" cy="50" r="30" fill="#9A6646" />
        <path d="M50 38c-8-8-22-6-22 6 0 6 4 8 4 12-2 14 8 22 18 22s20-8 18-22c0-4 4-6 4-12 0-12-14-14-22-6z" fill="#F3C9A0" />
        <Eyes y={46} dx={9} r={3.8} />
        <ellipse cx="46" cy="58" rx="1.6" ry="2" fill={INK} />
        <ellipse cx="54" cy="58" rx="1.6" ry="2" fill={INK} />
        <path d="M40 65q10 8 20 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  lejon: {
    word: 'lejon',
    bg: '#FFE3D6',
    art: (
      <g>
        <g fill="#E8833A">
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={50 + 30 * Math.cos((i * Math.PI) / 6)} cy={52 + 30 * Math.sin((i * Math.PI) / 6)} r="13" />
          ))}
        </g>
        <circle cx="50" cy="52" r="30" fill="#E8833A" />
        <circle cx="50" cy="52" r="24" fill="#FFC56E" />
        <circle cx="34" cy="32" r="6" fill="#FFC56E" />
        <circle cx="66" cy="32" r="6" fill="#FFC56E" />
        <Eyes y={48} dx={9} r={3.6} />
        <ellipse cx="50" cy="62" rx="10" ry="7" fill="#FFE3B0" />
        <path d="M46 58h8l-4 4z" fill={INK} />
        <path d="M50 62q-3 4-6 2M50 62q3 4 6 2" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  elefant: {
    word: 'elefant',
    bg: '#FFF1C9',
    art: (
      <g>
        <ellipse cx="22" cy="48" rx="18" ry="22" fill="#9FA8C7" />
        <ellipse cx="78" cy="48" rx="18" ry="22" fill="#9FA8C7" />
        <ellipse cx="22" cy="48" rx="10" ry="14" fill="#FFB3C7" />
        <ellipse cx="78" cy="48" rx="10" ry="14" fill="#FFB3C7" />
        <ellipse cx="50" cy="46" rx="24" ry="26" fill="#B6BED8" />
        <path d="M44 60q0 16 4 24 2 6 8 4" stroke="#B6BED8" strokeWidth="12" fill="none" strokeLinecap="round" />
        <Eyes y={42} dx={10} r={3.6} />
        <Cheeks y={52} dx={15} />
      </g>
    ),
  },
  zebra: {
    word: 'zebra',
    bg: '#DCF5DF',
    art: (
      <g>
        <path d="M34 26 30 8l12 12zM66 26l4-18-12 12z" fill="#fff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M40 12q10-6 20 0l-2 12H42z" fill={INK} />
        <path d="M32 30q0-12 18-12t18 12l-2 36q-2 18-16 18T34 66z" fill="#fff" stroke={INK} strokeWidth="2.5" />
        <path d="M34 36h8M33 46h9M34 56h7M66 36h-8M67 46h-9M66 56h-7M44 24l6 6 6-6" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
        <ellipse cx="50" cy="74" rx="14" ry="11" fill="#9FA8C7" />
        <circle cx="45" cy="74" r="2" fill={INK} />
        <circle cx="55" cy="74" r="2" fill={INK} />
        <circle cx="41" cy="44" r="3.6" fill={INK} />
        <circle cx="59" cy="44" r="3.6" fill={INK} />
      </g>
    ),
  },
  räv: {
    word: 'räv',
    bg: '#D8F0FB',
    art: (
      <g>
        <path d="M18 18l22 18-18 10zM82 18 60 36l18 10z" fill="#F07A2A" strokeLinejoin="round" stroke="#F07A2A" strokeWidth="3" />
        <path d="M24 26l10 9-8 5zM76 26l-10 9 8 5z" fill={INK} />
        <path d="M16 42q4-12 34-12t34 12L50 86z" fill="#F07A2A" strokeLinejoin="round" stroke="#F07A2A" strokeWidth="4" />
        <path d="M16 42q20 6 34 44Q36 56 16 42zM84 42q-20 6-34 44 14-30 34-44z" fill="#fff" />
        <Eyes y={50} dx={11} r={3.8} />
        <circle cx="50" cy="80" r="5" fill={INK} />
      </g>
    ),
  },
  igelkott: {
    word: 'igelkott',
    bg: '#FFF1C9',
    art: (
      <g>
        <path d="M14 70l4-12-8-6 10-4-4-12 12 2 2-12 10 8 6-12 8 10 8-10 4 12 10-6v12l12-2-6 10 10 6-10 6 6 10z" fill="#8C5A3C" strokeLinejoin="round" stroke="#8C5A3C" strokeWidth="3" />
        <path d="M20 72q0-18 18-24 6 0 10 6 6 14 0 22z" fill="#F3C9A0" />
        <circle cx="34" cy="58" r="3.4" fill={INK} />
        <circle cx="35" cy="57" r="1.1" fill="#fff" />
        <circle cx="18" cy="66" r="4" fill={INK} />
        <ellipse cx="40" cy="66" rx="4" ry="2.5" fill="#FF8FA8" opacity=".6" />
        <path d="M30 78v6M62 78v6" stroke="#8C5A3C" strokeWidth="5" strokeLinecap="round" />
      </g>
    ),
  },
  val: {
    word: 'val',
    bg: '#D8F0FB',
    art: (
      <g>
        <path d="M50 26v-10m0 6-6-8m6 8 6-8" stroke="#5BC0EB" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M12 56c0-18 20-28 40-28 24 0 34 16 34 30 8-4 10-14 10-14s2 18-6 26c-4 4-12 2-14 0-8 10-22 12-36 12-18 0-28-10-28-26z" fill="#4A90D9" />
        <path d="M14 62q24 20 58 8-8 14-30 14-20 0-28-22z" fill="#BFE3F7" />
        <circle cx="32" cy="50" r="3.6" fill={INK} />
        <circle cx="33.2" cy="48.8" r="1.2" fill="#fff" />
        <path d="M22 60q6 4 12 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  jordgubbe: {
    word: 'jordgubbe',
    bg: '#DCF5DF',
    art: (
      <g>
        <path d="M50 88C30 76 16 58 18 42c2-12 16-14 32-14s30 2 32 14c2 16-12 34-32 46z" fill="#EF4B4B" />
        <path d="M50 30 36 20l6 12-14-2 12 8M50 30l14-10-6 12 14-2-12 8M50 30V16" stroke="#4CAF65" strokeWidth="5" fill="#4CAF65" strokeLinejoin="round" strokeLinecap="round" />
        <g fill="#FFE08A">
          {[
            [34, 46],
            [50, 44],
            [66, 46],
            [40, 58],
            [58, 58],
            [48, 70],
            [30, 56],
            [70, 56],
          ].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="1.8" ry="2.6" />
          ))}
        </g>
      </g>
    ),
  },
  tomat: {
    word: 'tomat',
    bg: '#FFF1C9',
    art: (
      <g>
        <ellipse cx="50" cy="56" rx="34" ry="30" fill="#EF4B4B" />
        <path d="M50 30 38 22l4 10-12 2 12 4-2 8 10-8 10 8-2-8 12-4-12-2 4-10z" fill="#4CAF65" strokeLinejoin="round" stroke="#4CAF65" strokeWidth="2" />
        <path d="M50 30v-10" stroke="#4CAF65" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="32" cy="48" rx="5" ry="9" fill="#fff" opacity=".35" transform="rotate(30 32 48)" />
      </g>
    ),
  },
  ost: {
    word: 'ost',
    bg: '#ECE5FF',
    art: (
      <g>
        <path d="M12 64 70 26q16 10 18 30v20H12z" fill="#FFD166" strokeLinejoin="round" stroke="#FFD166" strokeWidth="5" />
        <path d="M12 64h76" stroke="#F0B43C" strokeWidth="4" />
        <g fill="#F0B43C">
          <circle cx="62" cy="46" r="6" />
          <circle cx="32" cy="72" r="4" />
          <circle cx="56" cy="72" r="5" />
          <circle cx="78" cy="56" r="3.5" />
          <ellipse cx="44" cy="56" rx="3" ry="2.4" />
        </g>
      </g>
    ),
  },
  paraply: {
    word: 'paraply',
    bg: '#D8F0FB',
    art: (
      <g>
        <path d="M50 46v34q0 8-8 8t-8-8" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M10 48a40 34 0 0 1 80 0q-6-6-13 0-7-6-13 0-7-6-14 0-7-6-13 0-7-6-13 0-7-6-14 0z" fill="#A78BFA" />
        <path d="M50 14q-14 14-13 34M50 14q14 14 13 34" stroke="#8B6CF0" strokeWidth="3" fill="none" />
        <circle cx="50" cy="13" r="3" fill={INK} />
        <g fill="#5BC0EB">
          <path d="M18 64q-3 5 0 7 3-2 0-7zM82 70q-3 5 0 7 3-2 0-7zM70 86q-3 5 0 7 3-2 0-7z" />
        </g>
      </g>
    ),
  },
  regnbåge: {
    word: 'regnbåge',
    bg: '#D8F0FB',
    art: (
      <g fill="none" strokeWidth="7">
        <path d="M14 72a36 36 0 0 1 72 0" stroke="#EF4B4B" />
        <path d="M21 72a29 29 0 0 1 58 0" stroke="#FFB347" />
        <path d="M28 72a22 22 0 0 1 44 0" stroke="#FFD166" />
        <path d="M35 72a15 15 0 0 1 30 0" stroke="#7BD389" />
        <path d="M42 72a8 8 0 0 1 16 0" stroke="#5BC0EB" />
        <g fill="#fff" stroke="none">
          <circle cx="16" cy="76" r="9" />
          <circle cx="26" cy="78" r="7" />
          <circle cx="8" cy="80" r="6" />
          <circle cx="84" cy="76" r="9" />
          <circle cx="74" cy="78" r="7" />
          <circle cx="92" cy="80" r="6" />
        </g>
      </g>
    ),
  },
  moln: {
    word: 'moln',
    bg: '#A9DCF4',
    art: (
      <g>
        <path d="M24 72a14 14 0 0 1 2-28 18 18 0 0 1 34-6 16 16 0 0 1 18 12 12 12 0 0 1-2 22z" fill="#fff" />
        <Eyes y={58} dx={9} r={3.4} />
        <Cheeks y={64} dx={15} />
        <Smile y={64} w={5} />
        <g fill="#5BC0EB">
          <path d="M34 80q-3 5 0 7 3-2 0-7zM50 82q-3 5 0 7 3-2 0-7zM66 80q-3 5 0 7 3-2 0-7z" />
        </g>
      </g>
    ),
  },
  sko: {
    word: 'sko',
    bg: '#FFF1C9',
    art: (
      <g>
        <path d="M12 72V44q0-6 6-6h14q4 10 16 12l26 6q14 4 14 16z" fill="#5BC0EB" />
        <path d="M10 72h80v6q0 6-6 6H16q-6 0-6-6z" fill="#fff" stroke="#E6DDF0" strokeWidth="2" />
        <path d="M34 46l6 6M42 46l4 8M50 50l2 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <path d="M18 54h14" stroke="#F25F8C" strokeWidth="4" strokeLinecap="round" />
      </g>
    ),
  },
  flygplan: {
    word: 'flygplan',
    bg: '#D8F0FB',
    art: (
      <g>
        <path d="M44 48 26 20h10l24 26zM44 56 30 80h10l20-24z" fill="#5BC0EB" />
        <path d="M12 52q0-8 10-8h56q12 0 14 8-2 8-14 8H22q-10 0-10-8z" fill="#fff" stroke="#E6DDF0" strokeWidth="2" />
        <path d="M10 52 6 34h8l8 14z" fill="#EF4B4B" />
        <g fill="#5BC0EB">
          <circle cx="50" cy="52" r="3" />
          <circle cx="60" cy="52" r="3" />
          <circle cx="70" cy="52" r="3" />
        </g>
        <path d="M80 48q6 0 8 4h-8z" fill={INK} />
      </g>
    ),
  },
  ballong: {
    word: 'ballong',
    bg: '#FFF1C9',
    art: (
      <g>
        <path d="M50 70q-6 8 2 14t0 12" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="50" cy="40" rx="24" ry="29" fill="#F25F8C" />
        <path d="M46 68h8l-4 5z" fill="#D9437A" />
        <ellipse cx="40" cy="28" rx="5" ry="9" fill="#fff" opacity=".45" transform="rotate(20 40 28)" />
      </g>
    ),
  },
  dörr: {
    word: 'dörr',
    bg: '#DCF5DF',
    art: (
      <g>
        <rect x="24" y="10" width="52" height="80" rx="6" fill="#A0674B" />
        <rect x="30" y="16" width="40" height="74" rx="4" fill="#C9875E" />
        <rect x="36" y="22" width="28" height="22" rx="3" fill="#B6744E" />
        <rect x="36" y="52" width="28" height="30" rx="3" fill="#B6744E" />
        <circle cx="62" cy="50" r="3.5" fill="#FFD166" />
      </g>
    ),
  },
} satisfies Record<string, PictureDef>;

export type PicId = keyof typeof PICTURES;
export const PIC_IDS = Object.keys(PICTURES) as PicId[];

export function Picture({
  id,
  size,
  withBg = true,
  className,
  title,
}: {
  id: PicId;
  size?: number | string;
  withBg?: boolean;
  className?: string;
  title?: string;
}) {
  const p: PictureDef = PICTURES[id];
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {withBg && <rect width="100" height="100" rx="24" fill={p.bg} />}
      {p.art}
    </svg>
  );
}
