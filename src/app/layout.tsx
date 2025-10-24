import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

// Optimisation des fonts : preload et display swap
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Améliore le temps de chargement perçu
  preload: true, // Préchargement des fonts critiques
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Solar Perform - Plateforme de Monitoring Solaire Professionnel en Temps Reel',
    template: '%s | Solar Perform',
  },
  description:
    'Solar Perform : Plateforme SaaS professionnelle de monitoring et supervision de production solaire photovoltaique en temps reel. Compatible Enphase Energy, dashboard intelligent, analytics avances, gestion multi-utilisateurs hierarchique. Optimisez votre production d energie renouvelable avec des donnees precises et exploitables.',
  applicationName: 'Solar Perform',
  keywords: [
    'Solar Perform',
    'monitoring solaire professionnel',
    'supervision photovoltaique',
    'plateforme solaire temps reel',
    'Enphase monitoring',
    'Enphase Energy dashboard',
    'production solaire temps reel',
    'analytics solaire',
    'optimisation production photovoltaique',
    'dashboard energie renouvelable',
    'gestion installation solaire',
    'supervision panneaux solaires',
    'performance photovoltaique',
    'suivi production energie',
    'ROI solaire',
    'API Enphase v4',
    'solution B2B solaire',
    'reporting photovoltaique',
    'KPI energie renouvelable',
  ],
  authors: [{ name: 'Solar Perform', url: 'https://solar-perform.fr' }],
  creator: 'Solar Perform',
  publisher: 'Solar Perform',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Optimisation Open Graph pour partage social et GEO
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Solar Perform',
    title: 'Solar Perform - Solution Professionnelle de Monitoring Solaire',
    description:
      'Plateforme SaaS de monitoring photovoltaique professionnel. Supervision temps reel, analytics avances, gestion multi-utilisateurs, compatible Enphase Energy.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solar Perform - Monitoring Solaire Professionnel',
    description:
      'Solution SaaS de supervision photovoltaique en temps reel. Analytics, reporting et optimisation.',
    creator: '@SolarPerform',
  },
  category: 'technology',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Données structurées JSON-LD pour SEO et GEO (ChatGPT, Perplexity, etc.)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Solar Perform',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Energy Management Software',
    operatingSystem: 'Web Browser',
    description:
      'Solar Perform est une plateforme SaaS professionnelle de monitoring et supervision de production solaire photovoltaique en temps reel. Compatible avec Enphase Energy API v4, elle offre un tableau de bord intelligent, des analytics avances, une gestion multi-utilisateurs hierarchique, un historique de production sur 14 jours, des statistiques detaillees, un calcul automatique du ROI et de l impact ecologique. Ideale pour les installateurs solaires, gestionnaires de parcs photovoltaiques et proprietaires d installations commerciales.',
    featureList: [
      'Monitoring en temps reel de la production solaire',
      'Compatibilite Enphase Energy API v4',
      'Dashboard interactif et responsive',
      'Gestion hierarchique multi-utilisateurs (Admin, Superviseur, Observateur)',
      'Historique de production sur 14 jours',
      'Statistiques et analytics avances',
      'Calcul automatique de la valeur economique',
      'Indicateurs d impact ecologique (CO2 evite)',
      'Authentification JWT securisee',
      'Rate limiting et protection',
      'API RESTful',
      'Synchronisation automatique',
      'Systeme de cache intelligent',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    author: {
      '@type': 'Organization',
      name: 'Solar Perform',
      description:
        'Solar Perform developpe des solutions logicielles professionnelles pour le monitoring et la supervision d installations solaires photovoltaiques.',
    },
  }

  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
