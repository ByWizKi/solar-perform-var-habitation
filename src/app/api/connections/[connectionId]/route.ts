import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest, AuthRequest } from '@/lib/middleware'

async function deleteHandler(req: AuthRequest, { params }: { params: { connectionId: string } }) {
  try {
    const { userId } = getUserFromRequest(req)
    const { connectionId } = params

    if (!connectionId) {
      return NextResponse.json({ error: 'ID de connexion manquant' }, { status: 400 })
    }

    // Vrifier que la connexion appartient bien  l'utilisateur
    const connection = await prisma.enphaseConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
      select: {
        id: true,
        systemId: true,
        systemName: true,
        _count: {
          select: {
            productionData: true,
            apiCallLogs: true,
          },
        },
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connexion non trouve ou accs refus' }, { status: 404 })
    }

    // Log des donnes qui vont tre supprimes
    console.log(`[DELETE]  Suppression de la connexion Enphase (ID: ${connectionId})`)
    console.log(`[DATA] Donnes  supprimer :`)
    console.log(`   - ${connection._count.productionData} donnes de production`)
    console.log(`   - ${connection._count.apiCallLogs} logs d'appels API`)

    // Calculer le total d'enregistrements
    const totalRecords = connection._count.productionData + connection._count.apiCallLogs

    // Supprimer la connexion (la cascade supprimera automatiquement toutes les donnes lies)
    await prisma.enphaseConnection.delete({
      where: {
        id: connectionId,
      },
    })

    console.log(`[OK] Connexion Enphase supprime avec succs`)
    console.log(`[OK] ${totalRecords + 1} enregistrements supprims au total`)

    return NextResponse.json({
      success: true,
      message: 'Connexion et toutes les donnes associes supprimes avec succs',
      deletedRecords: {
        systemId: connection.systemId,
        systemName: connection.systemName,
        productionData: connection._count.productionData,
        apiCalls: connection._count.apiCallLogs,
        total: totalRecords + 1,
      },
    })
  } catch (error: any) {
    console.error('[ERREUR] Erreur lors de la suppression de la connexion:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la suppression de la connexion',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: AuthRequest, context: { params: { connectionId: string } }) {
  return withAuth(req, (req) => deleteHandler(req, context))
}
