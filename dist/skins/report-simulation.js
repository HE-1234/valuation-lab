// Annual Report · simulation rain. Presentation only. Native representative
// particles drive the bars, statistics and replay clock. Decorative drops start
// across the chart roof and settle into those same outcomes; no extra sampling.
// Pause, resume, skip and cancellation remain owned by the native replay.
const root = document.documentElement;
const on = () => root.dataset.skin === 'report';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const VIEW_W = 960, VIEW_H = 420, LEFT = 48, RIGHT = 918, BOTTOM = 326;
const runs = new WeakMap();

// Stateless visual noise: never consume the financial sampler or Math.random.
function visualNoise(index, salt) {
  let n = Math.imul(index + 1, 0x45d9f3b) ^ salt;
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
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
  if (!particles.length) return [];
  const copies = Math.max(1, Math.floor((phone ? 300 : 680) / particles.length));
  const plan = particles.flatMap((p, i) => Array.from({length: copies}, (_, j) => {
    const id = i * copies + j, land = p.delay + p.duration;
    const flight = Math.min(land, p.duration * (.55 + .2 * visualNoise(id, 11)));
    return {
      id, launch: Math.max(0, land - flight), flight, target: p.target,
      y0: 18 + 24 * visualNoise(id, 23),
      r: (phone ? 2.3 : 1.6) + 1.1 * visualNoise(id, 37),
      tone: .55 + .45 * visualNoise(id, 53)
    };
  }));
  // Roof lanes cover the entire plot, even for a concentrated/single-bin run.
  // Destination ordering avoids crossing paths; jitter stays inside each lane.
  plan.sort((a, b) => a.target - b.target || a.id - b.id);
  plan.forEach((drop, rank) => {
    const lane = (rank + .15 + .7 * visualNoise(drop.id, 71)) / plan.length;
    drop.x0 = LEFT + 14 + lane * (RIGHT - LEFT - 28);
  });
  return plan.sort((a, b) => a.launch - b.launch);
}
function rainPosition(drop, floor, radius, progress) {
  const t = Math.max(0, Math.min(1, progress));
  const settle = t * t * (3 - 2 * t);
  return {
    x: drop.x0 + (drop.target - drop.x0) * settle,
    y: drop.y0 + (floor - radius - drop.y0) * (.38 * t + .62 * t * t)
  };
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
  const bins = [...svg.querySelectorAll('.mc-bin')];
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
  function launch(drop) {
    balls.push({...drop, x: drop.x0, y: drop.y0, life: 1, state: 'fly'});
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

    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      const r = b.r * px;
      if (b.state === 'fly') {
        const t = Math.max(0, Math.min(1, (elapsed - b.launch) / b.flight));
        const floor = surfaceAt(b.target);
        // Gentle horizontal settling, with gravity-like downward acceleration.
        Object.assign(b, rainPosition(b, floor, r, t));
        if (t >= 1) {
          b.state = 'melt';
          splashes.push({x: b.target, y: floor, age: 0, w: 1, bar: floor < BOTTOM ? barAt(b.target) : null});
        }
        // Sample the same bounded path for a short tail. Frame stalls cannot
        // fling a velocity-extrapolated tail outside the chart.
        const {x: tx, y: ty} = rainPosition(b, floor, r, t - .035);
        if (b.y > ty) {
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
