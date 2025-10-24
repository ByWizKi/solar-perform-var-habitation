import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
const ACCESS_TOKEN_EXPIRY = '7d' // 7 jours (une semaine)
const REFRESH_TOKEN_EXPIRY = '30d' // 30 jours

export interface TokenPayload {
  userId: string
  username: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// Hash un mot de passe
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// Vrifie un mot de passe
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Gnre un access token
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
}

// Gnre un refresh token
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })
}

// Vrifie un access token
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    throw new Error('Token invalide ou expir')
  }
}

// Vrifie un refresh token
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload
  } catch (error) {
    throw new Error('Refresh token invalide ou expir')
  }
}

// Alias pour verifyAccessToken (pour compatibilit)
export const verifyToken = verifyAccessToken

// Cre une paire de tokens et stocke le refresh token
export async function createAuthTokens(user: {
  id: string
  username: string
}): Promise<AuthTokens> {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  // Stocker le refresh token en DB
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 jours

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  })

  return { accessToken, refreshToken }
}

// Rvoque un refresh token
export async function revokeRefreshToken(token: string): Promise<void> {
  // Utiliser deleteMany pour viter les erreurs si le token n'existe pas
  await prisma.refreshToken.deleteMany({
    where: { token },
  })
}

// Rvoque tous les refresh tokens d'un utilisateur
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  })
}

// Nettoie les tokens expirs
export async function cleanExpiredTokens(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
}
