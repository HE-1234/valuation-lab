// Annual Report · simulation pour. Presentation only. The simulation's own
// replay (its representative particles) still drives the bars and every
// statistic; this layer only draws. While the replay runs, a canvas overlay
// pours scenarios from a single point above the median: each one arcs out to
// where its outcome lands, like a Galton board, and touches down on the live
// bar top as the bar grows. It follows the replay's pause, skip and finish and
// never changes the chart's data or DOM state.
const root = document.documentElement;
const on = () => root.dataset.skin === 'report';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const VIEW_W = 960, VIEW_H = 420, TOP = 76, BOTTOM = 326;
// The replay schedule this layer mirrors (simulation-view.js): arrivals begin
// at 2.2 s and the last lands at 6 s.
const FIRST_LAND = 2200, LAST_LAND = 6000;
const runs = new WeakMap();

const rand = (a, b) => a + Math.random() * (b - a);
function rgb(color) {
  const probe = document.createElement('i');
  probe.style.color = color;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  const m = value.match(/[\d.]+/g) || [35, 67, 196];
  return m.slice(0, 3).map(Number);
}

function startRun(group) {
  if (runs.has(group) || reduced()) return;
  const chart = group.closest('[id$="mc-chart"]');
  const svg = group.ownerSVGElement;
  if (!chart || !svg) return;
  const scope = chart.closest('[id$="mc-output"]')?.parentElement || document;
  const playButton = scope.querySelector('[id$="mc-play"]');

  // The representative particles mark where the distribution lives.
  const targets = [...group.children].map(n => n.tagName === 'circle' ? Number(n.getAttribute('cx')) : Number(n.getAttribute('x')) + 2.8).filter(Number.isFinite);
  if (!targets.length) return;
  const bins = [...svg.querySelectorAll('.mc-bin')];
  const binWidth = bins.length ? Math.max(4, Number(bins[0].getAttribute('width')) || 8) : 8;
  const sorted = [...targets].sort((a, b) => a - b);
  const sourceX = sorted[sorted.length >> 1];
  const sourceY = TOP - 36;
  const [r0, g0, b0] = rgb(getComputedStyle(chart).getPropertyValue('--chart-one').trim() || '#2343c4');
  const tint = a => `rgba(${r0},${g0},${b0},${a})`;

  const canvas = document.createElement('canvas');
  canvas.className = 'rx-el rx-rain';
  canvas.setAttribute('aria-hidden', 'true');
  chart.append(canvas);
  const ctx = canvas.getContext('2d');

  const phone = matchMedia('(max-width: 600px)').matches;
  const total = phone ? 300 : 680;
  // Landing times follow the replay: sparse at first, densest mid-run, every
  // scenario down by the time the replay's last particle lands. Flights take
  // 1.1–1.6 s, so the pour opens well before the first bar starts to rise.
  const plan = Array.from({length: total}, () => {
    const u = Math.random();
    const land = FIRST_LAND + (LAST_LAND - 120 - FIRST_LAND) * (u < .5 ? Math.sqrt(u / 2) : 1 - Math.sqrt((1 - u) / 2));
    const flight = 1500 - 380 * ((land - FIRST_LAND) / (LAST_LAND - FIRST_LAND)) + rand(-110, 110);
    return {launch: Math.max(0, land - flight), flight};
  }).sort((a, b) => a.launch - b.launch);
  const balls = [], splashes = [];
  let next = 0, elapsed = 0, last = performance.now(), ending = false, endAt = 0, frame = 0, frames = 0, scale = 1;

  const run = {stop() { if (!ending) { ending = true; endAt = elapsed; } }};
  runs.set(group, run);

  function barAt(x) {
    for (const bar of bins) {
      const bx = Number(bar.getAttribute('x')), bw = Number(bar.getAttribute('width'));
      if (x >= bx - 1 && x <= bx + bw + 1) return {x: bx, w: bw, y: Math.min(BOTTOM, Number(bar.getAttribute('y')) || BOTTOM)};
    }
    return null;
  }
  const surfaceAt = x => barAt(x)?.y ?? BOTTOM;
  function launch({flight}) {
    const target = targets[(Math.random() * targets.length) | 0] + rand(-binWidth * .45, binWidth * .45);
    const T = flight / 1000;
    const x0 = sourceX + rand(-5, 5), y0 = sourceY + rand(-4, 4);
    const drop = BOTTOM - 40 - y0;              // aim for the body of the chart
    // Leave the pour point already moving down so the stream flows instead
    // of hanging at the apex; gravity bends each path into its arc.
    const vy = .38 * drop / T, g = 2 * (drop - vy * T) / (T * T);
    balls.push({
      x: x0, y: y0, vx: (target - x0) / T, vy, g,
      r: rand(phone ? 2.3 : 1.6, phone ? 3.4 : 2.7), tone: rand(.55, 1), life: 1, state: 'fly', bounced: false
    });
  }
  function resize() {
    const box = svg.getBoundingClientRect(), host = chart.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    Object.assign(canvas.style, {left: `${box.left - host.left}px`, top: `${box.top - host.top}px`, width: `${box.width}px`, height: `${box.height}px`});
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    scale = Math.min(box.width / VIEW_W, box.height / VIEW_H) || 1;
    const ox = (box.width - VIEW_W * scale) / 2, oy = (box.height - VIEW_H * scale) / 2;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
  }
  resize();
  const paused = () => /resume/i.test(playButton?.textContent || '');

  function tick(now) {
    if (!canvas.isConnected || !on()) return cleanup();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (paused()) { frame = requestAnimationFrame(tick); return; }
    elapsed += dt * 1000;
    if (++frames % 30 === 0) resize();
    if (!ending) while (next < plan.length && plan[next].launch <= elapsed) launch(plan[next++]);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    const px = 1 / scale;

    // The pour point: a soft bead that breathes while scenarios leave it.
    const pouring = !ending && next < plan.length;
    const glow = pouring ? 1 : Math.max(0, 1 - (elapsed - (plan.at(-1)?.launch || 0)) / 400);
    if (glow > 0) {
      const halo = ctx.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, 16 * px);
      halo.addColorStop(0, tint(.35 * glow));
      halo.addColorStop(1, tint(0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(sourceX, sourceY, 16 * px, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tint(.9 * glow);
      ctx.beginPath(); ctx.arc(sourceX, sourceY, (3.2 + Math.sin(elapsed / 90) * .5) * px, 0, Math.PI * 2); ctx.fill();
    }

    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      const r = b.r * px;
      if (b.state === 'fly') {
        b.vy += b.g * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        const floor = surfaceAt(b.x);
        if (b.y >= floor - r) {
          b.y = floor - r;
          if (!b.bounced && b.vy > 90) {
            b.bounced = true; b.vy = -b.vy * .2; b.vx *= .25;
            splashes.push({x: b.x, y: floor, age: 0, w: Math.min(1, b.vy / -40), bar: floor < BOTTOM ? barAt(b.x) : null});
          } else { b.state = 'melt'; }
        }
        // A short comet tail along the arc, only while the ball descends.
        if (b.vy > 0) {
          const tx = b.x - b.vx * .06, ty = b.y - b.vy * .06;
          const trail = ctx.createLinearGradient(tx, ty, b.x, b.y);
          trail.addColorStop(0, tint(0));
          trail.addColorStop(1, tint(.36 * b.tone * b.life));
          ctx.strokeStyle = trail; ctx.lineWidth = r * 1.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      } else {
        b.life -= dt * 4;
        b.y = surfaceAt(b.x) - r * Math.max(0, b.life);
      }
      if (ending) b.life -= dt * 3;
      if (b.life <= 0) { balls.splice(i, 1); continue; }
      ctx.fillStyle = tint(b.tone * Math.min(1, b.life));
      ctx.beginPath(); ctx.arc(b.x, b.y, r * (b.state === 'melt' ? .6 + .4 * b.life : 1), 0, Math.PI * 2); ctx.fill();
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.age += dt;
      const t = s.age / .35;
      if (t >= 1) { splashes.splice(i, 1); continue; }
      // The struck bar's top catches the light for a moment.
      if (s.bar) {
        ctx.fillStyle = `rgba(255,255,255,${.5 * (1 - t) * s.w})`;
        ctx.fillRect(s.bar.x, surfaceAt(s.x), s.bar.w, 3 * px);
      }
      const half = (2 + 9 * t) * px;
      ctx.strokeStyle = tint(.45 * (1 - t) * s.w);
      ctx.lineWidth = 1.4 * px;
      ctx.beginPath(); ctx.moveTo(s.x - half, s.y - .5 * px); ctx.lineTo(s.x + half, s.y - .5 * px); ctx.stroke();
    }

    if (ending && ((!balls.length && !splashes.length) || elapsed - endAt > 600)) return cleanup();
    frame = requestAnimationFrame(tick);
  }
  function cleanup() {
    cancelAnimationFrame(frame);
    canvas.remove();
    group.classList.remove('rx-poured');
    runs.delete(group);
  }
  // The overlay carries the motion; the representative dots stay in the DOM
  // (they drive the bars) but are no longer drawn twice.
  group.classList.add('rx-poured');
  frame = requestAnimationFrame(tick);
}

// The replay begins when the chart's particle group fills, and ends when it
// empties (finish, skip, tab change or reduced motion).
const watched = new WeakSet();
function watch(group) {
  if (watched.has(group)) return;
  watched.add(group);
  new MutationObserver(() => {
    if (!on()) return;
    if (group.childElementCount && !runs.has(group)) startRun(group);
    else if (!group.childElementCount) runs.get(group)?.stop();
  }).observe(group, {childList: true});
  if (group.childElementCount) startRun(group);
}
function scan() { document.querySelectorAll('[id$="mc-particles"]').forEach(watch); }
new MutationObserver(scan).observe(document.body, {childList: true, subtree: true});
scan();
