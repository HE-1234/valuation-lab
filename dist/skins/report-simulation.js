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

// Native representative particles own both the outcome positions and replay
// clock. Decorative duplicates have equal weight; no second outcome sampler.
function replayParticles(group) {
  return [...group.children].map(node => {
    const animation = node.getAnimations?.()[0], timing = animation?.effect?.getTiming?.();
    const target = node.tagName.toLowerCase() === 'circle' ? Number(node.getAttribute('cx')) : Number(node.getAttribute('x')) + 2.8;
    return {node, animation, target, delay: Number(timing?.delay), duration: Number(timing?.duration)};
  }).filter(p => Number.isFinite(p.target) && p.animation && Number.isFinite(p.delay) && Number.isFinite(p.duration) && p.duration > 0);
}
function rainPlan(particles, phone) {
  const copies = Math.max(1, Math.floor((phone ? 300 : 680) / particles.length));
  return particles.flatMap(p => Array.from({length: copies}, () => {
    const land = p.delay + p.duration;
    const flight = Math.min(land, p.duration * rand(.55, .75));
    return {launch: Math.max(0, land - flight), flight, target: p.target};
  })).sort((a, b) => a.launch - b.launch);
}
function replayElapsed(particles) {
  const times = particles.map(p => p.animation.currentTime).filter(time => typeof time === 'number' && Number.isFinite(time));
  return times.length ? Math.max(...times) : null;
}

function startRun(group) {
  if (runs.has(group) || reduced() || document.hidden) return;
  const chart = group.closest('[id$="mc-chart"]');
  const svg = group.ownerSVGElement;
  if (!chart || !svg) return;
  const particles = replayParticles(group);
  if (!particles.length) return;
  const targets = particles.map(p => p.target);
  const bins = [...svg.querySelectorAll('.mc-bin')];
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
  if (!ctx) { canvas.remove(); return; }

  const phone = matchMedia('(max-width: 600px)').matches;
  const plan = rainPlan(particles, phone);
  const balls = [], splashes = [];
  let next = 0, elapsed = 0, frame = 0, frames = 0, scale = 1;
  const run = {sources: new Set(particles.map(p => p.node)), stop: cleanup};
  runs.set(group, run);

  function barAt(x) {
    for (const bar of bins) {
      const bx = Number(bar.getAttribute('x')), bw = Number(bar.getAttribute('width'));
      if (x >= bx - 1 && x <= bx + bw + 1) return {x: bx, w: bw, y: Math.min(BOTTOM, Number(bar.getAttribute('y')) || BOTTOM)};
    }
    return null;
  }
  const surfaceAt = x => barAt(x)?.y ?? BOTTOM;
  function launch({launch, flight, target}) {
    const x0 = sourceX + rand(-5, 5), y0 = sourceY + rand(-4, 4);
    balls.push({
      x: x0, y: y0, x0, y0, target, launch, flight, vx: 0, vy: 0,
      r: rand(phone ? 2.3 : 1.6, phone ? 3.4 : 2.7), tone: rand(.55, 1), life: 1, state: 'fly'
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

  function tick() {
    if (!canvas.isConnected || !group.isConnected || !group.childElementCount || !on() || reduced() || document.hidden) return cleanup();
    const time = replayElapsed(particles);
    // The native Web Animations clock freezes on pause and advances on resume.
    if (time === null || time === elapsed) { frame = requestAnimationFrame(tick); return; }
    const dt = Math.max(0, Math.min(0.05, (time - elapsed) / 1000));
    elapsed = time;
    if (++frames % 30 === 0) resize();
    while (next < plan.length && plan[next].launch <= elapsed) launch(plan[next++]);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    const px = 1 / scale;

    // The pour point: a soft bead that breathes while scenarios leave it.
    const pouring = next < plan.length;
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
        const t = Math.max(0, Math.min(1, (elapsed - b.launch) / b.flight));
        const priorX = b.x, priorY = b.y, floor = surfaceAt(b.target);
        // Arc to the actual representative outcome, even as its bar rises.
        b.x = b.x0 + (b.target - b.x0) * t;
        b.y = b.y0 + (floor - r - b.y0) * (.38 * t + .62 * t * t);
        b.vx = dt ? (b.x - priorX) / dt : 0;
        b.vy = dt ? (b.y - priorY) / dt : 0;
        if (t >= 1) {
          b.state = 'melt';
          splashes.push({x: b.target, y: floor, age: 0, w: 1, bar: floor < BOTTOM ? barAt(b.target) : null});
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

    frame = requestAnimationFrame(tick);
  }
  function cleanup() {
    cancelAnimationFrame(frame);
    canvas.remove();
    group.classList.remove('rx-poured');
    if (runs.get(group) === run) runs.delete(group);
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
    const previous = runs.get(group);
    if (!on() || reduced() || document.hidden || !group.childElementCount) { previous?.stop(); return; }
    // Skip followed immediately by Replay can replace particles in one batch.
    if (previous && [...group.children].some(node => !previous.sources.has(node))) previous.stop();
    if (!runs.has(group)) startRun(group);
  }).observe(group, {childList: true});
  if (group.childElementCount) startRun(group);
}
function scan() { document.querySelectorAll('[id$="mc-particles"]').forEach(watch); }
new MutationObserver(scan).observe(document.body, {childList: true, subtree: true});
scan();
