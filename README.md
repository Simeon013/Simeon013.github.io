# Simeon013.github.io

Portfolio de Siméon Daouda, en ligne sur **https://simeon013.github.io/** (anglais : `/en/`). Site statique Astro, bilingue : français à la racine, anglais sous `/en/`.

## Commandes

```bash
npm install
npm run dev        # http://localhost:4321
npm run validate   # astro check + build : à lancer avant tout commit
npm run preview    # sert le dossier dist/ généré
```

Le build produit du HTML statique dans `dist/`.

## Déploiement

Le workflow `.github/workflows/deploy.yml` compile et publie le site sur GitHub Pages à chaque push sur `main`. Il suppose que **Settings › Pages › Source** vaut **GitHub Actions** : l'ancien réglage « Deploy from a branch » publiait le dépôt tel quel, ce qui marchait pour l'ancien site en HTML pur mais servirait les sources Astro non compilées.

**Pourquoi ce nom de dépôt.** Le dépôt s'appelait `darkfolio`, et GitHub Pages sert un dépôt ordinaire sous un sous-chemin (`simeon013.github.io/darkfolio/`). Il fallait alors déclarer ce sous-chemin à Astro et préfixer chaque lien interne, sinon les favicons, le manifeste et le CV visaient la racine du domaine et cassaient en ligne. Renommé en `Simeon013.github.io`, le dépôt devient le site principal du compte, servi à la racine : les liens s'écrivent simplement `/icons/...`.

L'ancienne adresse reste citée dans le CV : `public/darkfolio/` contient deux pages qui redirigent `/darkfolio/` vers `/` et `/darkfolio/en/` vers `/en/`.

Avec un domaine personnalisé plus tard : changer `site` dans `astro.config.mjs` et configurer le domaine dans Settings › Pages.

## Où modifier quoi

| Quoi | Où |
|---|---|
| Textes de l'interface (fr / en) | `src/i18n/ui.ts` |
| Projets, expérimentations, compétences, parcours, contact | `src/data/projects.ts` |
| Études de cas (QuickEat, ICIBillet Scan) | `src/data/case-studies.ts`, captures dans `src/assets/case-studies/` |
| Captures des projets | `src/assets/projects/` (PNG ou JPG, converties en WebP au build) |
| CV téléchargeable | `public/cv/simeon-daouda-cv.pdf` |
| Globe animé | `src/scripts/globe.ts` |
| Effets glitch (titres, déchirures, apparitions) | `src/scripts/effects.ts` |
| Titre qui glitche dans la présentation | `src/scripts/glitch-title.ts` |
| Couleurs, polices, boutons, couche d'écran | `src/styles/global.css` |
| Vignette de partage (WhatsApp, LinkedIn…) | `python scripts/og-image.py` → `public/og-fr.png`, `public/og-en.png` |

Ajouter une langue : l'ajouter dans `astro.config.mjs` (`i18n.locales`), dans `locales` et le dictionnaire de `src/i18n/ui.ts`, puis créer `src/pages/<langue>/index.astro`.

## Structure de la page

Présentation (nom, rôle, accroche, CV) → À propos → Projets (réalisations, puis expérimentations) → Services → Parcours → Contact → footer.

Chaque section répond à une question du visiteur, dans l'ordre où il se la pose : qui es-tu, qu'as-tu fait, que peux-tu faire pour moi, d'où viens-tu, comment te joindre.

Les études de cas vivent sous `/projets/<slug>/` (français) et `/en/work/<slug>/` (anglais). **Règle pour QuickEat : ne dire que ce que le produit fait aujourd'hui.** La liste noire est dans le dépôt QuickEat (`docs/communication.md`) : aucun nombre de clients, pas de Mobile Money, pas de commande à emporter à l'écrit. Les captures viennent de « Le Béninois », restaurant fictif de préproduction.

## Choix qui ont une raison

- **Le globe est une signature, pas le hero entier.** Une version avec le globe plein écran et le texte centré dessous a été rejetée : un portfolio doit d'abord présenter la personne. Idem pour une « définition de dictionnaire » du mot mercenaire, et pour des titres de section écrits en balises (`<travaux>` … `</travaux>`), jugés incompréhensibles.
- **Le glitch est partout, mais bref.** Une version trop calme a été jugée fade. Les effets (déchirures d'écran, titres qui se décodent, apparitions en tranches, projets qui décrochent) sont courts et espacés, et tous s'arrêtent quand l'appareil demande moins de mouvement.
- **Le globe est dessiné en `<canvas>`, pas en SVG.** Dans les maquettes, il était en SVG reconstruit à chaque image : des milliers de segments recalculés dans le DOM, ce qui rame sur un téléphone d'entrée de gamme. Le canvas redessine sans toucher au DOM, et le globe se met en pause quand il sort de l'écran.
- **Pas de texte barré pour montrer l'ancien intitulé.** Une version « diff » (ancien texte barré, nouveau en dessous) a été rejetée comme maladroite. L'ancien intitulé glitche puis se recompose. Les lecteurs d'écran lisent directement l'intitulé final.
- **Un seul visuel fort : le globe.** Une version globe + scène isométrique a été essayée et rejetée : deux visuels se font concurrence.
- **Les expérimentations sont annoncées comme telles** (« en cours », « prototype », « exercice ») : ce sont des projets de test, non déployés.
- **Polices auto-hébergées** (`@fontsource`) plutôt que Google Fonts : une connexion à un domaine tiers en moins au chargement.
- **Les captures passent par `astro:assets`.** Les PNG d'origine pesaient 3,8 Mo à eux seuls ; convertis en WebP aux bonnes tailles, ils tombent à quelques dizaines de Ko chacun.

## Performance

Mesurée avec Lighthouse, profil mobile (téléphone milieu de gamme, 4G lente simulée) : 99–100 en performance, 100 en accessibilité, bonnes pratiques et SEO. Avant les corrections ci-dessous : 80, avec 3,4 s avant l'affichage du contenu principal.

Ce qui coûtait, et ne doit pas revenir :
- **Google Analytics chargé d'emblée** : 172 Ko (64 % de la page) et 0,5 s de JavaScript avant tout affichage. Il est chargé à la première interaction ou au bout de 6 s (`src/layouts/Base.astro`).
- **Animations sur `top`, `box-shadow` ou avec `mix-blend-mode` plein écran** : elles recalculent la mise en page ou repeignent toute la page à chaque image. N'animer que `transform` et `opacity`.
- **Feuille de style séparée** : 320 ms d'affichage bloqué. Le CSS est inclus dans la page (`inlineStylesheets` dans `astro.config.mjs`).
- **Polices non préchargées** : le texte sautait à l'arrivée des polices. Les trois du haut de page sont préchargées.
- Le globe tourne à 30 images/s et ne démarre qu'après le chargement.

## Reste à faire

- Vraies captures de l'application d'assurance et d'ICIBillet Scan : l'assurance a une maquette CSS signalée comme illustration, ICIBillet un visuel de présentation.
- Une photo pour remplacer la silhouette de la carte d'identité (`src/components/IdCard.astro`).
- Mettre le CV à jour.
