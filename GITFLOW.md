# Gitflow et Conventions de Commit

## Gitflow - Stratégie de Branches

Ce projet utilise le modèle Gitflow pour la gestion des branches.

### Branches principales

- **`main`** : Branche de production, contient uniquement le code stable et déployé
- **`develop`** : Branche de développement, intégration des nouvelles fonctionnalités

### Branches de support

- **`feature/*`** : Nouvelles fonctionnalités

  - Création depuis : `develop`
  - Fusion dans : `develop`
  - Convention : `feature/nom-de-la-fonctionnalite`
  - Exemple : `feature/dashboard-admin`, `feature/enphase-integration`

- **`fix/*`** : Corrections de bugs (développement)

  - Création depuis : `develop`
  - Fusion dans : `develop`
  - Convention : `fix/description-du-bug`
  - Exemple : `fix/login-error`, `fix/data-display`

- **`hotfix/*`** : Corrections urgentes en production

  - Création depuis : `main`
  - Fusion dans : `main` ET `develop`
  - Convention : `hotfix/description-critique`
  - Exemple : `hotfix/security-vulnerability`, `hotfix/production-crash`

- **`release/*`** : Préparation d'une nouvelle version
  - Création depuis : `develop`
  - Fusion dans : `main` ET `develop`
  - Convention : `release/v1.2.3`
  - Exemple : `release/v1.0.0`, `release/v2.1.0`

## Workflow Gitflow

### Développer une nouvelle fonctionnalité

```bash
# 1. Créer une branche feature depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/ma-nouvelle-fonctionnalite

# 2. Développer et commiter
git add .
git commit -m "feat: ajout de ma nouvelle fonctionnalité"

# 3. Pousser la branche
git push origin feature/ma-nouvelle-fonctionnalite

# 4. Créer une Pull Request vers develop sur GitHub
# 5. Après review et merge, supprimer la branche locale
git checkout develop
git pull origin develop
git branch -d feature/ma-nouvelle-fonctionnalite
```

### Corriger un bug

```bash
# 1. Créer une branche fix depuis develop
git checkout develop
git pull origin develop
git checkout -b fix/correction-bug

# 2. Corriger et commiter
git add .
git commit -m "fix: correction du bug de connexion"

# 3. Pousser et créer une PR vers develop
git push origin fix/correction-bug
```

### Hotfix urgent en production

```bash
# 1. Créer une branche hotfix depuis main
git checkout main
git pull origin main
git checkout -b hotfix/correction-critique

# 2. Corriger et commiter
git add .
git commit -m "hotfix: correction critique de sécurité"

# 3. Merger dans main
git checkout main
git merge --no-ff hotfix/correction-critique
git tag -a v1.0.1 -m "Hotfix v1.0.1"
git push origin main --tags

# 4. Merger aussi dans develop
git checkout develop
git merge --no-ff hotfix/correction-critique
git push origin develop

# 5. Supprimer la branche hotfix
git branch -d hotfix/correction-critique
```

### Préparer une release

```bash
# 1. Créer une branche release depuis develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. Finaliser (bump version, changelog, etc.)
# Mettre à jour package.json, CHANGELOG.md

git add .
git commit -m "chore: préparation release v1.0.0"

# 3. Merger dans main
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# 4. Merger aussi dans develop
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# 5. Supprimer la branche release
git branch -d release/v1.0.0
```

## Conventions de Commit (Commitlint)

Ce projet utilise **Conventional Commits** avec validation automatique via commitlint.

### Format du message de commit

```
<type>(<scope optionnel>): <description>

[corps optionnel]

[footer optionnel]
```

### Types de commit

| Type       | Description                            | Exemple                                      |
| ---------- | -------------------------------------- | -------------------------------------------- |
| `feat`     | Nouvelle fonctionnalité                | `feat: ajout du tableau de bord admin`       |
| `fix`      | Correction de bug                      | `fix: correction de l'affichage des données` |
| `docs`     | Documentation uniquement               | `docs: mise à jour du README`                |
| `style`    | Formatage, pas de changement de code   | `style: formatage du code avec Prettier`     |
| `refactor` | Refactoring sans bug ni fonctionnalité | `refactor: réorganisation des composants`    |
| `perf`     | Amélioration des performances          | `perf: optimisation des requêtes DB`         |
| `test`     | Ajout ou correction de tests           | `test: ajout tests pour AuthService`         |
| `build`    | Système de build ou dépendances        | `build: mise à jour de Next.js vers 14.2`    |
| `ci`       | Configuration CI/CD                    | `ci: ajout workflow GitHub Actions`          |
| `chore`    | Maintenance, configuration             | `chore: mise à jour des dépendances`         |
| `revert`   | Annulation d'un commit précédent       | `revert: annulation du commit abc123`        |

### Règles

- **Type** : obligatoire, en minuscules
- **Scope** : optionnel, entre parenthèses (ex: `feat(auth):`)
- **Description** : obligatoire, commence par une minuscule, pas de point final
- **Longueur max** : 100 caractères pour la première ligne

### Exemples valides

```bash
feat: ajout du système d'authentification JWT
fix: correction du bug de rafraîchissement des données
docs: mise à jour du guide d'installation
style: formatage du code selon ESLint
refactor(dashboard): simplification de la logique de calcul
perf: optimisation du cache Enphase
test: ajout des tests pour le service Enphase
build: ajout de commitlint et husky
ci: configuration du workflow de tests
chore: nettoyage des fichiers temporaires
```

### Exemples invalides

```bash
# ❌ Type manquant
Update README

# ❌ Type en majuscule
Feat: nouvelle fonctionnalité

# ❌ Point final
feat: nouvelle fonctionnalité.

# ❌ Première lettre en majuscule
feat: Nouvelle fonctionnalité

# ❌ Type incorrect
update: modification du code
```

### Commits avec corps et footer

```bash
feat(dashboard): ajout du graphique de production mensuelle

Implémentation d'un graphique interactif affichant la production
mensuelle avec Chart.js. Permet de visualiser les tendances.

Closes #42
```

## Commandes Git utiles

```bash
# Voir l'historique des commits
git log --oneline --graph --all

# Voir les branches
git branch -a

# Voir le statut
git status

# Créer une branche
git checkout -b nom-branche

# Changer de branche
git checkout nom-branche

# Mettre à jour depuis origin
git pull origin nom-branche

# Voir les différences
git diff

# Annuler des modifications non commitées
git restore fichier.ts
git restore .

# Amender le dernier commit (avant push)
git commit --amend

# Voir les commits d'une branche
git log branche-1..branche-2
```

## Configuration Git recommandée

```bash
# Configurer votre identité
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@exemple.com"

# Configurer l'éditeur par défaut
git config --global core.editor "code --wait"

# Activer les couleurs
git config --global color.ui auto

# Configurer le pull en rebase par défaut
git config --global pull.rebase true
```

## Protection des branches

Sur GitHub, les branches `main` et `develop` doivent être protégées :

- Require pull request reviews before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators (pour éviter les push directs)

## Bonnes pratiques

1. **Toujours créer une branche** pour vos modifications
2. **Commits atomiques** : un commit = une modification logique
3. **Messages clairs** : respecter les conventions
4. **Pull requests** : toujours passer par une PR pour merger
5. **Review de code** : faire relire vos modifications
6. **Tester** : s'assurer que les tests passent avant de merger
7. **Mettre à jour régulièrement** : `git pull` fréquemment
8. **Nettoyer** : supprimer les branches mergées

## Ressources

- [Gitflow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)
