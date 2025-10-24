# SolarPerform ☀️

Application web moderne de suivi et d'analyse de production solaire avec intégration Enphase.

## 📋 Description

SolarPerform est une plateforme complète de monitoring de panneaux solaires qui permet aux utilisateurs de :

- Suivre leur production solaire en temps réel
- Analyser leur consommation d'énergie
- Visualiser l'état de leurs équipements (panneaux, batteries, compteurs)
- Consulter des données historiques sur des plages de dates personnalisées
- Calculer l'impact environnemental de leur production

## ✨ Fonctionnalités

### 🔐 Authentification

- Inscription et connexion sécurisées
- Gestion de profil utilisateur
- Tokens JWT avec refresh automatique
- Modification de mot de passe

### 📊 Dashboard

- Vue d'ensemble en temps réel de la production
- Production actuelle et quotidienne
- Production mensuelle et totale (lifetime)
- Consommation (si compteur disponible)
- État de la batterie
- Calculs d'impact environnemental (CO2, équivalents)
- Auto-actualisation horaire

### 🔌 Intégration Enphase

- Connexion OAuth 2.0 sécurisée
- Synchronisation automatique des données
- Cache intelligent pour optimiser les appels API (quota 1000/mois)
- Support multi-systèmes
- Récupération de données historiques

### 📈 Données Historiques

- Sélecteur de plage de dates flexible
- Raccourcis (mois en cours, dernier mois, 3/6 mois)
- Visualisation quotidienne de production/consommation
- Calcul d'autoconsommation
- Export et analyse des données

### ⚙️ Équipements

- Liste de tous les micro-onduleurs
- État des batteries (ACB, Encharge)
- Compteurs et passerelles
- Chargeurs EV
- Informations détaillées du système

## 🚀 Technologies

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

### Infrastructure

- **Docker** (développement et production)
- **GitHub Actions** (CI/CD)
- **ESLint** & **Prettier** (qualité de code)

### APIs Externes

- **Enphase Energy API v4**
  - OAuth 2.0
  - System Summary
  - Energy Lifetime
  - Consumption Lifetime
  - Devices
  - RGM Stats

## 📦 Installation

### Prérequis

- Node.js 18+
- Docker & Docker Compose
- Compte Enphase Developer (pour les clés API)

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/SolarPerform.git
cd SolarPerform
```

### 2. Configuration

Créer un fichier `.env` à la racine :

```env
# Database
DATABASE_URL="postgresql://solarperform:solarperform@localhost:5432/solarperform"

