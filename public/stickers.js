// Pre-made accessory stickers. Each is a small SVG; `w`/`h` set its shape.
// To add one: copy an entry, give it a new id, and draw inside the viewBox.

const OUTLINE = 'stroke="#2b2d42" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';

window.STICKERS = [
  {
    id: 'tophat',
    label: 'Top hat',
    w: 100, h: 90,
    svg: `
      <rect x="28" y="8" width="44" height="58" rx="5" fill="#3a3a4a" ${OUTLINE}/>
      <rect x="28" y="46" width="44" height="11" fill="#e05a6d"/>
      <ellipse cx="50" cy="70" rx="44" ry="11" fill="#3a3a4a" ${OUTLINE}/>
      <path d="M35 16 L35 40" stroke="#6b6b80" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    id: 'partyhat',
    label: 'Party hat',
    w: 80, h: 100,
    svg: `
      <path d="M40 14 L70 88 Q40 98 10 88 Z" fill="#ffd166" ${OUTLINE}/>
      <path d="M30 40 L50 34 M22 60 L58 52 M16 78 L65 68" stroke="#ef476f" stroke-width="6" stroke-linecap="round"/>
      <circle cx="40" cy="12" r="9" fill="#06d6a0" ${OUTLINE}/>`,
  },
  {
    id: 'crown',
    label: 'Crown',
    w: 100, h: 70,
    svg: `
      <path d="M10 58 L14 14 L33 36 L50 8 L67 36 L86 14 L90 58 Z" fill="#ffc93c" ${OUTLINE}/>
      <rect x="10" y="54" width="80" height="11" rx="3" fill="#f3a712" ${OUTLINE}/>
      <circle cx="50" cy="40" r="6" fill="#ef476f"/>
      <circle cx="28" cy="46" r="4.5" fill="#118ab2"/>
      <circle cx="72" cy="46" r="4.5" fill="#118ab2"/>`,
  },
  {
    id: 'bow',
    label: 'Bow',
    w: 100, h: 64,
    svg: `
      <path d="M50 32 L12 8 Q2 32 12 56 Z" fill="#ff7eb6" ${OUTLINE}/>
      <path d="M50 32 L88 8 Q98 32 88 56 Z" fill="#ff7eb6" ${OUTLINE}/>
      <path d="M22 20 Q18 32 22 44 M78 20 Q82 32 78 44" stroke="#e0508f" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="40" y="22" width="20" height="20" rx="6" fill="#ff4f9a" ${OUTLINE}/>`,
  },
  {
    id: 'sunglasses',
    label: 'Sunglasses',
    w: 110, h: 46,
    svg: `
      <path d="M4 12 L106 12" ${OUTLINE} fill="none"/>
      <path d="M8 12 L48 12 L46 30 Q42 42 28 42 Q12 42 10 30 Z" fill="#22223b" ${OUTLINE}/>
      <path d="M62 12 L102 12 L100 30 Q98 42 82 42 Q68 42 64 30 Z" fill="#22223b" ${OUTLINE}/>
      <path d="M16 18 L26 18 M70 18 L80 18" stroke="#9a8cff" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    id: 'heartglasses',
    label: 'Heart glasses',
    w: 110, h: 50,
    svg: `
      <path d="M48 20 L62 20" ${OUTLINE} fill="none"/>
      <path d="M28 46 L8 24 Q2 10 16 6 Q26 4 28 14 Q30 4 40 6 Q54 10 48 24 Z" fill="#ff4d6d" ${OUTLINE}/>
      <path d="M82 46 L62 24 Q56 10 70 6 Q80 4 82 14 Q84 4 94 6 Q108 10 102 24 Z" fill="#ff4d6d" ${OUTLINE}/>
      <circle cx="18" cy="15" r="3.5" fill="#fff" opacity=".8"/>
      <circle cx="72" cy="15" r="3.5" fill="#fff" opacity=".8"/>`,
  },
  {
    id: 'flower',
    label: 'Flower',
    w: 80, h: 80,
    svg: `
      <g fill="#fff3b0" ${OUTLINE}>
        <circle cx="40" cy="18" r="14"/><circle cx="62" cy="34" r="14"/>
        <circle cx="54" cy="60" r="14"/><circle cx="26" cy="60" r="14"/>
        <circle cx="18" cy="34" r="14"/>
      </g>
      <circle cx="40" cy="42" r="12" fill="#ff9f1c" ${OUTLINE}/>`,
  },
  {
    id: 'coffee',
    label: 'Coffee',
    w: 90, h: 90,
    svg: `
      <path d="M30 6 Q24 14 30 22 M44 4 Q38 12 44 20" stroke="#b8b8c8" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M66 42 Q84 42 82 56 Q80 68 64 66" fill="none" stroke="#2b2d42" stroke-width="5" stroke-linecap="round"/>
      <path d="M12 30 L72 30 L66 76 Q64 84 56 84 L28 84 Q20 84 18 76 Z" fill="#fefae0" ${OUTLINE}/>
      <path d="M15 46 L69 46 L67 60 L17 60 Z" fill="#d4a373"/>
      <ellipse cx="42" cy="30" rx="30" ry="6" fill="#7f5539" ${OUTLINE}/>`,
  },
  {
    id: 'heart',
    label: 'Heart',
    w: 80, h: 72,
    svg: `
      <path d="M40 66 L10 36 Q0 20 12 10 Q26 0 40 16 Q54 0 68 10 Q80 20 70 36 Z" fill="#ff6b8b" ${OUTLINE}/>
      <path d="M18 20 Q22 14 28 16" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`,
  },
  {
    id: 'star',
    label: 'Star',
    w: 80, h: 80,
    svg: `
      <path d="M40 6 L50 30 L76 32 L56 49 L62 75 L40 61 L18 75 L24 49 L4 32 L30 30 Z" fill="#ffe066" ${OUTLINE}/>
      <circle cx="33" cy="42" r="3" fill="#2b2d42"/><circle cx="47" cy="42" r="3" fill="#2b2d42"/>
      <path d="M35 50 Q40 54 45 50" stroke="#2b2d42" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  },
];

for (const s of window.STICKERS) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.w} ${s.h}" width="${s.w * 2}" height="${s.h * 2}">${s.svg}</svg>`;
  s.url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(doc);
}
