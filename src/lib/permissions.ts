import { UserRole } from '@/types'

/**
 * Vrifie si un utilisateur a les permissions pour crer un utilisateur d'un certain rle
 */
export function canCreateUser(creatorRole: UserRole, targetRole: UserRole): boolean {
  if (creatorRole === UserRole.SUPER_ADMIN) {
    // Super admin peut seulement crer des Admins (les Viewers sont rattachs aux Admins)
    return targetRole === UserRole.ADMIN
  }

  if (creatorRole === UserRole.ADMIN) {
    // Admin peut seulement crer des Viewers
    return targetRole === UserRole.VIEWER
  }

  // Viewer ne peut crer personne
  return false
}

/**
 * Vrifie si un utilisateur peut supprimer un autre utilisateur
 */
export function canDeleteUser(
  deleterRole: UserRole,
  targetRole: UserRole,
  isCreator: boolean
): boolean {
  if (deleterRole === UserRole.SUPER_ADMIN) {
    // Super admin peut supprimer n'importe qui sauf d'autres super admins
    return targetRole !== UserRole.SUPER_ADMIN
  }

  if (deleterRole === UserRole.ADMIN) {
    // Admin peut seulement supprimer les viewers qu'il a crs
    return targetRole === UserRole.VIEWER && isCreator
  }

  return false
}

/**
 * Vrifie si un utilisateur peut voir les donnes
 */
export function canViewDashboard(role: UserRole): boolean {
  return true // Tous les rles peuvent voir le dashboard
}

/**
 * Vrifie si un utilisateur peut actualiser les donnes Enphase
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