# JWT
JWT_SECRET="votre-secret-jwt-ultra-securise"
JWT_REFRESH_SECRET="votre-refresh-secret-ultra-securise"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Enphase
ENPHASE_CLIENT_ID="votre-client-id"
ENPHASE_CLIENT_SECRET="votre-client-secret"
ENPHASE_API_KEY="votre-api-key"
ENPHASE_REDIRECT_URI="http://localhost:3000/api/connections/enphase/callback"
```

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

## 🎯 Guide de démarrage rapide

1. **Créer un compte** : `/register`
2. **Se connecter** : `/login`
3. **Connecter Enphase** : `/connections` → "Connecter Enphase"
4. **Autoriser l'accès** sur le portail Enphase
5. **Consulter le dashboard** : `/dashboard`

## 📊 Gestion des API Calls

Le système intègre une gestion intelligente des appels API Enphase pour rester dans le quota de 1000 appels/mois :

### Cache en BDD

- **System Info** : 24h (données statiques)
- **Devices** : 24h (équipements changent rarement)
- **Production/Consommation historique** : permanent (agrégation par jour)

### Stratégie d'optimisation

1. Vérification en BDD avant chaque requête
2. Utilisation du cache si disponible
3. Appels API uniquement si nécessaire
4. Logging de tous les appels dans `ApiCallLog`
5. Compteur mensuel affiché à l'utilisateur

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

## 🗂️ Structure du projet

```
SolarPerform/
├── prisma/
│   ├── schema.prisma          # Schéma de la base de données
│   └── migrations/            # Migrations
├── src/
│   ├── app/
│   │   ├── api/               # Routes API
│   │   │   ├── auth/          # Authentification
│   │   │   ├── connections/   # Connexions Enphase
│   │   │   ├── data/          # Données solaires
│   │   │   └── panels/        # Équipements
│   │   ├── dashboard/         # Page principale
│   │   ├── monthly-data/      # Données historiques
│   │   ├── panels/            # Visualisation équipements
│   │   ├── profile/           # Profil utilisateur
│   │   └── connections/       # Gestion connexions
│   ├── components/            # Composants React
│   │   ├── ui/                # Composants UI réutilisables
│   │   ├── EcoFacts.tsx       # Impact environnemental
│   │   └── Navigation.tsx     # Menu de navigation
│   ├── contexts/              # Contexts React
│   │   └── AuthContext.tsx    # Contexte d'authentification
│   ├── lib/
│   │   ├── services/          # Services métier
│   │   │   ├── enphase.ts     # Client API Enphase
│   │   │   ├── enphase-cache.ts          # Gestion du cache
│   │   │   └── enphase-data-collector.ts # Collecte de données
│   │   ├── auth.ts            # Utilitaires auth
│   │   ├── middleware.ts      # Middlewares
│   │   ├── prisma.ts          # Client Prisma
│   │   └── validators.ts      # Validateurs Zod
│   └── types/                 # Types TypeScript
├── docker/                    # Configuration Docker
├── scripts/                   # Scripts utilitaires
└── docs/                      # Documentation (voir ci-dessous)
```

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Guide de démarrage rapide
- **[START_HERE.md](./START_HERE.md)** - Premiers pas
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Résolution de problèmes
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guide de contribution

## 🔄 Commandes utiles

```bash
# Développement
npm run dev              # Démarrer le serveur de dev
npm run build            # Build de production
npm run start            # Démarrer en production

# Database
npx prisma studio        # Interface graphique BDD
npx prisma migrate dev   # Créer une migration
npx prisma generate      # Générer le client

# Code quality
npm run lint             # Linter
npm run format           # Formater avec Prettier

# Docker
docker-compose up -d     # Démarrer les services
docker-compose down      # Arrêter les services
docker-compose logs -f   # Voir les logs
```

## 🔐 Sécurité

- Mots de passe hachés avec bcrypt (10 rounds)
- Tokens JWT avec expiration
- Refresh tokens pour sessions longues
- Variables d'environnement pour secrets
- Validation des entrées avec Zod
- Protection CSRF
- Middlewares d'authentification

## 🌍 Variables d'environnement

| Variable                | Description                    | Requis |
| ----------------------- | ------------------------------ | ------ |
| `DATABASE_URL`          | URL de connexion PostgreSQL    | ✅     |
| `JWT_SECRET`            | Secret pour les JWT            | ✅     |
| `JWT_REFRESH_SECRET`    | Secret pour les refresh tokens | ✅     |
| `NEXT_PUBLIC_APP_URL`   | URL de l'application           | ✅     |
| `ENPHASE_CLIENT_ID`     | ID client Enphase              | ✅     |
| `ENPHASE_CLIENT_SECRET` | Secret client Enphase          | ✅     |
| `ENPHASE_API_KEY`       | Clé API Enphase                | ✅     |
| `ENPHASE_REDIRECT_URI`  | URI de callback OAuth          | ✅     |

## 🐛 Résolution de problèmes

### Base de données

```bash
# Réinitialiser la BDD
docker-compose down -v
docker-compose up -d
npx prisma migrate deploy
```

### Cache navigateur

Vider le cache et les cookies si problèmes d'authentification.

### Quota API Enphase dépassé

Attendre le 1er du mois suivant ou contacter Enphase pour augmenter le quota.

## 📄 License

MIT License - voir [LICENSE](./LICENSE)

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📧 Contact

Pour toute question ou suggestion, ouvrir une issue sur GitHub.

---

**Note** : Cette application nécessite un compte Enphase Developer et un système solaire Enphase connecté pour fonctionner pleinement.

Fait avec ❤️ pour un avenir plus vert 🌱
