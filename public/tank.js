// The tank: every guest's fish swimming in the realistic scene.
// New fish drop in a few seconds after they're sent from the drawing page.
(() => {
  const POLL_MS = 3000;
  const TALK_EVERY_MS = 2500;
  const TALK_FOR_MS = 6500;

  const $ = (id) => document.getElementById(id);
  const scene = TankScene.mount($('tank'), { bubbleCount: 26 });
  const layer = scene.fishLayer;
  const swimmers = new Map(); // fish id -> Swimmer

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // The open water: below the surface, above the gravel.
  function bounds() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const scale = Math.max(W / 1000, H / 600); // matches the scene's "slice" scaling
    return { W, H, top: H * 0.17, floor: H - 62 * scale };
  }

  // Fish get a little smaller as the tank fills up.
  function baseWidth() {
    const n = Math.max(1, swimmers.size);
    return bounds().W * clamp(0.36 / Math.sqrt(n), 0.075, 0.17);
  }

  class Swimmer {
    constructor(data, { entering = false } = {}) {
      this.data = data;
      this.depth = rand(0.8, 1); // 1 = closest to the glass
      this.speedFactor = rand(0.75, 1.25);
      this.phase = rand(0, Math.PI * 2);
      this.aspect = 0.5;
      this.facing = Math.random() < 0.5 ? 1 : -1;
      this.vx = 0;
      this.vy = 0;
      this.timer = 0;
      this.entering = entering;
      this.lastTalk = performance.now() - rand(0, 20000);

      const el = document.createElement('div');
      el.className = 'fish' + (this.depth < 0.88 ? ' far' : '');
      el.style.zIndex = String(Math.round(this.depth * 100));
      el.innerHTML = '<div class="tilt"><div class="flip"><img alt=""></div></div>';
      this.el = el;

      // Name + speech bubble live in a layer above all fish, so nothing covers them.
      const label = document.createElement('div');
      label.className = 'fish-label';
      label.innerHTML = '<div class="name"></div><div class="bubble"></div>';
      this.label = label;
      this.tiltEl = el.querySelector('.tilt');
      this.img = el.querySelector('img');
      this.img.style.setProperty('--wiggle', `${rand(1.1, 1.8).toFixed(2)}s`);
      this.img.style.animationDelay = `-${rand(0, 2).toFixed(2)}s`;
      this.img.alt = `${data.name}'s fish`;
      label.querySelector('.name').textContent = data.name;
      const bubble = label.querySelector('.bubble');
      if (data.message) bubble.textContent = data.message;
      else bubble.remove();

      this.img.onload = () => {
        this.aspect = this.img.naturalHeight / this.img.naturalWidth || 0.5;
        this.resize();
      };
      this.img.src = data.image;

      el.addEventListener('click', () => removeFish(this));
      this.resize();

      const b = bounds();
      if (entering) {
        this.x = rand(b.W * 0.2, b.W * 0.8);
        this.y = -this.h;
        this.tx = this.x + rand(-b.W * 0.15, b.W * 0.15);
        this.ty = rand(b.top + this.h, b.H * 0.5);
        this.timer = 8;
      } else {
        this.x = rand(this.w, b.W - this.w);
        this.y = rand(b.top + this.h / 2, b.floor - this.h);
        this.pickTarget();
      }
      el.classList.toggle('facing-left', this.facing < 0);
      layer.appendChild(el);
      $('labels').appendChild(label);
    }

    resize() {
      const { H } = bounds();
      this.w = baseWidth() * this.depth;
      this.h = this.w * this.aspect;
      if (this.h > H * 0.24) { // very tall drawings
        this.h = H * 0.24;
        this.w = this.h / this.aspect;
      }
      this.el.style.width = `${this.w}px`;
      this.label.style.setProperty('--half', `${this.h / 2}px`);
    }

    // Mostly long, lazy swims across the tank with gentle changes in depth.
    pickTarget() {
      const b = bounds();
      const margin = this.w / 2 + 20;
      const goFar = Math.random() < 0.7;
      this.tx = goFar
        ? (this.x < b.W / 2 ? rand(b.W * 0.6, b.W - margin) : rand(margin, b.W * 0.4))
        : rand(margin, b.W - margin);
      this.ty = clamp(this.y + rand(-0.2, 0.2) * b.H, b.top + this.h / 2, b.floor - this.h / 2 - 34);
      this.timer = rand(7, 15);
    }

    update(dt, t) {
      const b = bounds();
      const minX = this.w / 2 + 10, maxX = b.W - this.w / 2 - 10;
      const minY = b.top + this.h / 2, maxY = b.floor - this.h / 2 - 34;

      if (this.entering && this.y > minY) this.entering = false;
      this.timer -= dt;
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d = Math.hypot(dx, dy) || 1;
      if (!this.entering && (d < this.w * 0.35 || this.timer <= 0)) this.pickTarget();

      const speed = b.W * 0.04 * this.speedFactor * (this.entering ? 1.8 : 1);
      const steer = Math.min(1, dt * (this.entering ? 2 : 0.8));
      this.vx += ((dx / d) * speed - this.vx) * steer;
      this.vy += ((dy / d) * speed * 0.6 - this.vy) * steer;
      this.x = clamp(this.x + this.vx * dt, minX, maxX);
      this.y += this.vy * dt;
      if (!this.entering) this.y = clamp(this.y, minY, Math.max(minY, maxY));

      // Turn around only when clearly swimming the other way.
      const turn = speed * 0.18;
      if (this.vx > turn && this.facing < 0) this.setFacing(1);
      else if (this.vx < -turn && this.facing > 0) this.setFacing(-1);

      const tilt = clamp(Math.atan2(this.vy, Math.abs(this.vx) + 1) * 180 / Math.PI, -16, 16) * 0.7 * this.facing;
      const bob = Math.sin(t * 1.1 + this.phase) * b.H * 0.004;
      this.el.style.transform = `translate3d(${this.x - this.w / 2}px, ${this.y - this.h / 2 + bob}px, 0)`;
      this.tiltEl.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
      this.label.style.transform = `translate3d(${this.x}px, ${this.y + bob}px, 0)`;
    }

    setFacing(f) {
      this.facing = f;
      this.el.classList.toggle('facing-left', f < 0);
    }

    talk() {
      this.lastTalk = performance.now();
      this.label.classList.add('talking');
      setTimeout(() => this.label.classList.remove('talking'), TALK_FOR_MS);
    }

    get talking() { return this.label.classList.contains('talking'); }

    leave() {
      this.el.classList.add('leaving');
      this.label.classList.add('leaving');
      setTimeout(() => { this.el.remove(); this.label.remove(); }, 700);
    }
  }

  // ---------- animation loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const list = [...swimmers.values()];
    // Gentle personal space: overlapping fish drift apart.
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (a.entering || b.entering) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const min = (a.w + b.w) * 0.42;
        if (d < min) {
          const push = (min - d) * dt * 1.6;
          a.x -= (dx / d) * push * 0.5; a.y -= (dy / d) * push;
          b.x += (dx / d) * push * 0.5; b.y += (dy / d) * push;
        }
      }
    }
    for (const s of list) s.update(dt, now / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- speech bubbles, a few at a time ----------
  setInterval(() => {
    const all = [...swimmers.values()];
    const talking = all.filter((s) => s.talking).length;
    if (talking >= (all.length < 10 ? 2 : 3)) return;
    const now = performance.now();
    const ready = all.filter((s) => s.data.message && !s.talking && !s.entering && now - s.lastTalk > 12000);
    if (ready.length) ready[Math.floor(Math.random() * ready.length)].talk();
  }, TALK_EVERY_MS);

  // ---------- arrivals ----------
  function splash(x) {
    const b = bounds();
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('span');
      const size = rand(6, 18);
      s.className = 'splash';
      s.style.cssText = `left:${x + rand(-40, 40)}px;top:${b.H * 0.04 + rand(0, 30)}px;width:${size}px;height:${size}px;` +
        `--dx:${rand(-60, 60)}px;--dy:${rand(40, 180)}px;animation-delay:${rand(0, 0.3)}s`;
      layer.appendChild(s);
      setTimeout(() => s.remove(), 2400);
    }
  }

  function toast(name) {
    const t = document.createElement('div');
    t.className = 'toast';
    const em = document.createElement('em');
    em.textContent = name;
    const small = document.createElement('small');
    small.textContent = `fish no. ${swimmers.size} in the tank`;
    t.append(em, ' just dropped in!', small);
    $('toasts').appendChild(t);
    setTimeout(() => t.remove(), 5200);
  }

  async function sync(initial = false) {
    let list;
    try {
      list = await fetch('/api/fish', { cache: 'no-store' }).then((r) => r.json());
    } catch {
      return; // server briefly unreachable: keep swimming, try again next poll
    }
    const ids = new Set(list.map((f) => f.id));
    let changed = false;

    for (const [id, s] of swimmers) {
      if (!ids.has(id)) {
        s.leave();
        swimmers.delete(id);
        changed = true;
      }
    }
    for (const f of list) {
      if (swimmers.has(f.id)) continue;
      const s = new Swimmer(f, { entering: !initial });
      swimmers.set(f.id, s);
      changed = true;
      if (!initial) {
        splash(s.x);
        toast(f.name);
      }
    }
    if (changed) {
      for (const s of swimmers.values()) s.resize();
    }
  }

  sync(true);
  setInterval(sync, POLL_MS);
  window.addEventListener('resize', () => swimmers.forEach((s) => s.resize()));

  // ---------- host menu ----------
  const host = $('host');
  const menu = $('hostMenu');
  let sleepTimer = null;

  function wake() {
    document.body.classList.add('mouse-awake');
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(() => {
      if (menu.hidden) document.body.classList.remove('mouse-awake');
    }, 2500);
  }
  window.addEventListener('mousemove', wake);

  function closeMenu() {
    menu.hidden = true;
    host.classList.remove('open');
    $('hostToggle').setAttribute('aria-expanded', 'false');
  }

  $('hostToggle').addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    host.classList.toggle('open', !menu.hidden);
    $('hostToggle').setAttribute('aria-expanded', String(!menu.hidden));
  });

  let statusTimer = null;
  function status(text, ms = 4000) {
    const el = $('status');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(statusTimer);
    if (ms) statusTimer = setTimeout(() => { el.hidden = true; }, ms);
  }

  $('fullscreenBtn').addEventListener('click', () => {
    closeMenu();
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => status('Full screen was blocked by the browser. Try F11.'));
  });

  // Remove mode: click a fish to take it out of the tank.
  const removeBtn = $('removeBtn');
  removeBtn.addEventListener('click', () => {
    const on = !document.body.classList.contains('removing');
    document.body.classList.toggle('removing', on);
    removeBtn.setAttribute('aria-pressed', String(on));
    removeBtn.textContent = on ? 'done removing' : 'remove a fish…';
    closeMenu();
    if (on) status('Click a fish to remove it. Open the menu again to finish.', 0);
    else $('status').hidden = true;
  });

  async function removeFish(s) {
    if (!document.body.classList.contains('removing')) return;
    if (!window.confirm(`Remove ${s.data.name}'s fish from the tank?`)) return;
    const res = await fetch(`/api/fish/${encodeURIComponent(s.data.id)}`, { method: 'DELETE' }).catch(() => null);
    if (!res || !res.ok) return status('Could not remove that fish. Is the server running?');
    s.leave();
    swimmers.delete(s.data.id);
    swimmers.forEach((o) => o.resize());
  }

  // ---------- keepsake: snapshot + short recording ----------
  // Uses the browser's screen capture, so it asks which tab to share (pick this one).
  function stamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  async function captureTab() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      status('Saving needs the laptop running the tank: open it at http://localhost:3000/tank.html', 7000);
      return null;
    }
    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30, displaySurface: 'browser' },
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
      });
    } catch {
      status('Screen capture was cancelled.');
      return null;
    }
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  $('snapshotBtn').addEventListener('click', async () => {
    closeMenu();
    const stream = await captureTab();
    if (!stream) return;
    document.body.classList.add('capturing');
    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await wait(700); // let the menu and permission bar clear
      const c = document.createElement('canvas');
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      c.getContext('2d').drawImage(video, 0, 0);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      download(blob, `fish-tank-${stamp()}.png`);
      status('Snapshot saved to your downloads.');
    } finally {
      stream.getTracks().forEach((t) => t.stop());
      document.body.classList.remove('capturing');
    }
  });

  $('recordBtn').addEventListener('click', async () => {
    closeMenu();
    const stream = await captureTab();
    if (!stream) return;
    const type = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm']
      .find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!type) {
      stream.getTracks().forEach((t) => t.stop());
      return status('This browser cannot record video. Try Chrome.');
    }
    document.body.classList.add('capturing');
    await wait(700);
    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 8_000_000 });
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      document.body.classList.remove('capturing');
      download(new Blob(chunks, { type }), `fish-tank-${stamp()}.${type.startsWith('video/mp4') ? 'mp4' : 'webm'}`);
      status('Recording saved to your downloads.');
    };
    stream.getVideoTracks()[0].addEventListener('ended', () => rec.state !== 'inactive' && rec.stop());
    rec.start(1000);
    setTimeout(() => rec.state !== 'inactive' && rec.stop(), 15000);
  });
})();
