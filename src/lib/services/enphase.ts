import { prisma } from '../prisma'

// Configuration Enphase
const ENPHASE_API_BASE = 'https://api.enphaseenergy.com'
const ENPHASE_AUTH_URL = `${ENPHASE_API_BASE}/oauth/authorize`
const ENPHASE_TOKEN_URL = `${ENPHASE_API_BASE}/oauth/token`

export interface EnphaseConfig {
  clientId: string
  clientSecréet: string
  apiKey: string
  redirectUri: string
}

export class EnphaseService {
  private config: EnphaseConfig

  constructor(config: EnphaseConfig) {
    this.config = config
  }

  // Gnrer l'URL d'autorisation
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
    })

    if (state) {
      params.append('state', state)
    }

    return `${ENPHASE_AUTH_URL}?${params.toString()}`
  }

  // changer le code d'autorisation contre des tokens
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const basicAuth = Buffer.from(`${this.config.clientId}:${this.config.clientSecréet}`).toString(
      'base64'
    )

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
      code,
    })

    const response = await fetch(`${ENPHASE_TOKEN_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erreur Enphase: ${error}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  }

  // Rafrachir les tokens
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const basicAuth = Buffer.from(`${this.config.clientId}:${this.config.clientSecréet}`).toString(
      'base64'
    )

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const response = await fetch(`${ENPHASE_TOKEN_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erreur lors du rafrachissement: ${error}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    }
  }

  // Rcuprer les systèmes de l'utilisateur (avec pagination)
  async getSystems(accessToken: string, page: number = 1, pageSize: number = 10): Promise<any> {
    const params = new URLSearchParams({
      key: this.config.apiKey,
      page: page.toString(),
      size: Math.min(pageSize, 100).toString(), // Max 100 selon la doc Enphase
    })

    const response = await fetch(`${ENPHASE_API_BASE}/api/v4/systems?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erreur lors de la récupération des systèmes: ${error}`)
    }

    return response.json()
  }

  // Rcuprer les informations gnrales d'un système
  async getSystemInfo(systemId: string, accessToken: string): Promise<any> {
    const response = await fetch(
      `${ENPHASE_API_BASE}/api/v4/systems/${systemId}?key=${this.config.apiKey}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erreur lors de la récupération des infos système: ${error}`)
    }

    return response.json()
  }

  // Rcuprer les détails d'un système (summary)
  async getSystemDetails(systemId: string, accessToken: string): Promise<any> {
    const response = await fetch(
      `${ENPHASE_API_BASE}/api/v4/systems/${systemId}/summary?key=${this.config.apiKey}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des détails du système')
    }

    return response.json()
  }

  // Rcuprer les données de production (energy_lifetime)
  async getProductionData(
    systemId: string,
    accessToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const params = new URLSearchParams({
      key: this.config.apiKey,
    })

    if (startDate) {
      params.append('start_at', Math.floor(startDate.getTime() / 1000).toString())
    }
    if (endDate) {
      params.append('end_at', Math.floor(endDate.getTime() / 1000).toString())
    }

    const response = await fetch(
      `${ENPHASE_API_BASE}/api/v4/systems/${systemId}/energy_lifetime?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données de production')
    }

    return response.json()
  }

  // Rcuprer tous les appareils du système (micro-inverseurs, batteries, etc.)
  async getSystemDevices(systemId: string, accessToken: string): Promise<any> {
    const response = await fetch(
      `${ENPHASE_API_BASE}/api/v4/systems/${systemId}/devices?key=${this.config.apiKey}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erreur lors de la récupération des appareils: ${error}`)
    }

    return response.json()
  }

  // Rcuprer les statistiques RGM (Revenue Grade Meter) par intervalles de 15 min
  async getRGMStats(
    systemId: string,
    accessToken: string,
    startAt?: number,
    endAt?: number
  ): Promise<any> {
    const params = new URLSearchParams({
      key: this.config.apiKey,
    })

    if (startAt) {
      params.append('start_at', startAt.toString())
    }
    if (endAt) {
      params.append('end_at', endAt.toString())
    }

    const response = await fetch(
      `${ENPHASE_API_BASE}/api/v4/systems/${systemId}/rgm_stats?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erreur lors de la récupération des stats RGM: ${error}`)
    }

    return response.json()
  }

  // Sauvegarder ou mettre  jour la connexion en base de données
  async saveConnection(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    systemId?: string,
    additionalMetadata?: any
  ) {
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    // Extraire les informations système des mtadonnées
    const systemName = additionalMetadata?.name || additionalMetadata?.public_name
    const systemSize = additionalMetadata?.system_size
    const timezone = additionalMetadata?.timezone

    return prisma.enphaseConnection.upsert({
      where: {
        userId_systemId: {
          userId,
          systemId: systemId || '',
        },
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt,
        systemName,
        systemSize,
        timezone,
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        accessToken,
        refreshToken,
        expiresAt,
        systemId: systemId || '',
        systemName,
        systemSize,
        timezone,
      },
    })
  }

  // Vrifier et rafrachir le token si ncessaire
  async ensureValidToken(userId: string): Promise<string> {
    const connection = await prisma.enphaseConnection.findFirst({
      where: {
        userId,
        isActive: true,
      },
    })

    if (!connection) {
      throw new Error('Connexion Enphase non trouve')
    }

    // Si le token expire dans moins de 5 minutes, le rafrachir
    const expiresIn = connection.expiresAt.getTime() - Date.now()
    if (expiresIn < 5 * 60 * 1000) {
      const tokens = await this.refreshAccessToken(connection.refreshToken)
      await this.saveConnection(
        userId,
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiresIn,
        connection.systemId || undefined,
        {
          name: connection.systemName,
          system_size: connection.systemSize,
          timezone: connection.timezone,
        }
      )
      return tokens.accessToken
    }

    return connection.accessToken
  }
}

// Instance par dfaut
export function getEnphaseService(): EnphaseService {
  const config: EnphaseConfig = {
    clientId: process.env.ENPHASE_CLIENT_ID || '',
    clientSecréet: process.env.ENPHASE_CLIENT_SECRET || '',
    apiKey: process.env.ENPHASE_API_KEY || '',
    redirectUri: `${
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }/api/connections/enphase/callback`,
  }

  return new EnphaseService(config)
}
