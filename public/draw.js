// Drawing page: textured brushes, colour wheel, photo stickers, then send to the tank.
(() => {
  const W = 720;
  const H = 440;
  const MAX_HISTORY = 30;
  const RESET_SECONDS = 20;

  const PRESETS = [
    { hex: '#1e2a5a', name: 'navy ink' },
    { hex: '#161616', name: 'black' },
    { hex: '#fbf5e8', name: 'paper' },
    { hex: '#d8472e', name: 'tomato' },
    { hex: '#ef8f7a', name: 'blush' },
    { hex: '#e8a530', name: 'mustard' },
    { hex: '#f2d64b', name: 'butter' },
    { hex: '#7f9461', name: 'sage' },
    { hex: '#4e5f34', name: 'olive' },
    { hex: '#a9b8dc', name: 'sardine' },
    { hex: '#4f8fbf', name: 'sea' },
    { hex: '#8a4f7d', name: 'plum' },
    { hex: '#a0612b', name: 'teak' },
    { hex: 'rainbow', name: 'rainbow' },
  ];

  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const stickerLayer = $('stickerLayer');
  const undoBtn = $('undoBtn');
  const eraserBtn = $('eraserBtn');
  const form = $('fishForm');
  const nameInput = $('nameInput');
  const messageInput = $('messageInput');
  const formError = $('formError');
  const sendBtn = $('sendBtn');
  const sizeSlider = $('sizeSlider');
  const brightness = $('brightness');
  const wheel = $('wheel');

  const state = {
    colour: '#1e2a5a',
    hsv: { h: 228, s: 0.67, v: 0.35 },
    brush: 'crayon',
    size: Number(sizeSlider.value),
    erasing: false,
    stickers: [], // { uid, type, x, y, w, rot } in canvas units; x/y is the centre
    selected: null,
    history: [],
  };
  let stickerDefs = {}; // id -> { id, label, url, img, w, h }
  let nextUid = 1;

  // ---------- colour maths ----------
  function hsvToHex({ h, s, v }) {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  }

  function hexToHsv(hex) {
    const { r, g, b } = Brushes.hexToRgb(hex);
    const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
    const d = max - min;
    let h = 0;
    if (d) {
      const [R, G, B] = [r / 255, g / 255, b / 255];
      if (max === R) h = ((G - B) / d) % 6;
      else if (max === G) h = (B - R) / d + 2;
      else h = (R - G) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return { h, s: max ? d / max : 0, v: max };
  }

  // ---------- colour wheel ----------
  function paintWheel() {
    const size = wheel.width;
    const r = size / 2;
    const wctx = wheel.getContext('2d');
    const img = wctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - r + 0.5, dy = y - r + 0.5;
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        const hex = hsvToHex({ h: (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, s: d / r, v: 1 });
        const { r: R, g, b } = Brushes.hexToRgb(hex);
        const i = (y * size + x) * 4;
        img.data[i] = R; img.data[i + 1] = g; img.data[i + 2] = b;
        img.data[i + 3] = Math.max(0, Math.min(1, r - d)) * 255;
      }
    }
    wctx.putImageData(img, 0, 0);
  }

  function pickFromWheel(e) {
    const rect = wheel.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    const s = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2));
    const h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    setColour(hsvToHex({ h, s, v: state.hsv.v }), { h, s, v: state.hsv.v });
  }

  wheel.addEventListener('pointerdown', (e) => {
    wheel.setPointerCapture(e.pointerId);
    pickFromWheel(e);
    const move = (ev) => pickFromWheel(ev);
    const up = () => {
      wheel.removeEventListener('pointermove', move);
      wheel.removeEventListener('pointerup', up);
    };
    wheel.addEventListener('pointermove', move);
    wheel.addEventListener('pointerup', up);
  });

  brightness.addEventListener('input', () => {
    const v = Number(brightness.value) / 100;
    setColour(hsvToHex({ ...state.hsv, v }), { ...state.hsv, v });
  });

  // Set the active colour from anywhere (wheel, slider or preset).
  function setColour(colour, hsv) {
    state.colour = colour;
    if (colour !== 'rainbow') state.hsv = hsv || hexToHsv(colour);
    setEraser(false);
    syncColourUI();
  }

  function syncColourUI() {
    const { h, s, v } = state.hsv;
    const rainbow = state.colour === 'rainbow';
    const dot = $('wheelDot');
    dot.style.left = `${50 + Math.cos(h * Math.PI / 180) * s * 50}%`;
    dot.style.top = `${50 + Math.sin(h * Math.PI / 180) * s * 50}%`;
    dot.style.background = rainbow ? 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' : state.colour;
    dot.style.opacity = rainbow ? 0.4 : 1;
    wheel.style.filter = `brightness(${0.25 + v * 0.75})`;
    brightness.value = Math.round(v * 100);
    brightness.style.setProperty('--full', hsvToHex({ h, s, v: 1 }));
    document.querySelectorAll('.swatch').forEach((el) =>
      el.setAttribute('aria-checked', String(el.dataset.colour === state.colour)));
    stage.style.setProperty('--brush-colour', rainbow ? '#d8472e' : state.colour);
    updateSizePreview();
    scheduleTextureRender();
  }

  function buildSwatches() {
    const wrap = $('swatches');
    for (const p of PRESETS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch' + (p.hex === 'rainbow' ? ' rainbow' : '');
      b.dataset.colour = p.hex;
      if (p.hex !== 'rainbow') b.style.background = p.hex;
      b.title = p.name;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', p.name);
      b.addEventListener('click', () => setColour(p.hex));
      wrap.appendChild(b);
    }
  }

  // ---------- brush textures + size ----------
  const textureCanvases = {};

  function buildTextures() {
    const wrap = $('textures');
    for (const t of Brushes.TYPES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'texture';
      b.dataset.brush = t.id;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(t.id === state.brush));
      const c = document.createElement('canvas');
      c.width = 200;
      c.height = 70;
      textureCanvases[t.id] = c;
      const label = document.createElement('span');
      label.textContent = t.label;
      b.append(c, label);
      b.addEventListener('click', () => {
        state.brush = t.id;
        setEraser(false);
        wrap.querySelectorAll('.texture').forEach((el) =>
          el.setAttribute('aria-checked', String(el === b)));
      });
      wrap.appendChild(b);
    }
  }

  let textureTimer = null;
  function scheduleTextureRender() {
    clearTimeout(textureTimer);
    textureTimer = setTimeout(() => {
      for (const t of Brushes.TYPES) {
        const c = textureCanvases[t.id];
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
        Brushes.renderSample(c, t.id, state.colour, 22);
      }
    }, 40);
  }

  function updateSizePreview() {
    // Show the brush at the size it will actually appear on screen.
    const scale = canvas.getBoundingClientRect().width / W || 1;
    const d = Math.max(3, state.size * scale);
    const dot = $('sizeDot');
    dot.style.width = dot.style.height = `${d}px`;
    dot.style.background = state.colour === 'rainbow'
      ? 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)'
      : state.colour;
  }

  sizeSlider.addEventListener('input', () => {
    state.size = Number(sizeSlider.value);
    updateSizePreview();
  });
  window.addEventListener('resize', updateSizePreview);

  function setEraser(on) {
    state.erasing = on;
    eraserBtn.setAttribute('aria-pressed', String(on));
    stage.classList.toggle('erasing', on);
  }

  // ---------- stencils: a looping carousel showing three at a time ----------
  const DEFAULT_STENCIL = 'classic';
  const STENCILS = window.STENCILS;
  let stencilIndex = 0;

  function stencilButton(st, offset) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'stencil' + (st.id === 'none' ? ' none' : '') + (offset === 0 ? ' current' : '');
    b.dataset.stencil = st.id;
    b.title = st.label;
    b.setAttribute('aria-label', `${st.label} stencil`);
    if (offset === 0) b.setAttribute('aria-current', 'true');
    b.innerHTML = st.id === 'none'
      ? '<span>none</span>'
      : `<svg viewBox="0 0 720 440" aria-hidden="true">${st.svg}</svg>`;
    if (offset !== 0) b.addEventListener('click', () => stepStencil(offset));
    return b;
  }

  // Show the current stencil in the middle with its neighbours either side.
  function renderStencils(direction = 0) {
    const n = STENCILS.length;
    const track = $('stencils');
    track.replaceChildren(...[-1, 0, 1].map((o) => stencilButton(STENCILS[(stencilIndex + o + n) % n], o)));
    track.classList.remove('from-left', 'from-right');
    if (direction) {
      void track.offsetWidth; // restart the slide animation
      track.classList.add(direction > 0 ? 'from-right' : 'from-left');
    }
  }

  function applyStencil(direction = 0) {
    const st = STENCILS[stencilIndex];
    $('guide').innerHTML = st.svg;
    $('stencilName').textContent = st.label;
    $('stencilCount').textContent = `${stencilIndex + 1}/${STENCILS.length}`;
    renderStencils(direction);
  }

  function stepStencil(by) {
    stencilIndex = (stencilIndex + by + STENCILS.length) % STENCILS.length;
    applyStencil(by);
  }

  function setStencil(id) {
    stencilIndex = Math.max(0, STENCILS.findIndex((x) => x.id === id));
    applyStencil();
  }

  $('stencilPrev').addEventListener('click', () => stepStencil(-1));
  $('stencilNext').addEventListener('click', () => stepStencil(1));
  $('stencilCarousel').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepStencil(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); stepStencil(1); }
  });

  // ---------- history (undo covers both drawing and stickers) ----------
  function pushHistory() {
    state.history.push({
      image: ctx.getImageData(0, 0, W, H),
      stickers: state.stickers.map((s) => ({ ...s })),
    });
    if (state.history.length > MAX_HISTORY) state.history.shift();
    undoBtn.disabled = false;
  }

  function undo() {
    const prev = state.history.pop();
    if (!prev) return;
    ctx.putImageData(prev.image, 0, 0);
    state.stickers = prev.stickers;
    state.selected = null;
    renderStickers();
    updateInkHint();
    undoBtn.disabled = state.history.length === 0;
  }

  function clearAll() {
    if (!hasInk() && state.stickers.length === 0) return;
    pushHistory();
    ctx.clearRect(0, 0, W, H);
    state.stickers = [];
    state.selected = null;
    renderStickers();
    updateInkHint();
  }

  // ---------- drawing ----------
  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  }

  const base = document.createElement('canvas'); // the drawing as it was before this stroke
  base.width = W;
  base.height = H;
  const baseCtx = base.getContext('2d');

  let stroke = null;
  let frame = null;

  function paintStroke() {
    frame = null;
    if (stroke) stroke.composite(ctx, base, state.erasing);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    selectSticker(null);
    formError.textContent = '';
    pushHistory();
    canvas.setPointerCapture(e.pointerId);
    baseCtx.clearRect(0, 0, W, H);
    baseCtx.drawImage(canvas, 0, 0);
    stroke = new Brushes.Stroke({
      brush: state.erasing ? 'marker' : state.brush,
      colour: state.erasing ? '#000000' : state.colour,
      size: state.erasing ? Math.max(state.size, 14) : state.size,
      width: W,
      height: H,
    });
    stroke.addPoint(toCanvas(e));
    paintStroke();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!stroke) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events) stroke.addPoint(toCanvas(ev));
    if (!frame) frame = requestAnimationFrame(paintStroke);
  });

  function endStroke() {
    if (!stroke) return;
    cancelAnimationFrame(frame);
    paintStroke();
    stroke = null;
    updateInkHint();
  }
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);

  function inkBounds(context, w, h) {
    const data = context.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    return maxX < 0 ? null : { minX, minY, maxX, maxY };
  }

  const hasInk = () => inkBounds(ctx, W, H) !== null;
  const updateInkHint = () => stage.classList.toggle('has-ink', hasInk());

  // ---------- stickers: load, give each a die-cut white border ----------
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Turns any picture into a scrapbook sticker: a white cut-out edge that follows
  // the shape (or a white photo border if the picture has no transparency), plus a soft shadow.
  function dieCut(img) {
    const MAX = 360;
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const iw = Math.max(1, Math.round(img.naturalWidth * scale));
    const ih = Math.max(1, Math.round(img.naturalHeight * scale));
    const border = Math.round(Math.max(iw, ih) * 0.04) + 5;
    const pad = 14;

    const pic = document.createElement('canvas');
    pic.width = iw;
    pic.height = ih;
    const pctx = pic.getContext('2d', { willReadFrequently: true });
    pctx.drawImage(img, 0, 0, iw, ih);

    const alpha = pctx.getImageData(0, 0, iw, ih).data;
    let clear = 0;
    for (let i = 3; i < alpha.length; i += 16) if (alpha[i] < 200) clear++;
    const cutOut = clear / (alpha.length / 16) > 0.02;

    const st = document.createElement('canvas');
    st.width = iw + border * 2;
    st.height = ih + border * 2;
    const sctx = st.getContext('2d');
    if (cutOut) {
      const sil = document.createElement('canvas');
      sil.width = iw;
      sil.height = ih;
      const silCtx = sil.getContext('2d');
      silCtx.drawImage(pic, 0, 0);
      silCtx.globalCompositeOperation = 'source-in';
      silCtx.fillStyle = '#fffdf6';
      silCtx.fillRect(0, 0, iw, ih);
      for (let a = 0; a < 32; a++) {
        const ang = (a / 32) * Math.PI * 2;
        sctx.drawImage(sil, border + Math.cos(ang) * border, border + Math.sin(ang) * border);
      }
    } else {
      sctx.fillStyle = '#fffdf6';
      sctx.fillRect(0, 0, st.width, st.height);
    }
    sctx.drawImage(pic, border, border);

    const out = document.createElement('canvas');
    out.width = st.width + pad * 2;
    out.height = st.height + pad * 2;
    const octx = out.getContext('2d');
    octx.shadowColor = 'rgba(20, 16, 10, .32)';
    octx.shadowBlur = 9;
    octx.shadowOffsetY = 4;
    octx.drawImage(st, pad, pad - 2);
    return out;
  }

  async function loadStickers() {
    let list = [];
    try {
      list = await fetch('/api/stickers').then((r) => r.json());
    } catch { /* fall back below */ }
    if (!list.length) {
      // No photos added yet: use the built-in placeholder stickers.
      list = window.STICKERS.map((s) => ({ id: s.id, label: s.label, url: s.url }));
    }

    const defs = await Promise.all(list.map(async (s) => {
      try {
        const cut = dieCut(await loadImage(s.url));
        return { id: s.id, label: s.label, img: cut, url: cut.toDataURL('image/png'), w: cut.width, h: cut.height };
      } catch {
        return null;
      }
    }));
    stickerDefs = Object.fromEntries(defs.filter(Boolean).map((d) => [d.id, d]));
    buildTray();
  }

  function buildTray() {
    const tray = $('stickerTray');
    tray.replaceChildren();
    for (const s of Object.values(stickerDefs)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tray-item';
      b.title = s.label;
      b.setAttribute('aria-label', `Add ${s.label}`);
      const preview = document.createElement('img');
      preview.src = s.url;
      preview.alt = '';
      b.appendChild(preview);
      b.addEventListener('click', () => addSticker(s.id));
      tray.appendChild(b);
    }
  }

  // ---------- stickers on the stage ----------
  function heightOf(s) {
    const def = stickerDefs[s.type];
    return (s.w * def.h) / def.w;
  }

  function addSticker(type) {
    const def = stickerDefs[type];
    pushHistory();
    const longest = 170;
    const s = {
      uid: nextUid++,
      type,
      x: W / 2 + (Math.random() - 0.5) * 80,
      y: H / 2 - 40 + (Math.random() - 0.5) * 60,
      w: def.w >= def.h ? longest : (longest * def.w) / def.h,
      rot: (Math.random() - 0.5) * 12,
    };
    state.stickers.push(s);
    state.selected = s.uid;
    renderStickers();
  }

  function selectSticker(uid) {
    if (state.selected === uid) return;
    state.selected = uid;
    renderStickers();
  }

  function removeSticker(uid) {
    pushHistory();
    state.stickers = state.stickers.filter((s) => s.uid !== uid);
    state.selected = null;
    renderStickers();
  }

  function renderStickers() {
    stickerLayer.replaceChildren();
    stage.classList.toggle('sticker-selected', state.selected !== null);
    for (const s of state.stickers) {
      const def = stickerDefs[s.type];
      if (!def) continue;
      const h = heightOf(s);
      const el = document.createElement('div');
      el.className = 'sticker' + (s.uid === state.selected ? ' selected' : '');
      el.style.left = `${((s.x - s.w / 2) / W) * 100}%`;
      el.style.top = `${((s.y - h / 2) / H) * 100}%`;
      el.style.width = `${(s.w / W) * 100}%`;
      el.style.height = `${(h / H) * 100}%`;
      el.style.transform = `rotate(${s.rot}deg)`;

      const img = document.createElement('img');
      img.src = def.url;
      img.alt = def.label;
      img.draggable = false;
      el.appendChild(img);

      const handles = [
        ['rotate', '⟳', 'Spin'],
        ['resize', '↘', 'Resize'],
        ['remove', '✕', 'Remove'],
      ];
      for (const [kind, icon, label] of handles) {
        const hd = document.createElement('div');
        hd.className = `handle ${kind}`;
        hd.textContent = icon;
        hd.title = label;
        hd.addEventListener('pointerdown', (e) => startStickerGesture(e, s.uid, kind));
        el.appendChild(hd);
      }

      el.addEventListener('pointerdown', (e) => startStickerGesture(e, s.uid, 'move'));
      stickerLayer.appendChild(el);
    }
  }

  // One gesture at a time: move, resize or rotate the sticker under the pointer.
  function startStickerGesture(e, uid, kind) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    if (kind === 'remove') {
      removeSticker(uid);
      return;
    }

    selectSticker(uid);
    const s = state.stickers.find((st) => st.uid === uid);
    const start = toCanvas(e);
    const orig = { ...s };
    const startDist = Math.hypot(start.x - s.x, start.y - s.y) || 1;
    const startAngle = Math.atan2(start.y - s.y, start.x - s.x);
    let changed = false;

    const onMove = (ev) => {
      if (!changed) {
        // Save undo state only once something actually moves (a plain click shouldn't count).
        pushHistory();
        changed = true;
      }
      const p = toCanvas(ev);
      if (kind === 'move') {
        s.x = Math.min(W, Math.max(0, orig.x + p.x - start.x));
        s.y = Math.min(H, Math.max(0, orig.y + p.y - start.y));
      } else if (kind === 'resize') {
        const dist = Math.hypot(p.x - orig.x, p.y - orig.y);
        s.w = Math.min(600, Math.max(30, (orig.w * dist) / startDist));
      } else if (kind === 'rotate') {
        const angle = Math.atan2(p.y - orig.y, p.x - orig.x);
        s.rot = orig.rot + ((angle - startAngle) * 180) / Math.PI;
      }
      renderStickers();
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  // ---------- export ----------
  // Flatten drawing + stickers into one transparent PNG, trimmed to the fish.
  function exportFish() {
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const o = out.getContext('2d', { willReadFrequently: true });
    o.drawImage(canvas, 0, 0);
    for (const s of state.stickers) {
      const def = stickerDefs[s.type];
      if (!def) continue;
      const h = heightOf(s);
      o.save();
      o.translate(s.x, s.y);
      o.rotate((s.rot * Math.PI) / 180);
      o.drawImage(def.img, -s.w / 2, -h / 2, s.w, h);
      o.restore();
    }

    const b = inkBounds(o, W, H);
    if (!b) return null;
    const pad = 8;
    const x = Math.max(0, b.minX - pad);
    const y = Math.max(0, b.minY - pad);
    const w = Math.min(W, b.maxX + pad + 1) - x;
    const h = Math.min(H, b.maxY + pad + 1) - y;

    const trimmed = document.createElement('canvas');
    trimmed.width = w;
    trimmed.height = h;
    trimmed.getContext('2d').drawImage(out, x, y, w, h, 0, 0, w, h);
    return trimmed.toDataURL('image/png');
  }

  // ---------- form ----------
  form.noValidate = true;
  const SEND_LABEL = sendBtn.textContent;

  messageInput.addEventListener('input', () => {
    $('msgCount').textContent = messageInput.value.length;
  });
  // Keep the note to one short line.
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.textContent = '';

    if (!hasInk()) {
      formError.textContent = 'draw your fish first!';
      return;
    }
    const name = nameInput.value.trim();
    if (!name) {
      formError.textContent = 'your fish needs your name!';
      nameInput.focus();
      return;
    }

    const image = exportFish();
    sendBtn.disabled = true;
    sendBtn.textContent = 'dropping it in…';
    try {
      const res = await fetch('/api/fish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message: messageInput.value.trim(), image }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not send your fish.');
      showDone(name, image);
    } catch (err) {
      formError.textContent = `${err.message} Is the server still running?`;
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = SEND_LABEL;
    }
  });

  // ---------- success screen + reset for next guest ----------
  let countdown = null;

  // The polaroid shows the fish swimming in the realistic tank scene.
  const doneScene = TankScene.mount($('donePhoto'), { bubbleCount: 10 });
  const donePreview = new Image();
  donePreview.className = 'done-fish';
  donePreview.alt = 'Your fish';
  doneScene.fishLayer.appendChild(donePreview);

  function showDone(name, image) {
    $('doneName').textContent = name;
    donePreview.src = image;
    $('done').hidden = false;
    let left = RESET_SECONDS;
    $('doneCountdown').textContent = left;
    clearInterval(countdown);
    countdown = setInterval(() => {
      left -= 1;
      $('doneCountdown').textContent = left;
      if (left <= 0) resetForNextGuest();
    }, 1000);
    $('nextBtn').focus();
  }

  function resetForNextGuest() {
    clearInterval(countdown);
    $('done').hidden = true;
    ctx.clearRect(0, 0, W, H);
    state.stickers = [];
    state.selected = null;
    state.history = [];
    undoBtn.disabled = true;
    // Fresh tools for the next guest.
    state.brush = 'crayon';
    document.querySelectorAll('.texture').forEach((el) =>
      el.setAttribute('aria-checked', String(el.dataset.brush === 'crayon')));
    state.size = 18;
    sizeSlider.value = 18;
    setColour('#1e2a5a');
    setStencil(DEFAULT_STENCIL);
    form.reset();
    $('msgCount').textContent = '0';
    formError.textContent = '';
    renderStickers();
    updateInkHint();
  }

  $('nextBtn').addEventListener('click', resetForNextGuest);

  // ---------- buttons + keyboard ----------
  undoBtn.addEventListener('click', undo);
  $('clearBtn').addEventListener('click', clearAll);
  eraserBtn.addEventListener('click', () => setEraser(!state.erasing));

  document.addEventListener('keydown', (e) => {
    const typing = e.target.matches('input[type="text"], input:not([type]), textarea');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) {
      e.preventDefault();
      undo();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && state.selected) {
      e.preventDefault();
      removeSticker(state.selected);
    } else if (e.key === 'Escape') {
      selectSticker(null);
    }
  });

  // Clicking empty space outside the stage drops the sticker selection.
  document.addEventListener('pointerdown', (e) => {
    if (!stage.contains(e.target)) selectSticker(null);
  });

  paintWheel();
  buildSwatches();
  buildTextures();
  setStencil(DEFAULT_STENCIL);
  setColour(state.colour);
  loadStickers();
})();
