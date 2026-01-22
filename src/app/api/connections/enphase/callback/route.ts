import { NextRequest, NextResponse } from 'next/server'
import { getEnphaseService } from '@/lib/services/enphase'
import { getEnphaseDataCollector } from '@/lib/services/enphase-data-collector'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'

export async function GET(req: NextRequest) {
  try {
    // Utiliser l'origine de la requête actuelle au lieu de env.APP_URL
    // Cela évite les problèmes avec les déploiements Vercel preview protégés
    const origin = req.nextUrl.origin
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${origin}/connections?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Paramtres manquants' }, { status: 400 })
    }

    const enphaseService = getEnphaseService()

    // changer le code contre des tokens
    const tokens = await enphaseService.exchangeCodeForTokens(code)

    // Rcuprer TOUS les systèmes de l'utilisateur (avec pagination si ncessaire)
    console.log('[SEARCH] Récupération de la liste des systèmes Enphase...')
    const allSystems = []
    let currentPage = 1
    let hasMorePages = true

    while (hasMorePages) {
      const systemsData = await enphaseService.getSystems(tokens.accessToken, currentPage, 100)

      if (systemsData.systems && systemsData.systems.length > 0) {
        allSystems.push(...systemsData.systems)
        console.log(
          `[PAGE] Page ${currentPage}: ${systemsData.systems.length} systèmes rcuprs (total: ${allSystems.length}/${systemsData.total})`
        )

        // Vérifier s'il y a d'autres pages
        hasMorePages = allSystems.length < systemsData.total
        currentPage++
      } else {
        hasMorePages = false
      }
    }

    console.log(`[OK] Total: ${allSystems.length} système(s) trouv(s)`)

    if (allSystems.length === 0) {
      console.error('[ERREUR] Aucun système Enphase trouv pour cet utilisateur')
      return NextResponse.redirect(
        `${origin}/connections?error=no_systems`
      )
    }

    // Prendre le premier système (ou permettre  l'utilisateur de choisir plus tard)
    const primarySystem = allSystems[0]
    const systemId = primarySystem.system_id?.toString()

    // Stocker les informations dtailles du système dans metadata
    const systemMetadata = {
      name: primarySystem.name,
      public_name: primarySystem.public_name,
      timezone: primarySystem.timezone,
      address: primarySystem.address,
      connection_type: primarySystem.connection_type,
      system_size: primarySystem.system_size,
      status: primarySystem.status,
      operational_at: primarySystem.operational_at,
      reference: primarySystem.reference,
      other_references: primarySystem.other_references,
      total_systems_available: allSystems.length,
      all_system_ids: allSystems.map((s) => s.system_id),
    }

    console.log('[SAVE] Sauvegarde de la connexion avec mtadonnées:', {
      systemId,
      systemName: primarySystem.name,
      systemsCount: allSystems.length,
    })

    // Sauvegarder la connexion avec les mtadonnées
    const connection = await enphaseService.saveConnection(
      state, // userId
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
      systemId,
      systemMetadata
    )

    // LANCER SYNC INITIALE OPTIMISEE en arrire-plan (premire connexion)
    // Utilise seulement 2 appels API au lieu de 10-15 (gain de ~85%)
    if (systemId) {
      // Ne pas attendre la fin de la sync pour rediriger
      const dataCollector = getEnphaseDataCollector()
      dataCollector
        .syncInitialOptimized(connection.id, systemId, tokens.accessToken)
        .then((result) => {
          console.log(`[OK] Sync initiale optimise termine: ${result.apiCalls} API calls`)
        })
        .catch((error) => {
          console.error('[ERREUR] Erreur sync initiale optimise:', error)
        })
    }

    // Rediriger immdiatement (la sync continue en arrire-plan)
    // Utiliser l'origine de la requête pour éviter les problèmes avec Vercel preview
    return NextResponse.redirect(`${origin}/?welcome=true`)
  } catch (error) {
    console.error('Erreur lors du callback Enphase:', error)
    // Utiliser l'origine de la requête même en cas d'erreur
    const origin = req.nextUrl.origin
    return NextResponse.redirect(
      `${origin}/connections?error=callback_failed`
    )
  }
}
