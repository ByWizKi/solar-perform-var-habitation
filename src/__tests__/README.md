# Tests - SolarPerform

## Structure des tests

```
src/__tests__/
├── lib/               # Tests unitaires des fonctions utilitaires
│   ├── permissions.test.ts
│   ├── validators.test.ts
│   └── utils.test.ts
├── components/        # Tests des composants React
│   ├── Button.test.tsx
│   ├── Card.test.tsx
│   └── Input.test.tsx
└── README.md
```

## Commandes

```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Générer le rapport de couverture
npm run test:coverage

# Lancer les tests d'un fichier spécifique
npm test permissions.test.ts
```

## Coverage

Le projet vise une couverture de code de **70%** minimum sur :

- Branches
- Fonctions
- Lignes
- Statements

## Tests implémentés

### Tests unitaires

1. **Permissions** (`lib/permissions.test.ts`)

   - Création d'utilisateurs selon les rôles
   - Suppression d'utilisateurs
   - Permissions d'actualisation
   - Gestion des connexions

2. **Validators** (`lib/validators.test.ts`)

   - Validation d'emails
   - Validation de mots de passe
   - Validation de noms d'utilisateur

3. **Utils** (`lib/utils.test.ts`)
   - Formatage d'énergie (Wh, kWh, MWh, GWh)
   - Formatage de puissance (W, kW, MW)
   - Utilitaire de classes CSS (cn)

### Tests de composants

1. **Button** (`components/Button.test.tsx`)

   - Rendu et interactions
   - États (enabled/disabled)
   - Variantes (primary, secondary, outline, ghost)
   - Tailles (sm, md, lg)

2. **Card** (`components/Card.test.tsx`)

   - Rendu du contenu
   - Titre et description
   - Classes personnalisées

3. **Input** (`components/Input.test.tsx`)
   - Rendu et interactions
   - Labels et messages d'erreur
   - Types (text, password, etc.)
   - États (required, disabled)

## Bonnes pratiques

1. **Isolement** : Chaque test est indépendant
2. **Couverture** : Tester les cas normaux et edge cases
3. **Lisibilité** : Descriptions claires et concises
4. **Rapidité** : Tests unitaires < 100ms
5. **Fiabilité** : Tests déterministes (pas de random)

## Prochaines étapes

- [ ] Tests d'intégration API (routes)
- [ ] Tests E2E avec Playwright
- [ ] Tests de performance
- [ ] Tests de sécurité
