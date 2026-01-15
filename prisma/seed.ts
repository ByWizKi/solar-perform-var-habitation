/**
 * Script de seed pour initialiser la base de données
 * Crée automatiquement l'utilisateur enzoAdmin si il n'existe pas
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')

  // Créer l'utilisateur enzoAdmin
  const username = 'enzoAdmin'
  const password = 'admin123'
  const firstName = 'Enzo'
  const lastName = 'Admin'

  console.log(`🔐 Création/mise à jour du compte super admin: ${username}`)

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { username },
  })

  if (existingUser) {
    console.log(`⚠️  L'utilisateur ${username} existe déjà`)

    // Mettre à jour le mot de passe, le rôle et désactiver mustChangePassword
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { username },
      data: {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        mustChangePassword: false,
      },
    })
    console.log(`✅ Mot de passe et rôle mis à jour pour ${username}`)
  } else {
    // Créer le compte
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'SUPER_ADMIN',
        mustChangePassword: false, // Pas de changement obligatoire pour le premier super admin
      },
    })

    console.log(`✅ Compte super admin créé:`)
    console.log(`   Username: ${user.username}`)
    console.log(`   Nom: ${user.firstName} ${user.lastName}`)
    console.log(`   Rôle: ${user.role}`)
  }

  console.log('✅ Seed terminé avec succès!')
}

main()
  .catch((error) => {
    console.error('❌ Erreur lors du seed:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
