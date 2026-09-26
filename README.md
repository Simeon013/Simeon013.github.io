# darkfolio

Portfolio de Siméon Daouda. Site statique Astro, bilingue : français à la racine (`/`), anglais sous `/en/`.

## Commandes

```bash
npm install
npm run dev        # http://localhost:4321
npm run validate   # astro check + build : à lancer avant tout commit
npm run preview    # sert le dossier dist/ généré
```

Le build produit du HTML statique dans `dist/`, déployable tel quel (GitHub Pages, Vercel, Hostinger mutualisé).

## Où modifier quoi

| Quoi | Où |
|---|---|
| Textes de l'interface (fr / en) | `src/i18n/ui.ts` |
| Projets, archives, stack, liens de contact | `src/data/projects.ts` |
| Captures des projets | `src/assets/projects/` (PNG ou JPG, converties en WebP au build) |
| Globe animé | `src/scripts/globe.ts` |
| Titre qui glitche | `src/scripts/glitch-title.ts` |
| Couleurs, polices, boutons | `src/styles/global.css` |

Ajouter une langue : l'ajouter dans `astro.config.mjs` (`i18n.locales`), dans `locales` et le dictionnaire de `src/i18n/ui.ts`, puis créer `src/pages/<langue>/index.astro`.

## Structure de la page

Présentation (nom, rôle, accroche, CV) → À propos → Projets (réalisations, puis expérimentations) → Services → Parcours → Contact → footer.

Chaque section répond à une question du visiteur, dans l'ordre où il se la pose : qui es-tu, qu'as-tu fait, que peux-tu faire pour moi, d'où viens-tu, comment te joindre. Le CV téléchargeable est `public/cv/simeon-daouda-cv.pdf`.

## Choix qui ont une raison

- **Le globe est une signature, pas le hero entier.** Une version avec le globe plein écran et le texte centré dessous a été rejetée : un portfolio doit d'abord présenter la personne. Idem pour une « définition de dictionnaire » du mot mercenaire, et pour des titres de section écrits en balises (`<travaux>` … `</travaux>`), jugés incompréhensibles.
- **Les expérimentations sont annoncées comme telles** (« en cours », « prototype », « exercice ») : ce sont des projets de test, non déployés.

- **Le globe est dessiné en `<canvas>`, pas en SVG.** Dans les maquettes, il était en SVG reconstruit à chaque image : des milliers de segments recalculés dans le DOM, ce qui rame sur un téléphone d'entrée de gamme. Le canvas redessine sans toucher au DOM, et le globe se met en pause quand il sort de l'écran.
- **Pas de texte barré pour montrer l'ancien intitulé.** Une version « diff » (ancien texte barré, nouveau en dessous) a été rejetée comme maladroite. L'ancien intitulé glitche puis se recompose : c'est `glitch-title.ts`. Les lecteurs d'écran lisent directement l'intitulé final.
- **Un seul visuel fort : le globe.** Une version globe + scène isométrique a été essayée et rejetée : deux visuels se font concurrence.
- **Polices auto-hébergées** (`@fontsource`) plutôt que Google Fonts : une connexion à un domaine tiers en moins au chargement.
- **Les captures passent par `astro:assets`.** Les PNG d'origine pesaient 3,8 Mo à eux seuls ; convertis en WebP aux bonnes tailles, ils tombent à quelques dizaines de Ko chacun.
- **QuickEat et Axory n'ont pas de capture** : leur visuel est une maquette dessinée en CSS, signalée comme « illustration ». À remplacer dès que les vraies captures existent (`visual: { kind: 'image', ... }` dans `projects.ts`).

## Reste à faire

- Renseigner `site` dans `astro.config.mjs` une fois le domaine choisi (URL canoniques et hreflang absolues).
- Vraies captures de QuickEat et d'Axory.
