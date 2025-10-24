import { z } from 'zod'

// Validation pour l'inscription
export const registerSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractres"),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
  firstName: z.string().min(2, 'Le prnom doit contenir au moins 2 caractres'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractres'),
})

// Validation pour la connexion
export const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

// Validation pour le changement de mot de passe
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
})

// Validation pour le refresh token
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Le refresh token est requis'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
