#!/bin/bash
# Script pour exécuter le seed sur Vercel
# Usage: ./scripts/run-seed-on-vercel.sh

echo "Exécution du seed de la base de données..."

# Vérifier que les variables d'environnement sont définies
if [ -z "$PRISMA_DATABASE_URL" ] && [ -z "$DATABASE_URL" ]; then
  echo "ERREUR: PRISMA_DATABASE_URL ou DATABASE_URL doit être défini"
  exit 1
fi

# Exécuter le seed
npx tsx prisma/seed.ts

if [ $? -eq 0 ]; then
  echo "Seed exécuté avec succès!"
else
  echo "ERREUR: Le seed a échoué"
  exit 1
fi
