module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Nouvelle fonctionnalité
        'fix', // Correction de bug
        'docs', // Documentation uniquement
        'style', // Changements qui n'affectent pas le sens du code (espaces, formatage, etc.)
        'refactor', // Refactoring de code (ni bug ni fonctionnalité)
        'perf', // Amélioration des performances
        'test', // Ajout ou correction de tests
        'build', // Changements du système de build ou dépendances externes
        'ci', // Changements des fichiers de configuration CI
        'chore', // Autres changements qui ne modifient pas src ou les fichiers de test
        'revert', // Revert d'un commit précédent
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
}
