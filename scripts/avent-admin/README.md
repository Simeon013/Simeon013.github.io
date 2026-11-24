# Admin du jeu de l'Avent

Page d'administration (artifact claude.ai privé : https://claude.ai/artifact/BMj5tzEsvVHrtNxVKFYByV).
Elle lit la base Supabase par le connecteur de Siméon (`execute_sql`, avec ses droits) : aucune clé dans la page.

Les 24 grilles et leurs solutions sont lues dans la table privée `avent_grilles` : elles ne sont jamais dans le dépôt.
Pour republier la page : remplacer `__ENTRAINEMENTS__` dans `admin.template.html` par la liste des grilles
d'entraînement (jour 0) de `src/data/avent-niveaux.json` (en écrivant chaque `<` sous la forme `\u003c`), puis publier le fichier.

Onglet Classement › joueurs : le bouton « C'est moi (organisateur) » met ton appareil hors classement et lui ouvre
toutes les grilles en avance (ouvre le jeu avec `#apercu` à la fin de l'adresse pour les voir dans le calendrier).
