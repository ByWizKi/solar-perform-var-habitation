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
  title: 'Var Solar - Monitoring Solaire',
  description:
    'Solution de monitoring solaire par Var Habitat - Suivez votre production en temps réel',
  keywords: ['solaire', 'monitoring', 'éénergie', 'photovoltaïque', 'Var Habitat'],
  authors: [{ name: 'Solar Perform' }],
  robots: {
    index: true,
    follow: true,
  },
  // Optimisation Open Graph pour partage social
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    title: 'Var Solar - Monitoring Solaire',
    description: 'Solution de monitoring solaire par Var Habitat',
    siteName: 'Var Solar',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
