// Globe en fil de fer animé : la pièce visuelle du site.
// Dessiné en <canvas> et non en SVG : reconstruire des milliers de segments SVG
// à chaque image fait ramer les téléphones d'entrée de gamme.

type Mode = 'sphere' | 'horizon';

const GREEN = '#1EF2A0';
const VIOLET = '#7218FA';
const WHITE = '#E6FFF3';
const COTONOU = { lat: 6.37, lon: 2.42 };
const DEG = Math.PI / 180;

type Frame = { front: Path2D; back: Path2D; origin: { x: number; y: number; visible: boolean } };

function buildFrame(r: number, cx: number, cy: number, spin: number, tilt: number, step: number): Frame {
  const front = new Path2D();
  const back = new Path2D();
  const project = (lat: number, lon: number) => {
    const la = lat * DEG;
    const lo = (lon + spin) * DEG;
    const x = Math.cos(la) * Math.sin(lo);
    const y = Math.sin(la);
    const z = Math.cos(la) * Math.cos(lo);
    return {
      x: cx + r * x,
      y: cy - r * (y * Math.cos(tilt) - z * Math.sin(tilt)),
      z: y * Math.sin(tilt) + z * Math.cos(tilt),
    };
  };
  const segment = (a: ReturnType<typeof project>, b: ReturnType<typeof project>) => {
    const path = a.z + b.z >= 0 ? front : back;
    path.moveTo(a.x, a.y);
    path.lineTo(b.x, b.y);
  };
  for (let lon = 0; lon < 360; lon += 20) {
    for (let lat = -90; lat < 90; lat += step) segment(project(lat, lon), project(lat + step, lon));
  }
  for (let lat = -60; lat <= 60; lat += 20) {
    for (let lon = 0; lon < 360; lon += step) segment(project(lat, lon), project(lat, lon + step));
  }
  const o = project(COTONOU.lat, COTONOU.lon);
  return { front, back, origin: { x: o.x, y: o.y, visible: o.z > 0 } };
}

function mount(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const mode = (canvas.dataset.mode as Mode) || 'sphere';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let running = false;
  let raf = 0;
  let glitchUntil = 0;
  let nextGlitch = performance.now() + 1500;
  let bands: { y: number; h: number; dx: number; color: string }[] = [];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const geometry = () => {
    if (mode === 'horizon') {
      // Seule la calotte supérieure d'un globe immense dépasse du bas de la zone.
      // Inclinaison essayée à -52° : on voyait le pôle de face et les méridiens
      // convergeaient en étoile. À +25°, le pôle nord apparaissait au sommet du
      // dôme. Légèrement négative, le pôle passe juste derrière l'horizon.
      const r = Math.max(width * 0.75, 420);
      return { r, cx: width / 2, cy: height + r * 0.62, tilt: -8 * DEG, step: 6, speed: 0.004 };
    }
    const r = Math.min(width, height) * 0.46;
    return { r, cx: width / 2, cy: height / 2, tilt: 20 * DEG, step: 10, speed: 0.012 };
  };

  const draw = (now: number) => {
    const g = geometry();
    const spin = (now * g.speed) % 360;
    const frame = buildFrame(g.r, g.cx, g.cy, spin, g.tilt, g.step);
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    ctx.strokeStyle = GREEN;
    ctx.globalAlpha = 0.12;
    ctx.stroke(frame.back);
    ctx.globalAlpha = mode === 'horizon' ? 0.55 : 1;
    ctx.stroke(frame.front);
    ctx.globalAlpha = 1;
    if (mode === 'horizon') {
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (frame.origin.visible) {
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.arc(frame.origin.x, frame.origin.y, 4, 0, Math.PI * 2);
      ctx.fill();
      const maxRing = g.r * (mode === 'horizon' ? 0.18 : 0.35);
      for (let i = 0; i < 2; i++) {
        const t = ((now / 2600 + i / 2) % 1);
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.arc(frame.origin.x, frame.origin.y, 5 + t * maxRing, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Bandes glitch : de courtes secousses horizontales, à intervalles irréguliers.
    if (mode === 'sphere' && !reduceMotion) {
      if (now > nextGlitch) {
        glitchUntil = now + 140 + Math.random() * 160;
        nextGlitch = now + 1800 + Math.random() * 2600;
        bands = Array.from({ length: 1 + Math.round(Math.random()) }, (_, i) => ({
          y: g.cy - g.r + Math.random() * g.r * 2,
          h: 8 + Math.random() * 30,
          dx: (Math.random() - 0.5) * 60,
          color: i === 0 ? VIOLET : WHITE,
        }));
      }
      if (now < glitchUntil) {
        for (const b of bands) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, b.y, width, b.h);
          ctx.clip();
          ctx.clearRect(0, b.y, width, b.h);
          ctx.translate(b.dx, 0);
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 1.6;
          ctx.stroke(frame.front);
          ctx.restore();
        }
      }
    }
  };

  // 30 images/s suffisent à une rotation lente et divisent le coût par deux :
  // à pleine cadence, le globe pesait lourd dans le temps de rendu mesuré sur mobile.
  let last = 0;
  const loop = (now: number) => {
    if (now - last >= 33) {
      last = now;
      draw(now);
    }
    if (running) raf = requestAnimationFrame(loop);
  };

  let ready = document.readyState === 'complete';
  let wanted = false;
  const start = () => {
    wanted = true;
    if (running || reduceMotion || !ready) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    wanted = false;
    running = false;
    cancelAnimationFrame(raf);
  };
  // La rotation attend la fin du chargement : une image fixe s'affiche d'abord.
  if (!ready) {
    addEventListener('load', () => {
      ready = true;
      if (wanted) start();
    }, { once: true });
  }

  resize();
  draw(performance.now());
  new ResizeObserver(() => {
    resize();
    draw(performance.now());
  }).observe(canvas);
  // Hors de l'écran, le globe ne tourne pas : batterie et processeur épargnés.
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas);
}

export function mountGlobes() {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-globe]').forEach(mount);
}
