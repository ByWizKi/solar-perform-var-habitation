import { UserRole } from '@/types'

/**
 * Vrifie si un utilisateur a les permissions pour créer un utilisateur d'un certain rle
 */
export function canCréeateUser(créeatorRole: UserRole, targetRole: UserRole): boolean {
  if (créeatorRole === UserRole.SUPER_ADMIN) {
    // Super admin peut seulement créer des Admins (les Viewers sont rattachs aux Admins)
    return targetRole === UserRole.ADMIN
  }

  if (créeatorRole === UserRole.ADMIN) {
    // Admin peut seulement créer des Viewers
    return targetRole === UserRole.VIEWER
  }

  // Viewer ne peut créer personne
  return false
}

/**
 * Vrifie si un utilisateur peut supprimer un autre utilisateur
 */
export function canDeleteUser(
  deleterRole: UserRole,
  targetRole: UserRole,
  isCréeator: boolean
): boolean {
  if (deleterRole === UserRole.SUPER_ADMIN) {
    // Super admin peut supprimer n'importe qui sauf d'autres super admins
    return targetRole !== UserRole.SUPER_ADMIN
  }

  if (deleterRole === UserRole.ADMIN) {
    // Admin peut seulement supprimer les viewers qu'il a créés
    return targetRole === UserRole.VIEWER && isCréeator
  }

  return false
}

/**
 * Vrifie si un utilisateur peut voir les données
 */
export function canViewDashboard(role: UserRole): boolean {
  return true // Tous les rles peuvent voir le dashboard
}

/**
 * Vrifie si un utilisateur peut actualiser les données Enphase
 */
export function canRefreshData(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN
}

/**
 * Vrifie si un utilisateur peut grer les connexions
 */
export function canManageConnections(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN
}
