import { prisma } from '../prisma'

const ENPHASE_API_BASE = 'https://api.enphaseenergy.com'

export class EnphaseDataCollector {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Mthode prive pour faire des requtes  l'API avec logging
  private async fetchEnphaseAPI(
    endpoint: string,
    accessToken: string,
    connectionId?: string,
    systemId?: string
  ): Promise<any> {
    // Construire l'URL correctement
    const separator = endpoint.includes('?') ? '&' : '?'
    const url = `${ENPHASE_API_BASE}${endpoint}${separator}key=${this.apiKey}`

    const startTime = Date.now()
    let response: Response
    let success = false
    let statusCode = 0

    // Timeout de 30 secondes pour les requêtes Enphase
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      })

      statusCode = response.status
      success = response.ok

      // Nettoyer le timeout
      clearTimeout(timeoutId)

      // Logger l'appel API si connectionId est fourni
      if (connectionId) {
        const responseTime = Date.now() - startTime
        console.log(`  [API] [API] ${endpoint}  ${statusCode} (${responseTime}ms)`)
        await prisma.apiCallLog
          .create({
            data: {
              connectionId,
              service: 'enphase',
              endpoint,
              method: 'GET',
              statusCode,
              success,
              responseTimeMs: responseTime,
            },
          })
          .catch((err) => console.error(`  [ERREUR] [LOG] Erreur logging API: ${err.message}`))
      }

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Erreur API Enphase (${response.status}): ${error}`)
      }

      return response.json()
    } catch (error: any) {
      // Nettoyer le timeout en cas d'erreur
      clearTimeout(timeoutId)

      // Gestion spécifique du timeout
      if (error.name === 'AbortError') {
        const timeoutError = new Error(
          `Timeout: L'API Enphase n'a pas répondu dans les 30 secondes`
        )

        if (connectionId) {
          const responseTime = Date.now() - startTime
          console.log(`  [ERREUR] [API] ${endpoint}  TIMEOUT (${responseTime}ms)`)
          await prisma.apiCallLog
            .create({
              data: {
                connectionId,
                service: 'enphase',
                endpoint,
                method: 'GET',
                statusCode: 0,
                success: false,
                errorMessage: 'Request timeout after 30s',
                responseTimeMs: responseTime,
              },
            })
            .catch((err) => console.error(`  [ERREUR] [LOG] Erreur logging API: ${err.message}`))
        }

        throw timeoutError
      }

      // Logger l'erreur si connectionId est fourni
      if (connectionId) {
        const responseTime = Date.now() - startTime
        console.log(`  [ERREUR] [API] ${endpoint}  ERREUR (${responseTime}ms): ${error.message}`)
        await prisma.apiCallLog
          .create({
            data: {
              connectionId,
              service: 'enphase',
              endpoint,
              method: 'GET',
              statusCode: statusCode || 0,
              success: false,
              errorMessage: error.message,
              responseTimeMs: responseTime,
            },
          })
          .catch((err) => console.error(`  [ERREUR] [LOG] Erreur logging API: ${err.message}`))
      }
      throw error
    }
  }

  // ========== SYSTEM DETAILS ==========

  async fetchAndStoreSystems(connectionId: string, accessToken: string): Promise<any> {
    const data = await this.fetchEnphaseAPI('/api/v4/systems', accessToken, connectionId)
    return data
  }

  async fetchAndStoreSystemSummary(
    connectionId: string,
    systemId: string,
    accessToken: string
  ): Promise<void> {
    const summary = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/summary`,
      accessToken,
      connectionId,
      systemId
    )

    // Stocker les donnes de production actuelles
    await prisma.productionData.create({
      data: {
        connectionId,
        connectionType: 'enphase',
        systemId,
        source: 'summary', // [ATTENTION] IMPORTANT : source doit tre un champ direct, pas dans metadata
        energy: summary.energy_today || 0,
        power: summary.current_power || 0,
        timestamp: new Date(),
        interval: 0, // Snapshot instantan
        metadata: {
          status: summary.status,
          energyLifetime: summary.energy_lifetime,
          systemName: summary.system_name,
        },
      },
    })

    // Mettre  jour les infos systme dans la connexion et lastSyncAt
    await prisma.enphaseConnection.update({
      where: { id: connectionId },
      data: {
        systemName: summary.system_name,
        systemSize: summary.size_w ? summary.size_w / 1000 : null,
        timezone: summary.timezone,
        lastSyncAt: new Date(), // Important pour la synchronisation avec les viewers
      },
    })
  }

  async fetchDevices(systemId: string, accessToken: string, connectionId?: string): Promise<any> {
    return this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/devices`,
      accessToken,
      connectionId,
      systemId
    )
  }

  async fetchSystemEvents(
    connectionId: string,
    systemId: string,
    accessToken: string,
    startDate?: Date
  ): Promise<void> {
    const params = startDate ? `?start_at=${Math.floor(startDate.getTime() / 1000)}` : ''
    const events = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/events${params}`,
      accessToken,
      connectionId,
      systemId
    )

    // TODO: Stockage des vnements supprim (modle SystemEvent retir du schma)
    // Les vnements sont disponibles via l'API si ncessaire
    console.log(`[DATA] ${events.events?.length || 0} vnements rcuprs (non stocks)`)
  }

  async fetchSystemAlarms(
    connectionId: string,
    systemId: string,
    accessToken: string
  ): Promise<void> {
    const alarms = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/alarms`,
      accessToken,
      connectionId,
      systemId
    )

    // TODO: Stockage des alarmes supprim (modle SystemEvent retir du schma)
    // Les alarmes sont disponibles via l'API si ncessaire
    console.log(`[ATTENTION] ${alarms.alarms?.length || 0} alarmes rcupres (non stockes)`)
  }

  // ========== PRODUCTION MONITORING ==========

  async fetchAndStoreProductionMeterReadings(
    connectionId: string,
    systemId: string,
    accessToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    let params = ''
    if (startDate) params += `?start_at=${Math.floor(startDate.getTime() / 1000)}`
    if (endDate) params += `&end_at=${Math.floor(endDate.getTime() / 1000)}`

    const data = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/production_meter_readings${params}`,
      accessToken
    )

    if (data.intervals && Array.isArray(data.intervals)) {
      const batchData = data.intervals.map((interval: any) => ({
        connectionId,
        systemId,
        source: 'production_meter',
        power: interval.powr,
        energy: interval.enwh,
        timestamp: new Date(interval.end_at * 1000),
        interval: interval.end_at - interval.start_at,
      }))

      // Insertion par batch pour optimiser
      if (batchData.length > 0) {
        await prisma.productionData.createMany({
          data: batchData,
          skipDuplicates: true,
        })
      }
    }
  }

  async fetchAndStoreEnergyLifetime(
    connectionId: string,
    systemId: string,
    accessToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    let params = ''
    if (startDate) params += `?start_at=${Math.floor(startDate.getTime() / 1000)}`
    if (endDate) params += `&end_at=${Math.floor(endDate.getTime() / 1000)}`

    const data = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/energy_lifetime${params}`,
      accessToken
    )

    // Mettre  jour le snapshot avec les donnes lifetime dans metadata
    if (data.energy_lifetime) {
      const existingSnapshot = await prisma.productionData.findFirst({
        where: { connectionId, systemId, interval: 0, source: 'summary' },
        orderBy: { timestamp: 'desc' },
      })

      if (existingSnapshot) {
        const currentMetadata = (existingSnapshot.metadata as any) || {}
        await prisma.productionData.update({
          where: { id: existingSnapshot.id },
          data: {
            metadata: {
              ...currentMetadata,
              energyLifetime: data.energy_lifetime,
            },
          },
        })
      }
    }
  }

  async fetchAndStoreProductionTelemetry(
    connectionId: string,
    systemId: string,
    accessToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    let params = ''
    if (startDate) params += `?start_at=${Math.floor(startDate.getTime() / 1000)}`
    if (endDate) params += `&end_at=${Math.floor(endDate.getTime() / 1000)}`

    const data = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/telemetry/production_meter${params}`,
      accessToken
    )

    if (data.intervals && Array.isArray(data.intervals)) {
      const batchData = data.intervals.map((interval: any) => ({
        connectionId,
        systemId,
        source: 'production_meter_telemetry',
        power: interval.powr,
        energy: interval.enwh,
        voltage: interval.voltage,
        current: interval.current,
        frequency: interval.frequency,
        powerFactor: interval.power_factor,
        timestamp: new Date(interval.end_at * 1000),
        interval: interval.end_at - interval.start_at,
      }))

      if (batchData.length > 0) {
        await prisma.productionData.createMany({
          data: batchData,
          skipDuplicates: true,
        })
      }
    }
  }

  // ========== CONSUMPTION MONITORING ==========

  async fetchAndStoreConsumptionLifetime(
    connectionId: string,
    systemId: string,
    accessToken: string
  ): Promise<void> {
    try {
      const data = await this.fetchEnphaseAPI(
        `/api/v4/systems/${systemId}/consumption_lifetime`,
        accessToken,
        connectionId,
        systemId
      )

      const existingSnapshot = await prisma.productionData.findFirst({
        where: { connectionId, systemId, interval: 0, source: 'summary' },
        orderBy: { timestamp: 'desc' },
      })

      if (existingSnapshot && data.consumption_lifetime) {
        const currentMetadata = (existingSnapshot.metadata as any) || {}
        await prisma.productionData.update({
          where: { id: existingSnapshot.id },
          data: {
            metadata: {
              ...currentMetadata,
              consumptionLifetime: data.consumption_lifetime,
            },
          },
        })
      }
    } catch (error: any) {
      // Systme sans compteur de consommation - OK, on continue
      if (error.message.includes('422') || error.message.includes('consumption meter')) {
        console.log('[ATTENTION] Systme sans compteur de consommation (normal)')
      } else {
        throw error
      }
    }
  }

  async fetchAndStoreConsumptionTelemetry(
    connectionId: string,
    systemId: string,
    accessToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    let params = ''
    if (startDate) params += `?start_at=${Math.floor(startDate.getTime() / 1000)}`
    if (endDate) params += `&end_at=${Math.floor(endDate.getTime() / 1000)}`

    const data = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/telemetry/consumption_meter${params}`,
      accessToken
    )

    if (data.intervals && Array.isArray(data.intervals)) {
      const batchData = data.intervals.map((interval: any) => ({
        connectionId,
        systemId,
        source: 'consumption_meter',
        power: interval.powr,
        energy: interval.enwh,
        voltage: interval.voltage,
        current: interval.current,
        frequency: interval.frequency,
        powerFactor: interval.power_factor,
        timestamp: new Date(interval.end_at * 1000),
        interval: interval.end_at - interval.start_at,
      }))

      if (batchData.length > 0) {
        await prisma.productionData.createMany({
          data: batchData,
          skipDuplicates: true,
        })
      }
    }
  }

  // ========== BATTERY MONITORING ==========

  async fetchAndStoreBatteryLifetime(
    connectionId: string,
    systemId: string,
    accessToken: string
  ): Promise<void> {
    const data = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/battery_lifetime`,
      accessToken
    )

    const existingSnapshot = await prisma.productionData.findFirst({
      where: { connectionId, systemId, interval: 0, source: 'summary' },
      orderBy: { timestamp: 'desc' },
    })

    if (existingSnapshot && data.battery_lifetime) {
      const currentMetadata = (existingSnapshot.metadata as any) || {}
      await prisma.productionData.update({
        where: { id: existingSnapshot.id },
        data: {
          metadata: {
            ...currentMetadata,
            batteryLifetime: data.battery_lifetime,
          },
        },
      })
    }
  }

  async fetchAndStoreBatteryTelemetry(
    connectionId: string,
    systemId: string,
    accessToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    let params = ''
    if (startDate) params += `?start_at=${Math.floor(startDate.getTime() / 1000)}`
    if (endDate) params += `&end_at=${Math.floor(endDate.getTime() / 1000)}`

    const data = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/telemetry/battery${params}`,
      accessToken
    )

    if (data.intervals && Array.isArray(data.intervals)) {
      for (const interval of data.intervals) {
        if (interval.devices && Array.isArray(interval.devices)) {
          const batchData = interval.devices.map((device: any) => ({
            connectionId,
            systemId,
            deviceSerialNo: device.serial_number,
            power: device.power,
            energy: device.energy,
            percentFull: device.percent_full,
            temperature: device.temperature,
            state: device.state,
            maxCellTemp: device.max_cell_temp,
            timestamp: new Date(interval.end_at * 1000),
            interval: interval.end_at - interval.start_at,
          }))

          if (batchData.length > 0) {
            await prisma.productionData.createMany({
              data: batchData,
              skipDuplicates: true,
            })
          }
        }
      }
    }
  }

  // ========== IMPORT/EXPORT ==========

  async fetchAndStoreImportExport(
    connectionId: string,
    systemId: string,
    accessToken: string
  ): Promise<void> {
    try {
      const importData = await this.fetchEnphaseAPI(
        `/api/v4/systems/${systemId}/energy_import_lifetime`,
        accessToken
      )
      const exportData = await this.fetchEnphaseAPI(
        `/api/v4/systems/${systemId}/energy_export_lifetime`,
        accessToken
      )

      const existingSnapshot = await prisma.productionData.findFirst({
        where: { connectionId, systemId, interval: 0, source: 'summary' },
        orderBy: { timestamp: 'desc' },
      })

      if (existingSnapshot) {
        const currentMetadata = (existingSnapshot.metadata as any) || {}
        await prisma.productionData.update({
          where: { id: existingSnapshot.id },
          data: {
            metadata: {
              ...currentMetadata,
              importLifetime: importData.energy_import_lifetime,
              exportLifetime: exportData.energy_export_lifetime,
            },
          },
        })
      }
    } catch (error) {
      console.warn('Import/Export data not available for this system')
    }
  }

  // ========== LIVE DATA ==========

  async fetchAndStoreLatestTelemetry(
    connectionId: string,
    systemId: string,
    accessToken: string
  ): Promise<void> {
    const data = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/latest_telemetry`,
      accessToken
    )

    const existingSnapshot = await prisma.productionData.findFirst({
      where: { connectionId, systemId, interval: 0, source: 'summary' },
      orderBy: { timestamp: 'desc' },
    })

    if (existingSnapshot) {
      const currentMetadata = (existingSnapshot.metadata as any) || {}
      await prisma.productionData.update({
        where: { id: existingSnapshot.id },
        data: {
          power: data.production_power, // Puissance actuelle de production
          metadata: {
            ...currentMetadata,
            consumptionPower: data.consumption_power,
            batteryPower: data.battery_power,
          },
        },
      })
    }
  }

  // ========== DEVICE LEVEL MONITORING ==========

  async fetchAndStoreDeviceTelemetry(
    connectionId: string,
    systemId: string,
    deviceType: 'micros' | 'acbs' | 'encharges',
    serialNo: string,
    accessToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    let params = ''
    if (startDate) params += `?start_at=${Math.floor(startDate.getTime() / 1000)}`
    if (endDate) params += `&end_at=${Math.floor(endDate.getTime() / 1000)}`

    const data = await this.fetchEnphaseAPI(
      `/api/v4/systems/${systemId}/devices/${deviceType}/${serialNo}/telemetry${params}`,
      accessToken
    )

    if (data.intervals && Array.isArray(data.intervals)) {
      const batchData = data.intervals.map((interval: any) => ({
        connectionId,
        systemId,
        deviceType: deviceType.slice(0, -1), // Remove 's'
        serialNumber: serialNo,
        power: interval.powr,
        energy: interval.enwh,
        voltage: interval.voltage,
        current: interval.current,
        temperature: interval.temperature,
        status: interval.status,
        metadata: interval,
        timestamp: new Date(interval.end_at * 1000),
        interval: interval.end_at - interval.start_at,
      }))

      if (batchData.length > 0) {
        await prisma.productionData.createMany({
          data: batchData,
          skipDuplicates: true,
        })
      }
    }
  }

  // ========== SYNCHRONISATION ==========

  /**
   * SYNC INCRMENTALE - Rcupre uniquement les nouvelles donnes
   * Cot: 3-5 API calls | Quota: 1000/mois = 6-8x/jour max
   */
  async syncAllData(
    connectionId: string,
    systemId: string,
    accessToken: string
  ): Promise<{ apiCalls: number }> {
    console.log(`[SYNC] SYNC pour le systme ${systemId}`)
    let apiCalls = 0

    try {
      // 1. Summary + Latest telemetry
      await this.fetchAndStoreSystemSummary(connectionId, systemId, accessToken)
      apiCalls++
      await this.fetchAndStoreLatestTelemetry(connectionId, systemId, accessToken)
      apiCalls++
      console.log('[OK] Current data')

      // 2. Dernire sync
      const connection = await prisma.enphaseConnection.findUnique({
        where: { id: connectionId },
      })
      const lastSync = connection?.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000)

      // 3. Production depuis dernire sync
      await this.fetchAndStoreProductionTelemetry(connectionId, systemId, accessToken, lastSync)
      apiCalls++

      // 4. Consommation
      try {
        await this.fetchAndStoreConsumptionTelemetry(connectionId, systemId, accessToken, lastSync)
        apiCalls++
      } catch (error) {
        console.warn('[ATTENTION] Consumption not available')
      }

      // 5. Batterie
      try {
        await this.fetchAndStoreBatteryTelemetry(connectionId, systemId, accessToken, lastSync)
        apiCalls++
      } catch (error) {
        console.warn('[ATTENTION] Battery not available')
      }

      // 6. vnements (si > 6h)
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
      if (hoursSinceSync > 6) {
        await this.fetchSystemEvents(connectionId, systemId, accessToken, lastSync)
        apiCalls++
      }

      // Mise  jour
      await prisma.enphaseConnection.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date() },
      })

      console.log(`[OK] SYNC termine - ${apiCalls} API calls`)
      return { apiCalls }
    } catch (error) {
      console.error('[ERREUR] Erreur sync:', error)
      throw error
    }
  }

  /**
   * SYNC COMPLTE - Rcupre TOUT l'historique (premire connexion)
   * Cot: 10-15 API calls
   */
  async syncFullHistory(
    connectionId: string,
    systemId: string,
    accessToken: string
  ): Promise<{ apiCalls: number }> {
    console.log(`[SYNC] SYNC COMPLTE pour ${systemId}`)
    let apiCalls = 0

    try {
      // 1. Info systme
      await this.fetchAndStoreSystemSummary(connectionId, systemId, accessToken)
      apiCalls++
      await this.fetchAndStoreLatestTelemetry(connectionId, systemId, accessToken)
      apiCalls++

      // 2. Lifetime data
      await this.fetchAndStoreEnergyLifetime(connectionId, systemId, accessToken)
      apiCalls++

      // Consommation (peut chouer si pas de compteur)
      try {
        await this.fetchAndStoreConsumptionLifetime(connectionId, systemId, accessToken)
        apiCalls++
      } catch (error: any) {
        if (!error.message.includes('422') && !error.message.includes('consumption meter')) {
          throw error
        }
        // Sinon, on ignore (systme sans compteur de consommation)
      }

      // 3. Import/Export
      try {
        await this.fetchAndStoreImportExport(connectionId, systemId, accessToken)
        apiCalls += 2
      } catch {}

      // 4. Batterie lifetime
      try {
        await this.fetchAndStoreBatteryLifetime(connectionId, systemId, accessToken)
        apiCalls++
      } catch {}

      // 5. Production 30 derniers jours (par priodes)
      const now = new Date()
      const periods = [
        { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now },
        {
          start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          start: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        },
        {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
        },
      ]

      for (const period of periods) {
        try {
          await this.fetchAndStoreProductionTelemetry(
            connectionId,
            systemId,
            accessToken,
            period.start,
            period.end
          )
          apiCalls++
        } catch {}
      }

      // 6. Consommation 7j
      try {
        await this.fetchAndStoreConsumptionTelemetry(
          connectionId,
          systemId,
          accessToken,
          periods[0].start
        )
        apiCalls++
      } catch {}

      // 7. Batterie 7j
      try {
        await this.fetchAndStoreBatteryTelemetry(
          connectionId,
          systemId,
          accessToken,
          periods[0].start
        )
        apiCalls++
      } catch {}

      // 8. vnements 30j
      await this.fetchSystemEvents(connectionId, systemId, accessToken, periods[3].start)
      apiCalls++
      await this.fetchSystemAlarms(connectionId, systemId, accessToken)
      apiCalls++

      await prisma.enphaseConnection.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date() },
      })

      console.log(`[OK] SYNC COMPLTE termine - ${apiCalls} API calls`)
      return { apiCalls }
    } catch (error) {
      console.error('[ERREUR] Erreur sync complte:', error)
      throw error
    }
  }
}

export function getEnphaseDataCollector(): EnphaseDataCollector {
  const apiKey = process.env.ENPHASE_API_KEY || ''
  return new EnphaseDataCollector(apiKey)
}
