// Drawing page: freehand canvas + accessory stickers + name/message, then send to the tank.
(() => {
  const W = 720;
  const H = 440;
  const MAX_HISTORY = 30;
  const RESET_SECONDS = 20;

  const COLOURS = [
    '#23324a', '#ffffff', '#ff6b6b',
    '#ff9f43', '#ffd93d', '#6bcb77',
    '#00c2c7', '#4d96ff', '#9b5de5',
    '#f15bb5', '#a1887f', '#9aa5b1',
  ];
  const BRUSHES = [
    { size: 8, dot: 8, label: 'Small' },
    { size: 18, dot: 14, label: 'Medium' },
    { size: 34, dot: 22, label: 'Big' },
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

  const stickerDefs = Object.fromEntries(window.STICKERS.map((s) => [s.id, s]));
  const stickerImages = {}; // preloaded <img> per sticker type, used when exporting

  const state = {
    colour: COLOURS[0],
    size: BRUSHES[1].size,
    erasing: false,
    stickers: [], // { uid, type, x, y, w, rot } in canvas units; x/y is the centre
    selected: null,
    history: [],
  };
  let nextUid = 1;

  // ---------- setup ----------
  function buildSwatches() {
    const wrap = $('swatches');
    COLOURS.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = c;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', `Colour ${i + 1}`);
      b.setAttribute('aria-checked', String(c === state.colour));
      b.addEventListener('click', () => {
        state.colour = c;
        setEraser(false);
        wrap.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-checked', String(s === b)));
      });
      wrap.appendChild(b);
    });
  }

  function buildBrushes() {
    const wrap = $('brushes');
    BRUSHES.forEach((br) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'brush';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', `${br.label} brush`);
      b.setAttribute('aria-checked', String(br.size === state.size));
      const dot = document.createElement('span');
      dot.style.width = dot.style.height = `${br.dot}px`;
      b.appendChild(dot);
      b.addEventListener('click', () => {
        state.size = br.size;
        wrap.querySelectorAll('.brush').forEach((s) => s.setAttribute('aria-checked', String(s === b)));
      });
      wrap.appendChild(b);
    });
  }

  function buildTray() {
    const tray = $('stickerTray');
    for (const s of window.STICKERS) {
      const img = new Image();
      img.src = s.url;
      stickerImages[s.id] = img;

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

  function setEraser(on) {
    state.erasing = on;
    eraserBtn.setAttribute('aria-pressed', String(on));
  }

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

  let stroke = null; // { last, mid }

  function strokeStyle() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = state.size;
    ctx.strokeStyle = state.colour;
    ctx.fillStyle = state.colour;
    ctx.globalCompositeOperation = state.erasing ? 'destination-out' : 'source-over';
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    selectSticker(null);
    formError.textContent = '';
    pushHistory();
    canvas.setPointerCapture(e.pointerId);
    const p = toCanvas(e);
    strokeStyle();
    ctx.beginPath();
    ctx.arc(p.x, p.y, state.size / 2, 0, Math.PI * 2);
    ctx.fill();
    stroke = { last: p, mid: p };
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!stroke) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    strokeStyle();
    for (const ev of events) {
      const p = toCanvas(ev);
      const mid = { x: (stroke.last.x + p.x) / 2, y: (stroke.last.y + p.y) / 2 };
      ctx.beginPath();
      ctx.moveTo(stroke.mid.x, stroke.mid.y);
      ctx.quadraticCurveTo(stroke.last.x, stroke.last.y, mid.x, mid.y);
      ctx.stroke();
      stroke.last = p;
      stroke.mid = mid;
    }
  });

  function endStroke() {
    if (!stroke) return;
    strokeStyle();
    ctx.beginPath();
    ctx.moveTo(stroke.mid.x, stroke.mid.y);
    ctx.lineTo(stroke.last.x, stroke.last.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
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

  // ---------- stickers ----------
  function heightOf(s) {
    const def = stickerDefs[s.type];
    return (s.w * def.h) / def.w;
  }

  function addSticker(type) {
    const def = stickerDefs[type];
    pushHistory();
    const s = {
      uid: nextUid++,
      type,
      x: W / 2 + (Math.random() - 0.5) * 80,
      y: H / 2 - 40 + (Math.random() - 0.5) * 60,
      w: def.w * 1.3,
      rot: 0,
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
    for (const s of state.stickers) {
      const h = heightOf(s);
      const el = document.createElement('div');
      el.className = 'sticker' + (s.uid === state.selected ? ' selected' : '');
      el.style.left = `${((s.x - s.w / 2) / W) * 100}%`;
      el.style.top = `${((s.y - h / 2) / H) * 100}%`;
      el.style.width = `${(s.w / W) * 100}%`;
      el.style.height = `${(h / H) * 100}%`;
      el.style.transform = `rotate(${s.rot}deg)`;

      const img = document.createElement('img');
      img.src = stickerDefs[s.type].url;
      img.alt = stickerDefs[s.type].label;
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
      const h = heightOf(s);
      o.save();
      o.translate(s.x, s.y);
      o.rotate((s.rot * Math.PI) / 180);
      o.drawImage(stickerImages[s.type], -s.w / 2, -h / 2, s.w, h);
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

  messageInput.addEventListener('input', () => {
    $('msgCount').textContent = messageInput.value.length;
  });
  // Enter in the message box sends nothing; keep it a single short note.
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.textContent = '';

    if (!hasInk()) {
      formError.textContent = 'Draw your fish first! 🖍️';
      return;
    }
    const name = nameInput.value.trim();
    if (!name) {
      formError.textContent = 'Your fish needs your name!';
      nameInput.focus();
      return;
    }

    const image = exportFish();
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
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
      sendBtn.innerHTML = 'Send to the tank <span aria-hidden="true">🐟</span>';
    }
  });

  // ---------- success screen + reset for next guest ----------
  let countdown = null;

  function showDone(name, image) {
    $('doneName').textContent = name;
    $('donePreview').src = image;
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
    setEraser(false);
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
    const typing = e.target.matches('input, textarea');
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

  buildSwatches();
  buildBrushes();
  buildTray();
})();
