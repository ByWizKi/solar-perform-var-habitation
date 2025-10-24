# Solar Perform - Instance Var Habitat

Solution de suivi et d'analyse de production solaire développée par **Solar Perform** pour le client **Var Habitat**.

> **À propos** : Solar Perform propose des solutions de visualisation personnalisées pour le monitoring de production solaire.
> Cette instance est spécifiquement configurée et déployée pour Var Habitat.

> **Note technique** : Cette version se concentre sur le **suivi de la production solaire**.
> Les fonctionnalités de suivi de consommation et de batterie ne sont pas implémentées dans cette version.

## Description

Cette plateforme de monitoring connectée à l'API Enphase permet aux utilisateurs de Var Habitat de :

- Suivre leur production solaire en temps réel
- Visualiser la production journalière, mensuelle et totale
- Consulter l'historique de production sur 14 jours
- Calculer l'impact environnemental de leur production
- Gérer une hiérarchie d'utilisateurs avec différents niveaux d'accès

## Fonctionnalités

### Authentification et Gestion des Utilisateurs

- Inscription et connexion sécurisées
- Gestion de profil utilisateur
- Tokens JWT avec refresh automatique
- Modification de mot de passe avec changement initial forcé pour les nouveaux utilisateurs
- **Système de rôles** : VIEWER, ADMIN, SUPER_ADMIN
- **Hiérarchie utilisateurs** :
  - SUPER_ADMIN peut créer des ADMIN
  - ADMIN peut créer des VIEWER
  - Les VIEWER voient les données de leur ADMIN parent en temps réel
- Interface d'administration pour la gestion des utilisateurs
- Dashboard spécifique pour les Super Admins

### Dashboard de Production

- Vue d'ensemble de la production solaire
- **Production actuelle** : Puissance instantanée
- **Production du jour** : Énergie produite aujourd'hui avec valeur en euros
- **Production totale** : Énergie produite depuis l'installation avec valeur en euros
- **Historique** : Tableau des 14 derniers jours avec production et valeur quotidienne
- **Calculs environnementaux** :
  - CO2 évité
  - Équivalent en arbres plantés
  - Équivalent en kilomètres en voiture électrique
- Horodatage de la dernière mise à jour
- Informations système (statut, puissance installée)

### Intégration Enphase

- Connexion OAuth 2.0 sécurisée
- Synchronisation manuelle des données (pour ADMIN)
- Synchronisation automatique pour les VIEWER (détection des mises à jour en temps réel)
- Cache intelligent pour optimiser les appels API
- Logging de tous les appels API
- **Limitation ADMIN** : 15 actualisations par jour pour respecter le quota Enphase

### Gestion du Quota API Enphase

- Compteur d'appels API par connexion
- Limite de 15 actualisations par jour par ADMIN
- Cache en base de données pour les données historiques (permanent)
- Cache des informations système (24h)
- Visualisation du nombre d'actualisations restantes

## Technologies

