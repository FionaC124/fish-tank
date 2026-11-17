// Dotted fish outlines guests can trace or ignore. Drawn in a 720 x 440 box,
// facing right. They're only a guide on the sketchpad and are never saved.
(() => {
  // Short spikes around the puffer.
  const spikes = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const x1 = 380 + Math.cos(a) * 146, y1 = 220 + Math.sin(a) * 146;
    const x2 = 380 + Math.cos(a) * 168, y2 = 220 + Math.sin(a) * 168;
    return `M${x1.toFixed(0)} ${y1.toFixed(0)} L${x2.toFixed(0)} ${y2.toFixed(0)}`;
  }).filter((_, i) => i !== 11).join(' '); // leave room for the tail

  window.STENCILS = [
    { id: 'none', label: 'none', svg: '' },
    {
      id: 'classic',
      label: 'classic',
      svg: `<path d="M150 220 C 220 90, 470 80, 560 220 C 470 360, 220 350, 150 220 Z"/>
            <path d="M150 220 L 70 140 L 95 220 L 70 300 Z"/>
            <circle cx="500" cy="195" r="10"/>`,
    },
    {
      id: 'sardine',
      label: 'sardine',
      svg: `<path d="M120 222 C 200 168, 480 160, 610 215 C 490 272, 200 272, 120 222 Z"/>
            <path d="M122 222 L 52 158 L 84 222 L 52 286 Z"/>
            <path d="M300 182 L 345 138 L 392 178"/>
            <path d="M520 192 Q 502 220 522 246"/>
            <circle cx="566" cy="208" r="9"/>`,
    },
    {
      id: 'puffer',
      label: 'puffer',
      svg: `<circle cx="380" cy="220" r="140"/>
            <path d="M242 220 L 170 172 Q 152 220 170 268 Z"/>
            <path d="${spikes}"/>
            <path d="M372 250 Q 405 212 438 250 Q 405 272 372 250 Z"/>
            <circle cx="452" cy="178" r="15"/>
            <circle cx="516" cy="232" r="7"/>`,
    },
    {
      id: 'angelfish',
      label: 'angelfish',
      svg: `<path d="M200 220 C 260 140, 430 130, 530 215 C 430 300, 260 300, 200 220 Z"/>
            <path d="M282 158 C 296 90, 314 44, 326 22 C 372 90, 428 136, 462 166"/>
            <path d="M282 282 C 296 350, 314 396, 326 418 C 372 350, 428 304, 462 274"/>
            <path d="M202 220 L 128 166 L 146 220 L 128 274 Z"/>
            <path d="M372 146 Q 350 220 372 294"/>
            <circle cx="478" cy="200" r="10"/>`,
    },
    {
      id: 'goldfish',
      label: 'goldfish',
      svg: `<path d="M262 220 C 272 118, 482 108, 548 210 C 506 304, 300 322, 262 220 Z"/>
            <path d="M268 206 C 184 118, 94 110, 66 158 C 104 182, 146 202, 168 220 C 146 240, 104 266, 66 296 C 96 342, 188 324, 268 238"/>
            <path d="M356 134 C 374 82, 432 86, 456 140"/>
            <path d="M424 252 Q 438 292 396 306"/>
            <circle cx="494" cy="190" r="13"/>`,
    },
    {
      id: 'betta',
      label: 'betta',
      svg: `<path d="M252 212 C 300 170, 452 164, 546 206 C 474 244, 320 252, 252 212 Z"/>
            <path d="M256 206 C 160 76, 66 118, 56 200 C 46 292, 140 372, 256 222 Z"/>
            <path d="M250 210 L 104 138 M250 213 L 78 208 M250 216 L 110 300"/>
            <path d="M330 182 C 326 106, 402 96, 434 172"/>
            <path d="M300 236 C 300 326, 424 334, 474 226"/>
            <circle cx="506" cy="196" r="8"/>`,
    },
    {
      id: 'shark',
      label: 'shark',
      svg: `<path d="M126 232 C 226 150, 486 140, 610 226 C 526 272, 262 292, 126 232 Z"/>
            <path d="M136 232 L 70 138 L 104 232 L 80 304 Z"/>
            <path d="M318 168 L 360 86 L 404 162"/>
            <path d="M420 258 L 398 326 L 464 262"/>
            <path d="M474 200 L 474 232 M458 203 L 458 234 M442 206 L 442 236"/>
            <path d="M548 244 Q 568 252 590 238"/>
            <circle cx="536" cy="206" r="9"/>`,
    },
    {
      id: 'chubby',
      label: 'chubby',
      svg: `<path d="M204 230 C 204 116, 524 98, 564 230 C 524 346, 204 346, 204 230 Z"/>
            <path d="M208 230 C 150 166, 116 186, 126 230 C 116 274, 150 294, 208 230 Z"/>
            <path d="M332 128 Q 370 92 410 118"/>
            <circle cx="470" cy="200" r="26"/>
            <circle cx="476" cy="204" r="10"/>
            <path d="M522 252 Q 536 266 552 250"/>`,
    },
  ];
})();
