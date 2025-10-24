#!/bin/bash

# Script pour appliquer les migrations Prisma
# Workaround pour un problème avec `prisma migrate deploy`

set -e

echo "📊 Application des migrations Prisma..."

# Vérifier que Docker tourne
if ! docker ps | grep -q solarperform-db-dev; then
    echo "❌ Le container PostgreSQL n'est pas démarré"
    echo "   Lancez: docker-compose -f docker-compose.dev.yml up -d"
    exit 1
fi

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente du démarrage de PostgreSQL..."
sleep 3

# Trouver la dernière migration
LATEST_MIGRATION=$(ls -t prisma/migrations | grep -v migration_lock.toml | head -1)

if [ -z "$LATEST_MIGRATION" ]; then
    echo "❌ Aucune migration trouvée"
    exit 1
fi

echo "📄 Application de la migration: $LATEST_MIGRATION"

# Appliquer le SQL de migration
cat "prisma/migrations/$LATEST_MIGRATION/migration.sql" | \
  docker exec -i solarperform-db-dev psql -U postgres -d solarperform

echo ""
echo "✅ Migrations appliquées avec succès !"
echo ""
echo "Vérification des tables créées :"
docker exec solarperform-db-dev psql -U postgres -d solarperform -c "\dt"

echo ""
echo "✨ La base de données est prête !"

