// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Site principal du compte GitHub (dépôt Simeon013.github.io) : servi à la
  // racine. Avant le renommage, le dépôt « darkfolio » imposait un sous-chemin
  // /darkfolio/ et une fonction pour préfixer chaque lien interne.
  site: 'https://simeon013.github.io',
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      // Le français reste à la racine (/), l'anglais vit sous /en/.
      prefixDefaultLocale: false,
    },
  },
});