### Frontend

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **React Context** (gestion d'état)

### Backend

- **Next.js API Routes**
- **PostgreSQL** (base de données)
- **Prisma ORM**
- **JWT** (authentification)
- **bcrypt** (hachage de mots de passe)
- **Zod** (validation)

### Infrastructure et Qualité

- **Docker** (conteneurisation PostgreSQL)
- **Jest** (tests unitaires et d'intégration)
- **ESLint** (linting)
- **Makefile** (automatisation des tâches)

### APIs Externes

- **Enphase Energy API v4**
  - OAuth 2.0 pour l'authentification
  - System Summary (informations système et production actuelle)
  - Energy Lifetime (historique de production)
  - Latest Telemetry (données en temps réel)

## Installation

> **Note** : Cette section est destinée aux équipes techniques de Solar Perform ou de Var Habitat pour le déploiement et la maintenance de l'instance.

### Prérequis

- Node.js 18+
- Docker & Docker Compose
- Compte Enphase Developer (pour les clés API Enphase)
- Accès aux credentials du client Var Habitat

### 1. Cloner le projet

```bash
git clone https://github.com/ByWizKi/solar-perform-var-habitation.git
cd solar-perform-var-habitation
```

### 2. Configuration

**IMPORTANT** : Suivre ces étapes pour une configuration sécurisée.

#### Copier le template

```bash
cp .env.example .env
```

#### Générer des secrets forts

```bash
# Générer JWT_SECRET (minimum 32 caractères)
openssl rand -base64 32

# Générer JWT_REFRESH_SECRET (différent du premier)
openssl rand -base64 32
```

#### Éditer le fichier `.env`

```env
# Database
DATABASE_URL="postgresql://solarperform:VOTRE-MOT-DE-PASSE-FORT@localhost:5432/solarperform"

# JWT (utiliser les secrets générés ci-dessus)
JWT_SECRET="le-secret-genere-avec-openssl"
JWT_REFRESH_SECRET="un-autre-secret-genere-avec-openssl"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Enphase (obtenir sur https://developer-v4.enphase.com/)
ENPHASE_CLIENT_ID="votre-client-id"
ENPHASE_CLIENT_SECRET="votre-client-secret"
ENPHASE_API_KEY="votre-api-key"
ENPHASE_REDIRECT_URI="http://localhost:3000/api/connections/enphase/callback"
```

#### Sécuriser les permissions

```bash
chmod 600 .env
```

**Note** : Le fichier `.env` ne doit JAMAIS être committé dans Git. Il est déjà dans `.gitignore`.

### 3. Démarrer avec Docker

```bash
# Démarrer PostgreSQL
docker-compose up -d

# Installer les dépendances
npm install

# Appliquer les migrations
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate

# Démarrer en développement
npm run dev
```

L'application sera disponible sur http://localhost:3000

## Guide de démarrage rapide

### Pour le Super Admin (première installation)

1. Créer le compte Super Admin avec le script :

```bash
npx ts-node scripts/create-super-admin.ts [username] [password] [prénom] [nom]
# Exemple: npx ts-node scripts/create-super-admin.ts admin Password123! Admin Var
```

2. Se connecter à `/login`
3. Créer des comptes ADMIN depuis le Super Admin Dashboard (`/super-admin-dashboard`)

### Pour un Admin

1. Se connecter avec les identifiants fournis
2. Changer le mot de passe lors de la première connexion
3. Aller dans `/connections` pour connecter Enphase (redirection automatique)
4. Autoriser l'accès sur le portail Enphase
5. Consulter le dashboard de production
6. (Optionnel) Créer des comptes VIEWER dans `/admin`

### Pour un Viewer

1. Se connecter avec les identifiants fournis
2. Changer le mot de passe lors de la première connexion
3. Consulter le dashboard (synchronisation automatique avec l'ADMIN parent)

## Gestion des API Calls et Quota Enphase

Le système intègre une gestion intelligente des appels API Enphase pour respecter le quota de 1000 appels/mois :

### Limitations par rôle

- **ADMIN** : Maximum 15 actualisations manuelles par jour via le bouton "Actualiser"
- **VIEWER** : Pas de limitation, synchronisation automatique basée sur les données de l'ADMIN parent
- Compteur d'actualisations visible dans le dashboard pour les ADMIN

### Cache et Optimisation

- **Données de production** : Stockage permanent en base de données (pas de réappel API)
- **System Summary** : Mis en cache lors de chaque actualisation
- **Historique** : Les données historiques sont conservées et agrégées par jour
- **Détection de changement** : Les VIEWER vérifient toutes les 5 secondes si l'ADMIN a actualisé les données (requête ultra-légère)

### Logging des appels

1. Chaque appel à l'API Enphase est enregistré dans la table `ApiCallLog`
2. Informations enregistrées : endpoint, statut HTTP, temps de réponse, horodatage
3. Possibilité de consulter l'historique des appels via Prisma Studio

### Surveillance

```sql
-- Voir les appels API ce mois
SELECT COUNT(*) FROM "ApiCallLog"
WHERE "timestamp" >= DATE_TRUNC('month', CURRENT_DATE);

-- Détail par endpoint
SELECT endpoint, COUNT(*) as count
FROM "ApiCallLog"
WHERE "timestamp" >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY endpoint
ORDER BY count DESC;
```

## Structure du projet

```
solar-perform-var-habitation/
├── prisma/
│   ├── schema.prisma          # Schéma de la base de données
│   └── migrations/            # Migrations Prisma
├── src/
│   ├── __tests__/             # Tests unitaires et d'intégration
│   │   ├── api/               # Tests des routes API
│   │   ├── components/        # Tests des composants
│   │   └── lib/               # Tests des utilitaires
│   ├── app/
│   │   ├── api/               # Routes API
│   │   │   ├── auth/          # Authentification (login, logout, refresh)
│   │   │   ├── connections/   # Connexions Enphase (OAuth, sync)
│   │   │   ├── data/          # Données solaires (stats, historique)
│   │   │   ├── admin/         # Routes admin (gestion utilisateurs/systèmes)
│   │   │   └── health/        # Health check
│   │   ├── dashboard/         # Page principale utilisateur
│   │   ├── admin/             # Interface d'administration
│   │   ├── super-admin-dashboard/  # Dashboard super-admin
│   │   ├── profile/           # Profil utilisateur
│   │   ├── connections/       # Gestion des connexions
│   │   ├── login/             # Page de connexion
│   │   └── change-password-required/  # Changement mot de passe initial
│   ├── components/            # Composants React
│   │   ├── ui/                # Composants UI réutilisables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── EcoFacts.tsx       # Calculs impact environnemental
│   │   ├── Navigation.tsx     # Menu de navigation
│   │   ├── ConfirmDeleteModal.tsx  # Modal de confirmation
│   │   └── VarHabitatLogo.tsx # Logo
│   ├── contexts/              # Contexts React
│   │   └── AuthContext.tsx    # Contexte d'authentification
│   ├── lib/
│   │   ├── services/          # Services métier
│   │   │   ├── enphase.ts     # Client API Enphase
│   │   │   ├── enphase-cache.ts          # Gestion du cache
│   │   │   └── enphase-data-collector.ts # Collecte de données (avec timeout)
│   │   ├── auth.ts            # Utilitaires d'authentification (JWT)
│   │   ├── env.ts             # Validation des variables d'environnement
│   │   ├── rate-limit.ts      # Système de rate limiting
│   │   ├── permissions.ts     # Gestion des permissions
│   │   ├── middleware.ts      # Middlewares
│   │   ├── prisma.ts          # Client Prisma
│   │   ├── cron.ts            # Tâches planifiées
│   │   ├── utils.ts           # Utilitaires généraux
│   │   └── validators.ts      # Validateurs Zod
│   └── types/                 # Types TypeScript
├── scripts/                   # Scripts utilitaires
│   ├── create-super-admin.ts  # Création super-admin
│   ├── clean-database-for-demo.ts  # Nettoyage pour démo
│   └── apply-migrations.sh    # Application migrations
├── docker/                    # Configuration Docker
│   └── init-db.sh            # Script d'initialisation DB
├── public/                    # Fichiers statiques
│   └── var-habitat-logo.png
├── .husky/                   # Hooks Git (commitlint)
├── .env.example              # Template des variables d'environnement
├── commitlint.config.js      # Configuration commitlint
├── GIT_GUIDE.md              # Guide Git basique
├── GITFLOW.md                # Stratégie Gitflow et conventions
├── TESTS.md                  # Documentation tests
└── Makefile                  # Commandes Make
```

## Documentation

- **[GIT_GUIDE.md](./GIT_GUIDE.md)** - Guide d'utilisation de Git pour ce projet
- **[GITFLOW.md](./GITFLOW.md)** - Stratégie Gitflow et conventions de commit
- **[TESTS.md](./TESTS.md)** - Documentation des tests

## Commandes utiles

```bash
# Développement
npm run dev              # Démarrer le serveur de dev
npm run build            # Build de production
npm run start            # Démarrer en production

# Database
npm run db:studio        # Ouvrir Prisma Studio (interface graphique BDD)
npm run db:push          # Pousser le schéma vers la DB
npm run db:migrate       # Créer et appliquer une migration
npm run db:generate      # Générer le client Prisma

# Tests
npm run test             # Lancer les tests
npm run test:watch       # Tests en mode watch
npm run test:coverage    # Tests avec couverture
npm run test:ci          # Tests pour CI/CD

# Linting
npm run lint             # Analyser le code avec ESLint

# Docker
docker-compose up -d     # Démarrer PostgreSQL
docker-compose down      # Arrêter les services
docker-compose logs -f   # Voir les logs en temps réel

# Scripts utilitaires
npx ts-node scripts/create-super-admin.ts [username] [password] [prénom] [nom]
npx ts-node scripts/clean-database-for-demo.ts  # Nettoyer la DB pour démo
```

## Développement et Conventions

### Gitflow et Commits

Ce projet utilise **Gitflow** comme stratégie de branches et **Conventional Commits** pour les messages de commit.

- Les messages de commit sont validés automatiquement via **commitlint** et **husky**
- Consultez [GITFLOW.md](./GITFLOW.md) pour les conventions complètes
- Format requis : `type(scope): description` (ex: `feat: ajout du dashboard admin`)
- Types disponibles : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Branches principales** :

- `main` : Production stable
- `develop` : Intégration des développements
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs
- `hotfix/*` : Corrections urgentes en production

## Architecture et Sécurité

### Sécurité

**Authentification et Tokens**
- Mots de passe hachés avec bcrypt (10 rounds)
- Tokens JWT avec expiration courte (15 minutes pour access, 7 jours pour refresh)
- Refresh tokens pour sessions longues durée
- Pas de valeurs par défaut pour les secrets (validation au démarrage)

**Protection des Secrets**
- Variables d'environnement validées au démarrage (`src/lib/env.ts`)
- Longueur minimale de 32 caractères pour les secrets JWT
- Fichier `.env.example` pour documentation sans exposer les secrets
- `.env` protégé dans `.gitignore`

**Validation et Protection**
- Validation des entrées avec Zod sur toutes les routes API
- Middlewares d'authentification et d'autorisation
- Gestion fine des permissions par rôle (VIEWER, ADMIN, SUPER_ADMIN)
- Protection contre brute-force (rate limiting sur login)
- Headers de sécurité HTTP (HSTS, X-Frame-Options, CSP, etc.)

**Rate Limiting**
- Maximum 5 tentatives de connexion par username/IP
- Verrouillage de 15 minutes après 5 échecs
- Réinitialisation automatique après connexion réussie

**Timeouts et Résilience**
- Timeout de 30 secondes sur toutes les requêtes Enphase
- Gestion des erreurs avec messages génériques côté client
- Logging détaillé côté serveur uniquement

### Architecture

- **Frontend** : Application React Server Components (Next.js 14 App Router)
- **Backend** : API Routes Next.js avec séparation en services
- **Base de données** : PostgreSQL avec Prisma ORM
- **Cache** : Stockage en BDD des données Enphase pour éviter les appels API redondants
- **Synchronisation** :
  - Push pour ADMIN (bouton manuel)
  - Pull intelligent pour VIEWER (détection de changement toutes les 5 secondes)

## Variables d'environnement

| Variable                | Description                    | Requis |
| ----------------------- | ------------------------------ | ------ |
| `DATABASE_URL`          | URL de connexion PostgreSQL    | Oui    |
| `JWT_SECRET`            | Secret pour les JWT            | Oui    |
| `JWT_REFRESH_SECRET`    | Secret pour les refresh tokens | Oui    |
| `NEXT_PUBLIC_APP_URL`   | URL de l'application           | Oui    |
| `ENPHASE_CLIENT_ID`     | ID client Enphase              | Oui    |
| `ENPHASE_CLIENT_SECRET` | Secret client Enphase          | Oui    |
| `ENPHASE_API_KEY`       | Clé API Enphase                | Oui    |
| `ENPHASE_REDIRECT_URI`  | URI de callback OAuth          | Oui    |

## Résolution de problèmes

### Limite d'actualisations quotidienne atteinte (ADMIN)

**Problème** : Message "Limite atteinte (15/15)"

**Solution** :

- Attendre le lendemain (réinitialisation automatique à minuit)
- Les VIEWER peuvent toujours voir les données actuelles
- Les données en cache restent accessibles

### Problèmes d'authentification

**Problème** : Token expiré ou erreur de connexion

**Solutions** :

```bash
# 1. Vider le cache du navigateur
# 2. Vérifier les variables JWT dans .env
# 3. Se déconnecter et se reconnecter
```

### Base de données corrompue ou migrations échouées

```bash
# Réinitialiser complètement la BDD (ATTENTION : perte de données)
docker-compose down -v
docker-compose up -d
npx prisma migrate deploy
npx prisma generate

# Recréer le super admin
npx ts-node scripts/create-super-admin.ts admin Password123! Admin Var
```

### Erreur de connexion Enphase

**Problème** : OAuth callback échoue ou token invalide

**Solutions** :

1. Vérifier les variables Enphase dans `.env` (CLIENT_ID, CLIENT_SECRET, API_KEY)
2. Vérifier que le REDIRECT_URI correspond exactement à celui configuré sur le portail Enphase
3. Déconnecter et reconnecter le service depuis `/connections`

### Données de production non affichées

**Problème** : Dashboard vide ou "Aucune donnée"

**Solutions** :

1. Cliquer sur "Actualiser les données" (pour ADMIN)
2. Vérifier que la connexion Enphase est active dans `/connections`
3. Consulter les logs : `docker-compose logs -f`
4. Vérifier les appels API dans Prisma Studio (table `ApiCallLog`)

## License

MIT License - voir [LICENSE](./LICENSE)

## À propos de Solar Perform

**Solar Perform** est une entreprise spécialisée dans les solutions de visualisation personnalisées pour le monitoring de production solaire. Nous développons des plateformes sur mesure adaptées aux besoins spécifiques de chaque client.

### Services proposés

- Solutions de monitoring personnalisées pour la production solaire
- Intégration avec les APIs des principaux fabricants (Enphase, SolarEdge, Fronius, etc.)
- Tableaux de bord sur mesure adaptés à vos besoins
- Gestion multi-utilisateurs et hiérarchique
- Architecture scalable et sécurisée
- Support technique et maintenance
- Déploiement et hébergement

### Vous êtes intéressé par une solution similaire ?

Solar Perform peut développer et déployer une instance personnalisée pour votre organisation. Chaque solution est adaptée aux besoins spécifiques du client : branding personnalisé, fonctionnalités sur mesure, intégration avec vos systèmes existants.

### Contact

Pour toute question concernant cette instance ou pour découvrir nos solutions :

- Email : contact@solar-perform.com (exemple)
- GitHub : https://github.com/ByWizKi/solar-perform-var-habitation

---

**Note** : Cette application nécessite un compte Enphase Developer et un système solaire Enphase connecté pour fonctionner pleinement.

**© 2024 Solar Perform** - Solution déployée pour Var Habitat
