'use client'

import { memo, useMemo } from 'react'

interface EcoFactsProps {
  energyTodayWh: number // nergie produite aujourd'hui en Wh
  lifetimeEnergyWh?: number // Optionnel: nergie totale pour comparaison
}

// Prix du kWh en euros (identique au dashboard)
const PRIX_KWH_EURO = 0.2062 // Prix moyen en France 2024

function EcoFactsComponent({ energyTodayWh, lifetimeEnergyWh }: EcoFactsProps) {
  // Mémoïser les calculs pour éviter de les refaire à chaque render
  const calculations = useMemo(() => {
    const kWh = energyTodayWh / 1000
    const lifetimeKWh = lifetimeEnergyWh ? lifetimeEnergyWh / 1000 : 0

    // Calculs bass sur des donnes relles
    const co2Saved = kWh * 0.5 // 0.5 kg CO2 par kWh (moyenne mix nergtique)
    const eurosEarned = (kWh * PRIX_KWH_EURO).toFixed(2) // Tarif moyen lectricit en France
    const phoneCharges = Math.floor(kWh * 200) // 5 Wh par charge de smartphone
    const teslaCharges = (kWh / 100).toFixed(2) // Tesla Model S = 100 kWh
    const kmElectricCar = Math.floor(kWh * 5) // ~5 km par kWh pour une voiture lectrique
    const treesEquivalent = (co2Saved / 25).toFixed(1) // Un arbre absorbe ~25 kg CO2/an
    const houseDays = (kWh / 10).toFixed(1) // Une maison consomme ~10 kWh/jour en moyenne
    const ledHours = Math.floor(kWh * 100) // LED 10W = 100 heures par kWh
    const laptopHours = Math.floor(kWh * 16) // Laptop 60W = ~16h par kWh

    return {
      kWh,
      lifetimeKWh,
      co2Saved,
      eurosEarned,
      phoneCharges,
      teslaCharges,
      kmElectricCar,
      treesEquivalent,
      houseDays,
      ledHours,
      laptopHours,
    }
  }, [energyTodayWh, lifetimeEnergyWh])

  const facts = useMemo(() => {
    const {
      eurosEarned,
      co2Saved,
      treesEquivalent,
      phoneCharges,
      kmElectricCar,
      teslaCharges,
      houseDays,
      ledHours,
      laptopHours,
    } = calculations

    return [
      {
        icon: '💰',
        value: `${eurosEarned} €`,
        label: 'Économisés',
        detail: "Valeur de la production d'aujourd'hui",
      },
      {
        icon: '🌳',
        value:
          co2Saved >= 1000
            ? `${(co2Saved / 1000).toFixed(2)} tonnes`
            : `${co2Saved.toFixed(1)} kg`,
        label: 'CO₂ évité',
        detail: `Équivalent à planter ${treesEquivalent} arbre${
          parseFloat(treesEquivalent) > 1 ? 's' : ''
        }`,
      },
      {
        icon: '📱',
        value: phoneCharges.toLocaleString('fr-FR'),
        label: 'Smartphones',
        detail: 'Recharges complètes',
      },
      {
        icon: '🚗',
        value: kmElectricCar.toLocaleString('fr-FR'),
        label: 'km parcourus',
        detail: 'En voiture électrique',
      },
      {
        icon: '🔋',
        value: teslaCharges,
        label: 'Tesla',
        detail: 'Batteries chargées (100 kWh)',
      },
      {
        icon: '🏠',
        value: houseDays,
        label: 'jours',
        detail: "Alimentation d'une maison",
      },
      {
        icon: '💡',
        value: ledHours.toLocaleString('fr-FR'),
        label: 'heures LED',
        detail: 'Ampoule 10W allumée',
      },
      {
        icon: '💻',
        value: laptopHours.toLocaleString('fr-FR'),
        label: 'heures laptop',
        detail: 'Ordinateur en utilisation',
      },
    ]
  }, [calculations])

  if (calculations.kWh === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Impact Aujourd&apos;hui </h3>
            <p className="text-sm text-gray-600">
              Avec {calculations.kWh.toFixed(2)} kWh produits aujourd&apos;hui
            </p>
          </div>
        </div>
        {calculations.lifetimeKWh > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Total depuis installation</p>
            <p className="text-sm font-semibold text-green-700">
              {calculations.lifetimeKWh >= 1000
                ? `${(calculations.lifetimeKWh / 1000).toFixed(1)} MWh`
                : `${calculations.lifetimeKWh.toFixed(0)} kWh`}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {facts.map((fact, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{fact.icon}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{fact.value}</div>
              <div className="text-xs font-medium text-gray-700 mb-1">{fact.label}</div>
              <div className="text-xs text-gray-500">{fact.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
        <p className="text-xs text-gray-600 text-center">
          🌍 Aujourd&apos;hui, vous avez évité {calculations.co2Saved.toFixed(2)} kg de CO₂ !
          Continuez comme ça pour un avenir plus propre et durable. 🌱
        </p>
      </div>
    </div>
  )
}

// Optimisation : Éviter les re-renders et recalculs inutiles
export default memo(EcoFactsComponent)
