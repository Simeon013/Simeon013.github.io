import type { APIRoute } from 'astro';
import { getAbsoluteLocaleUrl } from 'astro:i18n';
import { locales } from '../i18n/ui';

// Deux pages seulement : un sitemap écrit à la main évite une dépendance de plus.
// Chaque page déclare ses équivalents dans l'autre langue, pour Google.
export const GET: APIRoute = () => {
  const alternates = locales
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${getAbsoluteLocaleUrl(l, '')}"/>`)
    .join('\n');
  const urls = locales
    .map((l) => `  <url>\n    <loc>${getAbsoluteLocaleUrl(l, '')}</loc>\n${alternates}\n  </url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
