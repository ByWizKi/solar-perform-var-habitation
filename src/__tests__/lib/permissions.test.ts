import {
  canCréeateUser,
  canDeleteUser,
  canRefreshData,
  canManageConnections,
} from '@/lib/permissions'
import { UserRole } from '@/types'

describe('Permissions', () => {
  describe('canCréeateUser', () => {
    it('Super Admin peut créer uniquement des Admins', () => {
      expect(canCréeateUser(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(true)
      expect(canCréeateUser(UserRole.SUPER_ADMIN, UserRole.VIEWER)).toBe(false)
      expect(canCréeateUser(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN)).toBe(false)
    })

    it('Admin peut créer uniquement des Viewers', () => {
      expect(canCréeateUser(UserRole.ADMIN, UserRole.VIEWER)).toBe(true)
      expect(canCréeateUser(UserRole.ADMIN, UserRole.ADMIN)).toBe(false)
      expect(canCréeateUser(UserRole.ADMIN, UserRole.SUPER_ADMIN)).toBe(false)
    })

    it('Viewer ne peut créer personne', () => {
      expect(canCréeateUser(UserRole.VIEWER, UserRole.VIEWER)).toBe(false)
      expect(canCréeateUser(UserRole.VIEWER, UserRole.ADMIN)).toBe(false)
      expect(canCréeateUser(UserRole.VIEWER, UserRole.SUPER_ADMIN)).toBe(false)
    })
  })

  describe('canDeleteUser', () => {
    it('Super Admin peut supprimer Admin et Viewer mais pas Super Admin', () => {
      expect(canDeleteUser(UserRole.SUPER_ADMIN, UserRole.ADMIN, false)).toBe(true)
      expect(canDeleteUser(UserRole.SUPER_ADMIN, UserRole.VIEWER, false)).toBe(true)
      expect(canDeleteUser(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN, false)).toBe(false)
    })

    it("Admin peut supprimer uniquement les Viewers qu'il a créés", () => {
      expect(canDeleteUser(UserRole.ADMIN, UserRole.VIEWER, true)).toBe(true)
      expect(canDeleteUser(UserRole.ADMIN, UserRole.VIEWER, false)).toBe(false)
      expect(canDeleteUser(UserRole.ADMIN, UserRole.ADMIN, true)).toBe(false)
    })

    it('Viewer ne peut supprimer personne', () => {
      expect(canDeleteUser(UserRole.VIEWER, UserRole.VIEWER, true)).toBe(false)
      expect(canDeleteUser(UserRole.VIEWER, UserRole.ADMIN, false)).toBe(false)
    })
  })

  describe('canRefreshData', () => {
    it('Super Admin et Admin peuvent actualiser les données', () => {
      expect(canRefreshData(UserRole.SUPER_ADMIN)).toBe(true)
      expect(canRefreshData(UserRole.ADMIN)).toBe(true)
    })

    it('Viewer ne peut pas actualiser les données', () => {
      expect(canRefreshData(UserRole.VIEWER)).toBe(false)
    })
  })

  describe('canManageConnections', () => {
    it('Super Admin et Admin peuvent grer les connexions', () => {
      expect(canManageConnections(UserRole.SUPER_ADMIN)).toBe(true)
      expect(canManageConnections(UserRole.ADMIN)).toBe(true)
    })

    it('Viewer ne peut pas grer les connexions', () => {
      expect(canManageConnections(UserRole.VIEWER)).toBe(false)
    })
  })
})
