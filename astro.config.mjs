// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Le domaine définitif n'est pas encore choisi : à renseigner pour obtenir
  // des URL canoniques et hreflang absolues.
  // site: 'https://exemple.com',
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      // Le français reste à la racine (/), l'anglais vit sous /en/.
      prefixDefaultLocale: false,
    },
  },
});
