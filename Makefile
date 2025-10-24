.PHONY: help dev build start install db-up db-down db-migrate db-studio clean docker-build docker-up docker-down

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances
	npm install

dev: ## Lance le serveur de développement
	npm run dev

build: ## Construit l'application
	npm run build

start: ## Lance l'application en production
	npm start

db-up: ## Lance PostgreSQL avec Docker
	docker-compose -f docker-compose.dev.yml up -d

db-down: ## Arrête PostgreSQL
	docker-compose -f docker-compose.dev.yml down

db-migrate: ## Exécute les migrations
	./scripts/apply-migrations.sh

db-studio: ## Lance Prisma Studio
	npm run db:studio

db-reset: ## Réinitialise la base de données
	npx prisma migrate reset

clean: ## Nettoie les fichiers générés
	rm -rf .next node_modules

docker-build: ## Construit l'image Docker
	docker-compose build

docker-up: ## Lance l'application avec Docker
	docker-compose up -d

docker-down: ## Arrête l'application Docker
	docker-compose down

docker-logs: ## Affiche les logs Docker
	docker-compose logs -f

