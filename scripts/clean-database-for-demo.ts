import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script pour vider la base de données sauf l'utilisateur enzo-admin
 * Utile pour faire des démos/vidéos avec une base propre
 */
async function cleanDatabase() {
  try {
    console.log('\n🧹 Nettoyage de la base de données pour démo...\n')
    console.log('='.repeat(60))

    // 1. Vérifier que enzo-admin existe
    const enzoAdmin = await prisma.user.findUnique({
      where: { username: 'enzo-admin' },
    })

    if (!enzoAdmin) {
      console.error('❌ Utilisateur "enzo-admin" non trouvé')
      console.log("   → Créez-le d'abord avec le script de création")
      return
    }

    console.log(`✅ Utilisateur "enzo-admin" trouvé (ID: ${enzoAdmin.id})`)

    // 2. Supprimer les données de production
    console.log('\n🗑️  Suppression des données de production...')
    const deletedProduction = await prisma.productionData.deleteMany({})
    console.log(`   ✅ ${deletedProduction.count} entrées de production supprimées`)

    // 3. Supprimer les logs d'appels API
    console.log("\n🗑️  Suppression des logs d'appels API...")
    const deletedApiLogs = await prisma.apiCallLog.deleteMany({})
    console.log(`   ✅ ${deletedApiLogs.count} logs d'appels API supprimés`)

    // 4. Supprimer les connexions Enphase
    console.log('\n🗑️  Suppression des connexions Enphase...')
    const deletedConnections = await prisma.enphaseConnection.deleteMany({})
    console.log(`   ✅ ${deletedConnections.count} connexions Enphase supprimées`)

    // 5. Supprimer les refresh tokens
    console.log('\n🗑️  Suppression des refresh tokens...')
    const deletedTokens = await prisma.refreshToken.deleteMany({})
    console.log(`   ✅ ${deletedTokens.count} refresh tokens supprimés`)

    // 6. Supprimer tous les utilisateurs SAUF enzo-admin
    console.log('\n🗑️  Suppression des utilisateurs (sauf enzo-admin)...')
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        username: { not: 'enzo-admin' },
      },
    })
    console.log(`   ✅ ${deletedUsers.count} utilisateurs supprimés`)

    // 7. Réinitialiser les compteurs de enzo-admin
    console.log('\n🔄 Réinitialisation des compteurs de enzo-admin...')
    await prisma.user.update({
      where: { username: 'enzo-admin' },
      data: {
        dailyRefreshCount: 0,
        lastRefreshDate: null,
        mustChangePassword: false, // Pour les tests vidéo
      },
    })
    console.log('   ✅ Compteurs réinitialisés')

    // 8. Afficher le récapitulatif
    console.log('\n' + '='.repeat(60))
    console.log('✅ NETTOYAGE TERMINÉ')
    console.log('='.repeat(60))
    console.log('\n📊 État de la base:')
    console.log('   • Utilisateur conservé: enzo-admin')
    console.log('   • Toutes les données supprimées: Oui')
    console.log('   • Compteurs réinitialisés: Oui')
    console.log('   • Base prête pour démo: Oui ✓')

    console.log('\n🎬 INFORMATIONS DE CONNEXION POUR LA VIDÉO')
    console.log('='.repeat(60))
    console.log('\n🔐 Super Admin:')
    console.log('   → URL: http://localhost:3000/login')
    console.log('   → Username: enzo-admin')
    console.log('   → Password: Azerty122@')
    console.log('\n📋 Prochaines étapes pour la démo:')
    console.log('   1. Se connecter en tant que enzo-admin')
    console.log('   2. Aller sur /super-admin-dashboard')
    console.log('   3. Créer un compte Admin (sera le personnage principal)')
    console.log('   4. Se déconnecter et se reconnecter avec le compte Admin')
    console.log('   5. Connecter le compte Enphase')
    console.log('   6. Créer des comptes Viewer pour la démo')
    console.log('')
  } catch (error: any) {
    console.error('\n❌ Erreur lors du nettoyage:', error.message)
    console.log('   → La base de données est peut-être dans un état incohérent')
    console.log('   → Vérifiez les contraintes de clés étrangères')
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()
