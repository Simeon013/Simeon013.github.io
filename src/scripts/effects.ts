// Effets glitch communs à tout le site : titres qui se décodent à l'apparition,
// éléments qui entrent en « tranches », déchirures d'écran ponctuelles et
// projets qui décrochent de temps à autre.

const GLYPHS = '!<>/\\_=+*#01[]{}%$';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scrambleTo(el: HTMLElement, target: string, duration = 700) {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const settled = Math.floor(progress * target.length);
      let out = '';
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        out += i < settled || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      el.dataset.text = out;
      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function mountReveals() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal], [data-scramble]');
  if (reduceMotion()) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        el.classList.add('is-in');
        if (el.hasAttribute('data-scramble')) {
          const target = el.dataset.final ?? el.textContent ?? '';
          el.classList.add('is-glitching');
          scrambleTo(el, target).then(() => el.classList.remove('is-glitching'));
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  items.forEach((el) => {
    if (el.hasAttribute('data-scramble')) {
      el.dataset.final = el.textContent ?? '';
      el.dataset.text = el.dataset.final;
    }
    observer.observe(el);
  });
}

// Une déchirure d'écran brève, à intervalles irréguliers : le signal qui saute.
function mountScreenTear() {
  const layer = document.querySelector<HTMLElement>('[data-tear]');
  if (!layer || reduceMotion()) return;
  const tear = () => {
    layer.replaceChildren();
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const band = document.createElement('span');
      band.style.top = `${Math.random() * 100}%`;
      band.style.height = `${2 + Math.random() * 18}px`;
      band.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
      band.className = Math.random() > 0.5 ? 'tear-band is-violet' : 'tear-band';
      layer.append(band);
    }
    layer.classList.add('is-on');
    setTimeout(() => layer.classList.remove('is-on'), 120 + Math.random() * 140);
    setTimeout(tear, 6000 + Math.random() * 9000);
  };
  setTimeout(tear, 3500);
}

// Un projet visible au hasard décroche brièvement, sans attendre le survol.
function mountCardFlicker() {
  if (reduceMotion()) return;
  const cards = [...document.querySelectorAll<HTMLElement>('[data-flicker]')];
  if (!cards.length) return;
  const visible = new Set<HTMLElement>();
  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target as HTMLElement) : visible.delete(e.target as HTMLElement);
  });
  cards.forEach((c) => observer.observe(c));
  const flicker = () => {
    const pool = [...visible];
    if (pool.length) {
      const card = pool[Math.floor(Math.random() * pool.length)];
      card.classList.add('is-glitching');
      setTimeout(() => card.classList.remove('is-glitching'), 260);
    }
    setTimeout(flicker, 2200 + Math.random() * 3000);
  };
  setTimeout(flicker, 2000);
}

export function mountEffects() {
  mountReveals();
  mountScreenTear();
  mountCardFlicker();
}
