# Database Seed Guide

## Overview

The database seed script creates the initial super admin user (`enzoAdmin` / `admin123`) if it doesn't already exist.

The seed is **idempotent** - it can be run multiple times safely without creating duplicates.

## Running the Seed

### Local Development

```bash
npm run db:seed
```

Or directly:

```bash
npx tsx prisma/seed.ts
```

### Production (Vercel)

The seed is **NOT** executed automatically during build. To run it once:

#### Option 1: Via Vercel CLI (Recommended)

```bash
# Set the environment variable temporarily
vercel env add SEED_DATABASE production
# Enter: true

# Trigger a deployment
vercel --prod

# After seed completes, remove the variable
vercel env rm SEED_DATABASE production
```

#### Option 2: Via Vercel Dashboard

1. Go to your project → **Settings** → **Environment Variables**
2. Add `SEED_DATABASE` with value `true` for **Production**
3. Go to **Deployments** → Click on the latest deployment → **Redeploy**
4. After successful deployment, remove the `SEED_DATABASE` variable

#### Option 3: Manual Execution

You can also execute the seed manually by connecting to your database and running:

```bash
npx prisma db seed
```

## Seed Users

The following user is created by default:

- **Username**: `enzoAdmin`
- **Password**: `admin123`
- **Role**: `SUPER_ADMIN`
- **Name**: Enzo Admin

## Notes

- The seed script checks if users already exist before creating them
- Running the seed multiple times is safe and won't create duplicates
- The seed is excluded from the build process to avoid unnecessary executions
