// Brush engine. Each stroke is drawn onto its own layer, then composited onto the
// drawing (the crayon layer is masked with a paper-grain texture on the way).
(() => {
  const TYPES = [
    { id: 'crayon', label: 'crayon' },
    { id: 'marker', label: 'marker' },
    { id: 'spray', label: 'spray' },
    { id: 'glitter', label: 'glitter' },
  ];

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // ---------- paper grain for the crayon ----------
  // Fine speckle + soft blotches, fixed in place like the tooth of real paper,
  // so overlapping crayon strokes catch on the same bumps.
  const GRAIN_SIZE = 256;
  const grain = (() => {
    const c = makeCanvas(GRAIN_SIZE, GRAIN_SIZE);
    const g = c.getContext('2d');
    const img = g.createImageData(GRAIN_SIZE, GRAIN_SIZE);
    const CELLS = 32;
    const grid = Array.from({ length: (CELLS + 1) * (CELLS + 1) }, Math.random);
    // Tileable: wrap the last row/column to the first.
    for (let i = 0; i <= CELLS; i++) {
      grid[i * (CELLS + 1) + CELLS] = grid[i * (CELLS + 1)];
      grid[CELLS * (CELLS + 1) + i] = grid[i];
    }
    const cell = GRAIN_SIZE / CELLS;
    for (let y = 0; y < GRAIN_SIZE; y++) {
      for (let x = 0; x < GRAIN_SIZE; x++) {
        const gx = x / cell, gy = y / cell;
        const x0 = Math.floor(gx), y0 = Math.floor(gy);
        const fx = gx - x0, fy = gy - y0;
        const at = (cx, cy) => grid[cy * (CELLS + 1) + cx];
        const blotch =
          at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) +
          at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy;
        // Slight diagonal streaking, like wax dragged across paper.
        const streak = Math.sin((x + y * 0.35) * 0.9 + blotch * 6) * 0.08;
        const v = Math.random() * 0.62 + blotch * 0.38 + streak;
        img.data[(y * GRAIN_SIZE + x) * 4 + 3] = v < 0.28 ? 0 : v < 0.36 ? 90 : v < 0.42 ? 190 : 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  })();

  // ---------- colour helpers ----------
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: l * 100 };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: h * 60, s: s * 100, l: l * 100 };
  }

  // ---------- a single stroke ----------
  class Stroke {
    constructor({ brush, colour, size, width, height }) {
      this.brush = brush;
      this.colour = colour; // hex, or 'rainbow'
      this.size = size;
      this.layer = makeCanvas(width, height);
      this.ctx = this.layer.getContext('2d');
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.last = null;
      this.dist = 0;
      this.hue0 = (Date.now() / 15) % 360;
      if (brush === 'crayon') {
        this.mask = makeCanvas(width, height);
        this.mctx = this.mask.getContext('2d');
      }
    }

    get rainbow() { return this.colour === 'rainbow'; }

    hsl() {
      if (this.rainbow) return { h: (this.hue0 + this.dist * 0.7) % 360, s: 95, l: 62 };
      return rgbToHsl(hexToRgb(this.colour));
    }

    colourNow() {
      if (!this.rainbow) return this.colour;
      const { h, s, l } = this.hsl();
      return `hsl(${h} ${s}% ${l}%)`;
    }

    addPoint(p) {
      if (!this.last) {
        this.dab(p);
      } else {
        const len = Math.hypot(p.x - this.last.x, p.y - this.last.y);
        if (len < 0.5) return;
        this.segment(this.last, p, len);
        this.dist += len;
      }
      this.last = p;
    }

    dab(p) {
      const c = this.ctx;
      if (this.brush === 'spray') return this.spray(p, p, 0, true);
      if (this.brush === 'glitter') return this.glitter(p, p, 0, true);
      c.fillStyle = this.colourNow();
      c.beginPath();
      c.arc(p.x, p.y, this.size / 2, 0, Math.PI * 2);
      c.fill();
    }

    segment(a, b, len) {
      const c = this.ctx;
      if (this.brush === 'spray') return this.spray(a, b, len);
      if (this.brush === 'glitter') return this.glitter(a, b, len);

      c.strokeStyle = this.colourNow();
      if (this.brush === 'crayon') {
        // Wobbly width and a second offset pass give the waxy, uneven edge.
        const j = this.size * 0.08;
        c.lineWidth = this.size * (0.88 + Math.random() * 0.14);
        line(c, a, b);
        c.lineWidth = this.size * 0.6;
        line(c, jitter(a, j), jitter(b, j));
      } else {
        c.lineWidth = this.size;
        line(c, a, b);
      }
    }

    spray(a, b, len, single = false) {
      const c = this.ctx;
      const r = this.size / 2 + 4;
      const steps = single ? 1 : Math.max(1, Math.ceil(len / 3));
      const perStep = Math.max(6, this.size * 0.9) * (single ? 2 : 1);
      for (let s = 0; s < steps; s++) {
        const t = single ? 0 : (s + Math.random()) / steps;
        const cx = a.x + (b.x - a.x) * t;
        const cy = a.y + (b.y - a.y) * t;
        c.fillStyle = this.colourNow();
        for (let i = 0; i < perStep; i++) {
          const ang = Math.random() * Math.PI * 2;
          const d = r * Math.pow(Math.random(), 0.85);
          const dot = 0.5 + Math.random() * (d < r * 0.5 ? 1.4 : 0.9);
          c.globalAlpha = 0.35 + Math.random() * 0.65;
          c.beginPath();
          c.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, dot, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.globalAlpha = 1;
    }

    glitter(a, b, len, single = false) {
      const c = this.ctx;
      const r = this.size / 2;
      const base = this.hsl();

      // Soft tinted underlay so glitter reads as a filled stroke.
      c.globalAlpha = 0.28;
      c.strokeStyle = c.fillStyle = `hsl(${base.h} ${base.s}% ${base.l}%)`;
      c.lineWidth = this.size;
      if (single) {
        c.beginPath();
        c.arc(a.x, a.y, r, 0, Math.PI * 2);
        c.fill();
      } else {
        line(c, a, b);
      }
      c.globalAlpha = 1;

      const flakes = Math.max(4, Math.round((single ? this.size : len) * this.size * 0.06));
      for (let i = 0; i < flakes; i++) {
        const t = Math.random();
        const ang = Math.random() * Math.PI * 2;
        const d = r * Math.sqrt(Math.random());
        const x = a.x + (b.x - a.x) * t + Math.cos(ang) * d;
        const y = a.y + (b.y - a.y) * t + Math.sin(ang) * d;
        const l = Math.max(12, Math.min(94, base.l + (Math.random() - 0.5) * 55));
        c.fillStyle = `hsl(${base.h + (Math.random() - 0.5) * 30} ${base.s}% ${l}%)`;
        const f = 1 + Math.random() * 2.2;
        c.save();
        c.translate(x, y);
        c.rotate(ang);
        c.fillRect(-f / 2, -f / 2, f, f);
        c.restore();
      }

      // The occasional bright twinkle.
      if (Math.random() < (single ? 0.6 : Math.min(0.9, len * 0.04))) {
        const t = Math.random();
        twinkle(c, a.x + (b.x - a.x) * t + (Math.random() - 0.5) * r,
                   a.y + (b.y - a.y) * t + (Math.random() - 0.5) * r, 3 + Math.random() * 4);
      }
    }

    // Paint the drawing-so-far plus this stroke onto `ctx`.
    composite(ctx, base, erasing = false) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      if (base) ctx.drawImage(base, 0, 0);
      let src = this.layer;
      if (this.mask) {
        const m = this.mctx;
        m.clearRect(0, 0, this.mask.width, this.mask.height);
        m.drawImage(this.layer, 0, 0);
        m.globalCompositeOperation = 'destination-in';
        m.fillStyle = m.createPattern(grain, 'repeat');
        m.fillRect(0, 0, this.mask.width, this.mask.height);
        m.globalCompositeOperation = 'source-over';
        src = this.mask;
      }
      ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
      ctx.drawImage(src, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function line(c, a, b) {
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  }

  function jitter(p, j) {
    return { x: p.x + (Math.random() - 0.5) * j * 2, y: p.y + (Math.random() - 0.5) * j * 2 };
  }

  function twinkle(c, x, y, s) {
    c.save();
    c.strokeStyle = 'rgba(255,255,255,.95)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x - s, y); c.lineTo(x + s, y);
    c.moveTo(x, y - s); c.lineTo(x, y + s);
    c.stroke();
    c.restore();
  }

  // Draw a little sample squiggle of a brush onto a canvas (for the texture buttons).
  function renderSample(canvas, brush, colour, size) {
    const ctx = canvas.getContext('2d');
    const s = new Stroke({ brush, colour, size, width: canvas.width, height: canvas.height });
    const w = canvas.width, h = canvas.height;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      s.addPoint({ x: w * 0.14 + t * w * 0.72, y: h / 2 + Math.sin(t * Math.PI * 2) * h * 0.2 });
    }
    s.composite(ctx, null);
  }

  window.Brushes = { TYPES, Stroke, renderSample, hexToRgb, rgbToHsl };
})();
