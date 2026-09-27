// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Site principal du compte GitHub (dépôt Simeon013.github.io) : servi à la
  // racine. Avant le renommage, le dépôt « darkfolio » imposait un sous-chemin
  // /darkfolio/ et une fonction pour préfixer chaque lien interne.
  site: 'https://simeon013.github.io',
  build: {
    // Le CSS (≈15 Ko) inclus dans la page : sans ça, Lighthouse mesurait
    // 320 ms d'affichage bloqué par la feuille de style séparée sur mobile.
    inlineStylesheets: 'always',
  },
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      // Le français reste à la racine (/), l'anglais vit sous /en/.
      prefixDefaultLocale: false,
    },
  },
});
