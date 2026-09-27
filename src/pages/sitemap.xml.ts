import type { APIRoute } from 'astro';
import { getAbsoluteLocaleUrl } from 'astro:i18n';
import { locales, type Locale } from '../i18n/ui';
import { caseStudies, caseStudyPath } from '../data/case-studies';

// Écrit à la main plutôt qu'avec @astrojs/sitemap : une poignée de pages, une dépendance de moins.
// Chaque page déclare ses équivalents dans l'autre langue, pour Google.
export const GET: APIRoute = () => {
  const pages: ((l: Locale) => string)[] = [
    () => '',
    ...caseStudies.map((c) => (l: Locale) => caseStudyPath[l](c.slug)),
  ];
  const urls = pages.flatMap((pathOf) => {
    const alternates = locales
      .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${getAbsoluteLocaleUrl(l, pathOf(l))}"/>`)
      .join('\n');
    return locales.map((l) => `  <url>\n    <loc>${getAbsoluteLocaleUrl(l, pathOf(l))}</loc>\n${alternates}\n  </url>`);
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
