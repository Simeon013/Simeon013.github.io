// Génère public/cv/simeon-daouda-cv.pdf (fr) et simeon-daouda-cv-en.pdf (en) à partir de contenu.mjs.
// Chrome imprime le HTML en PDF : le texte reste du vrai texte (lisible par les logiciels de tri des
// recruteurs), contrairement à l'ancien CV fait sous Canva, qu'il fallait refaire à la main à chaque
// changement. Chrome est cherché dans CHROME_PATH, puis aux emplacements habituels.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { contacts, cv } from './contenu.mjs';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const build = join(racine, 'cv', '.build');
const sortie = join(racine, 'public', 'cv');
mkdirSync(build, { recursive: true });
mkdirSync(sortie, { recursive: true });

const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && existsSync(p));
if (!chrome) throw new Error('Chrome introuvable : définir CHROME_PATH.');

const police = (paquet, fichier) =>
  pathToFileURL(join(racine, 'node_modules', '@fontsource', paquet, 'files', fichier)).href;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const css = readFileSync(join(racine, 'cv', 'style.css'), 'utf8')
  .replace('{{chakra600}}', police('chakra-petch', 'chakra-petch-latin-600-normal.woff2'))
  .replace('{{chakra700}}', police('chakra-petch', 'chakra-petch-latin-700-normal.woff2'))
  .replace('{{plex400}}', police('ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2'))
  .replace('{{plex500}}', police('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2'))
  .replace('{{plex600}}', police('ibm-plex-mono', 'ibm-plex-mono-latin-600-normal.woff2'));

function html(c) {
  const titre = (t) => `<h2 class="titre"><span aria-hidden="true">//</span> ${esc(t)}</h2>`;
  const liens = contacts
    .map((k) => `<li><a href="${c.lang === 'en' && k.hrefEn ? k.hrefEn : k.href}">${esc(k.label)}</a></li>`)
    .join('');
  const experiences = c.experiences
    .map(
      (e) => `<article class="exp">
      <header><h3>${esc(e.poste)} <span class="exp__lieu">· ${esc(e.lieu)}</span></h3><p class="periode">${esc(e.periode)}</p></header>
      <ul>${e.points.map(([fort, reste]) => `<li>${fort ? `<strong>${esc(fort)}</strong>` : ''}${esc(reste)}</li>`).join('')}</ul>
    </article>`,
    )
    .join('');
  const competences = c.competences.map(([g, v]) => `<dt>${esc(g)}</dt><dd>${esc(v)}</dd>`).join('');
  const formation = c.formation
    .map((f) => `<li><strong>${esc(f.titre)}</strong><span>${esc(f.lieu)} · ${esc(f.periode)}</span></li>`)
    .join('');
  const langues = c.langues.map(([l, n]) => `<li><strong>${esc(l)}</strong><span>${esc(n)}</span></li>`).join('');

  return `<!doctype html>
<html lang="${c.lang}"><head><meta charset="utf-8"><title>${esc(c.titrePage)}</title><style>${css}</style></head>
<body><main class="page">
  <header class="tete">
    <div>
      <p class="signature" aria-hidden="true">&lt;/SD&gt;</p>
      <h1>Siméon Daouda<span class="curseur" aria-hidden="true">_</span></h1>
      <p class="role">${esc(c.role)}</p>
      <p class="sous-role">${esc(c.sousRole)} · ${esc(c.lieu)}</p>
    </div>
    <ul class="contacts">${liens}</ul>
  </header>
  <div class="trait" aria-hidden="true"></div>
  <section>${titre(c.sections.profil)}<p class="profil">${esc(c.profil)}</p></section>
  <section>${titre(c.sections.experience)}${experiences}</section>
  <div class="bas">
    <section>${titre(c.sections.competences)}<dl class="competences">${competences}</dl></section>
    <div>
      <section>${titre(c.sections.formation)}<ul class="liste">${formation}</ul></section>
      <section>${titre(c.sections.langues)}<ul class="liste">${langues}</ul></section>
    </div>
  </div>
</main></body></html>`;
}

for (const c of Object.values(cv)) {
  const source = join(build, `cv-${c.lang}.html`);
  const pdf = join(sortie, c.fichier);
  writeFileSync(source, html(c));
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--allow-file-access-from-files',
    `--print-to-pdf=${pdf}`,
    pathToFileURL(source).href,
  ], { stdio: 'ignore' });
  // Le CV doit tenir sur une page : un contenu qui déborde ferait une 2e page presque vide.
  const pages = (readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length;
  console.log(`${c.fichier} : ${pages} page(s)`);
  if (pages !== 1) {
    console.error('Le CV ne tient pas sur une page : raccourcir le contenu.');
    process.exitCode = 1;
  }
}
