// A realistic planted-aquarium scene, built in layers so fish can swim between
// the background plants and the foreground plants. Used by the success polaroid
// now and by the full tank page later.
//
//   const scene = TankScene.mount(element);   // fills element with the scene
//   scene.fishLayer.appendChild(fishImg);     // fish go here
(() => {
  // Small seeded random so the scene looks the same every time.
  function rng(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const FLOOR = 545; // where plants meet the gravel, in a 1000 x 600 view

  function blade(r, x, h, w, fill) {
    const bend = (r() - 0.5) * h * 0.5;
    const tipX = x + bend, tipY = FLOOR - h;
    return `<path fill="${fill}" d="M${x - w / 2} ${FLOOR + 8} Q${x + bend * 0.3 - w / 3} ${FLOOR - h * 0.55} ${tipX} ${tipY} Q${x + bend * 0.3 + w / 3} ${FLOOR - h * 0.5} ${x + w / 2} ${FLOOR + 8} Z"/>`;
  }

  // A stem plant with paired round leaves (like rotala / ludwigia).
  function stemPlant(r, x, h, fill, leafFill) {
    const bend = (r() - 0.5) * 60;
    let out = `<path d="M${x} ${FLOOR + 6} Q${x + bend * 0.2} ${FLOOR - h / 2} ${x + bend} ${FLOOR - h}" stroke="${fill}" stroke-width="3" fill="none"/>`;
    for (let y = 18; y < h; y += 13 + r() * 5) {
      const t = y / h;
      const cx = x + bend * t * t, cy = FLOOR - y;
      const size = 7 + (1 - t) * 6;
      for (const side of [-1, 1]) {
        out += `<ellipse cx="${cx + side * size * 0.8}" cy="${cy}" rx="${size}" ry="${size * 0.42}" fill="${leafFill}" transform="rotate(${side * (25 + r() * 25)} ${cx} ${cy})"/>`;
      }
    }
    return out;
  }

  // A broad sword-shaped leaf for the foreground.
  function sword(r, x, h, w, fill) {
    const lean = (r() - 0.5) * 1.1;
    const tipX = x + Math.sin(lean) * h, tipY = FLOOR - Math.cos(lean) * h;
    const midX = x + Math.sin(lean) * h * 0.5, midY = FLOOR - Math.cos(lean) * h * 0.5;
    return `<path fill="${fill}" d="M${x} ${FLOOR + 8} Q${midX - w} ${midY} ${tipX} ${tipY} Q${midX + w} ${midY} ${x} ${FLOOR + 8} Z"/>
      <path d="M${x} ${FLOOR + 6} Q${midX} ${midY} ${tipX} ${tipY}" stroke="rgba(255,255,230,.25)" stroke-width="1.2" fill="none"/>`;
  }

  function backSvg() {
    const r = rng(11);
    let far = '', mid = '', gravel = '';

    // Far plants: dense, dark and out of focus.
    for (let i = 0; i < 70; i++) {
      const x = r() * 1040 - 20;
      far += blade(r, x, 160 + r() * 260, 10 + r() * 14, r() < 0.5 ? '#1d4632' : '#244f37');
    }
    for (let i = 0; i < 6; i++) {
      far += stemPlant(r, 80 + r() * 840, 200 + r() * 160, '#2a5a3a', '#2f6640');
    }

    // Middle plants: a little sharper and greener.
    for (let i = 0; i < 26; i++) {
      const x = 260 + r() * 520;
      mid += blade(r, x, 90 + r() * 160, 8 + r() * 8, r() < 0.5 ? '#3d7a45' : '#4d8a4f');
    }
    for (let i = 0; i < 4; i++) {
      mid += stemPlant(r, 300 + r() * 400, 150 + r() * 120, '#3f6f3a', ['#6f9a52', '#a8704a', '#5f8f4a', '#8a6a48'][i]);
    }

    // Gravel: lots of small pebbles, darker toward the back.
    const colours = ['#e8dcc0', '#d4c39c', '#b9a47c', '#9c8a68', '#c9c2b0', '#7d7262', '#efe7d4'];
    for (let i = 0; i < 900; i++) {
      const y = FLOOR - 6 + Math.pow(r(), 0.8) * 64;
      const depth = (y - FLOOR + 6) / 64; // 0 at the back, 1 at the front
      const rx = 2 + depth * 6 + r() * 3;
      const x = r() * 1000;
      gravel += `<ellipse cx="${x + 1.2}" cy="${y + 1.8}" rx="${rx}" ry="${rx * 0.65}" fill="#2d2418" opacity=".45"/>`;
      gravel += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * (0.6 + r() * 0.2)}" fill="${colours[Math.floor(r() * colours.length)]}" transform="rotate(${r() * 40 - 20} ${x} ${y})" opacity="${0.75 + depth * 0.25}"/>`;
    }

    return `
<svg class="ts-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <filter id="tsFar" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="tsMid" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="tsStone"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="4" seed="3" result="n"/><feColorMatrix in="n" values="0 0 0 0 .1  0 0 0 0 .12  0 0 0 0 .08  0 0 0 .9 -.25" result="spots"/><feComposite in="spots" in2="SourceGraphic" operator="in" result="tex"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="tex"/></feMerge></filter>
    <radialGradient id="tsRock" cx="40%" cy="30%" r="80%">
      <stop offset="0" stop-color="#8f9a7c"/><stop offset=".55" stop-color="#5c6a52"/><stop offset="1" stop-color="#2f3a2c"/>
    </radialGradient>
    <linearGradient id="tsFloorShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c2418" stop-opacity=".7"/><stop offset=".35" stop-color="#0c2418" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g filter="url(#tsFar)" opacity=".85">${far}</g>
  <g filter="url(#tsMid)">
    <path fill="url(#tsRock)" filter="url(#tsStone)" d="M520 552 C 500 470, 540 400, 610 392 C 680 386, 730 430, 742 480 C 752 520, 740 552, 720 556 Z"/>
    <path fill="#6f8a4a" opacity=".55" d="M560 420 C 590 396, 650 392, 690 410 C 660 420, 600 424, 560 420 Z"/>
    ${mid}
  </g>
  <g>${gravel}</g>
  <rect x="0" y="${FLOOR - 8}" width="1000" height="70" fill="url(#tsFloorShade)"/>
</svg>`;
  }

  function frontSvg() {
    const r = rng(29);
    let out = '';
    // Clusters at the sides, so the middle stays open for fish.
    for (const [from, to, count] of [[-20, 190, 16], [820, 1020, 16]]) {
      for (let i = 0; i < count; i++) {
        const x = from + r() * (to - from);
        out += r() < 0.35
          ? sword(r, x, 140 + r() * 140, 22 + r() * 12, r() < 0.5 ? 'url(#tsLeafA)' : 'url(#tsLeafB)')
          : blade(r, x, 90 + r() * 190, 9 + r() * 8, r() < 0.5 ? 'url(#tsLeafA)' : 'url(#tsLeafB)');
      }
    }
    // Low carpet plants along the front.
    for (let i = 0; i < 60; i++) {
      out += blade(r, r() * 1000, 14 + r() * 26, 5 + r() * 4, r() < 0.5 ? '#6fa452' : '#88b862');
    }
    return `
<svg class="ts-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="tsLeafA" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#2b5e31"/><stop offset=".6" stop-color="#5e9c47"/><stop offset="1" stop-color="#9cc86c"/>
    </linearGradient>
    <linearGradient id="tsLeafB" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#244f2a"/><stop offset=".7" stop-color="#4c8a3e"/><stop offset="1" stop-color="#7fb35b"/>
    </linearGradient>
  </defs>
  ${out}
</svg>`;
  }

  function bubbles(count) {
    const r = rng(5);
    let out = '';
    for (let i = 0; i < count; i++) {
      const size = 3 + r() * 7;
      out += `<span class="ts-bubble" style="left:${8 + r() * 84}%;width:${size}px;height:${size}px;` +
        `animation-duration:${5 + r() * 6}s;animation-delay:-${r() * 10}s;--sway:${(r() - 0.5) * 30}px"></span>`;
    }
    return out;
  }

  function mount(el, { bubbleCount = 14 } = {}) {
    el.classList.add('tank-scene');
    el.insertAdjacentHTML('afterbegin', `
      <div class="ts-water"></div>
      <div class="ts-rays"></div>
      <div class="ts-layer ts-back">${backSvg()}</div>
      <div class="ts-layer ts-fish"></div>
      <div class="ts-layer ts-front">${frontSvg()}</div>
      <div class="ts-layer ts-bubbles">${bubbles(bubbleCount)}</div>
      <div class="ts-caustics"></div>
      <div class="ts-surface"></div>
      <div class="ts-grain"></div>
      <div class="ts-glass"></div>`);
    return { el, fishLayer: el.querySelector('.ts-fish') };
  }

  window.TankScene = { mount };
})();
