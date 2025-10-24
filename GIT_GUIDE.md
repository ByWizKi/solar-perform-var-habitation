# Guide Git - SolarPerform

## Configuration actuelle

**Identité Git**
- Nom : THIEBAUD Enzo
- Email : enzoth39260@gmail.com

**Dépôt GitHub**
- URL : https://github.com/ByWizKi/solar-perform-var-habitation
- Branche principale : `main`

**Dossier local**
- Nom : `solar-perform-var-habitation`
- Emplacement : `/Users/nono-dev/solar-perform-var-habitation`

---

## Commandes essentielles

### Voir l'état du projet
```bash
git status
```

### Ajouter des modifications
```bash
# Ajouter tous les fichiers modifiés
git add .

# Ajouter un fichier spécifique
git add chemin/vers/fichier.ts
```

### Faire un commit
```bash
git commit -m "Description claire des modifications"
```

### Envoyer sur GitHub
```bash
git push
```

### Voir l'historique
```bash
# Voir les derniers commits
git log --oneline

# Voir le dernier commit en détail
git log -1
```

### Récupérer les modifications depuis GitHub
```bash
git pull
```

---

## Workflow typique

1. Modifier des fichiers dans le projet
2. Vérifier les modifications : `git status`
3. Ajouter les fichiers : `git add .`
4. Créer un commit : `git commit -m "Description"`
5. Envoyer sur GitHub : `git push`

---

## Exemples de messages de commit

**Bons exemples :**
- `Fix: Correction du calcul de production`
- `Feature: Ajout du graphique mensuel`
- `Update: Amélioration du design du dashboard`
- `Refactor: Optimisation de la requête Enphase`

**Mauvais exemples :**
- `modif`
- `fix bug`
- `update`

---

## Liens utiles

- Dépôt GitHub : https://github.com/ByWizKi/solar-perform-var-habitation
- Documentation Git : https://git-scm.com/doc

---

## Dépannage

### Si le push est rejeté
```bash
# Récupérer les modifications distantes d'abord
git pull
# Puis envoyer à nouveau
git push
```

### Annuler le dernier commit (avant le push)
```bash
git reset --soft HEAD~1
```

### Voir les différences avant de commiter
```bash
git diff
```

