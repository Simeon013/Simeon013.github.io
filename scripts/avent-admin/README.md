# Admin du jeu de l'Avent

Page d'administration (artifact claude.ai privé : https://claude.ai/artifact/BMj5tzEsvVHrtNxVKFYByV).
Elle lit la base Supabase par le connecteur de Siméon (`execute_sql`, avec ses droits) : aucune clé dans la page.

Pour la republier après un changement des grilles : remplacer `__NIVEAUX__` dans `admin.template.html` par le
contenu de `src/data/avent-niveaux.json` (en écrivant chaque `<` sous la forme `<`), puis publier le fichier.
