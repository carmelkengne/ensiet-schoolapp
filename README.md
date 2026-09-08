# Système de gestion scolaire — ENSIET Douala

## Contenu de ce projet

- `pages/` — les écrans du site (accueil, élèves, notes, bulletin)
- `components/` — les blocs d'interface réutilisables
- `lib/bulletin.js` — le moteur de calcul (moyennes, blocs, rangs)
- `db/schema.sql` — la structure de la base de données PostgreSQL

## État actuel

Les écrans utilisent pour l'instant des données d'exemple (elèves et notes
fictifs) directement dans le code, pour pouvoir être testés sans base de
données connectée. La prochaine étape est de remplacer ces données par de
vrais appels à la base (via des routes `pages/api/...`).

## Mise en ligne (résumé)

1. Déposer ce dossier dans un dépôt GitHub
2. Sur Neon : créer un projet, copier la chaîne de connexion (`DATABASE_URL`)
   et l'exécuter `db/schema.sql` dans l'éditeur SQL de Neon pour créer les tables
3. Sur Vercel : importer le dépôt GitHub, ajouter `DATABASE_URL` dans les
   variables d'environnement du projet, déployer
