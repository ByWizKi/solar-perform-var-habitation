/**
 * Script pour créer un compte super admin
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = process.argv[2] || 'enzo-admin'
  const password = process.argv[3] || 'Azerty122@'
  const firstName = process.argv[4] || 'Enzo'
  const lastName = process.argv[5] || 'Admin'

  console.log(`🔐 Création du compte super admin: ${username}`)

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
}

main()
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
