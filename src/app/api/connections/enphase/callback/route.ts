import { NextRequest, NextResponse } from 'next/server'
import { getEnphaseService } from '@/lib/services/enphase'
import { getEnphaseDataCollector } from '@/lib/services/enphase-data-collector'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/connections?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Paramtres manquants' }, { status: 400 })
    }

    const enphaseService = getEnphaseService()

    // changer le code contre des tokens
    const tokens = await enphaseService.exchangeCodeForTokens(code)

    // Rcuprer TOUS les systmes de l'utilisateur (avec pagination si ncessaire)
    console.log('[SEARCH] Rcupration de la liste des systmes Enphase...')
    const allSystems = []
    let currentPage = 1
    let hasMorePages = true

    while (hasMorePages) {
      const systemsData = await enphaseService.getSystems(tokens.accessToken, currentPage, 100)

      if (systemsData.systems && systemsData.systems.length > 0) {
        allSystems.push(...systemsData.systems)
        console.log(
          `[PAGE] Page ${currentPage}: ${systemsData.systems.length} systmes rcuprs (total: ${allSystems.length}/${systemsData.total})`
        )

        // Vrifier s'il y a d'autres pages
        hasMorePages = allSystems.length < systemsData.total
        currentPage++
      } else {
        hasMorePages = false
      }
    }

    console.log(`[OK] Total: ${allSystems.length} systme(s) trouv(s)`)

    if (allSystems.length === 0) {
      console.error('[ERREUR] Aucun systme Enphase trouv pour cet utilisateur')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=no_systems`
      )
    }

    // Prendre le premier systme (ou permettre  l'utilisateur de choisir plus tard)
    const primarySystem = allSystems[0]
    const systemId = primarySystem.system_id?.toString()

    // Stocker les informations dtailles du systme dans metadata
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

    console.log('[SAVE] Sauvegarde de la connexion avec mtadonnes:', {
      systemId,
      systemName: primarySystem.name,
      systemsCount: allSystems.length,
    })

    // Sauvegarder la connexion avec les mtadonnes
    const connection = await enphaseService.saveConnection(
      state, // userId
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
      systemId,
      systemMetadata
    )

    // LANCER SYNC COMPLTE en arrire-plan (premire connexion)
    if (systemId) {
      // Ne pas attendre la fin de la sync pour rediriger
      const dataCollector = getEnphaseDataCollector()
      dataCollector
        .syncFullHistory(connection.id, systemId, tokens.accessToken)
        .then((result) => {
          console.log(`[OK] Sync initiale termine: ${result.apiCalls} API calls`)
        })
        .catch((error) => {
          console.error('[ERREUR] Erreur sync initiale:', error)
        })
    }

    // Rediriger immdiatement (la sync continue en arrire-plan)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?welcome=true`)
  } catch (error) {
    console.error('Erreur lors du callback Enphase:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=callback_failed`
    )
  }
}
