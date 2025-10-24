// Types globaux de l'application

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string
  username: string
  firstName: string
  lastName: string
  role: UserRole
  mustChangePassword: boolean
  dailyRefreshCount: number
  lastRefreshDate?: Date | null
  createdById?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
