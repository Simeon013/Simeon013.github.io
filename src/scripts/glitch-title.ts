// L'ancien intitulé glitche puis se recompose en la bonne formule.
// Remplace un texte barré : Siméon trouvait le « avant / après » barré maladroit.

const GLYPHS = '!<>/\\_=+*#01[]{}';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function pulse(el: HTMLElement, ms: number) {
  el.classList.add('is-glitching');
  await wait(ms);
  el.classList.remove('is-glitching');
}

async function scramble(el: HTMLElement, target: string, duration: number) {
  const start = performance.now();
  return new Promise<void>((resolve) => {
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

async function run(title: HTMLElement) {
  const text = title.querySelector<HTMLElement>('[data-glitch-text]');
  const after = title.dataset.after;
  if (!text || !after) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    text.textContent = after;
    text.dataset.text = after;
    return;
  }

  await wait(1100);
  await pulse(text, 320);
  text.classList.add('is-glitching');
  await scramble(text, after, 900);
  text.classList.remove('is-glitching');

  // Une fois posé, le titre tressaille de temps en temps, comme un signal instable.
  const flicker = async () => {
    await wait(5000 + Math.random() * 5000);
    await pulse(text, 180);
    flicker();
  };
  flicker();
}

export function mountGlitchTitles() {
  document.querySelectorAll<HTMLElement>('[data-glitch-title]').forEach(run);
}
