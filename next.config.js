/** @type {import('next').NextConfig} */

// Headers de sécurité recommandés
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
]

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Pour Docker

  // Optimisations de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Supprimer les console.log en prod
  },

  // Configuration des images pour optimisation
  images: {
    formats: ['image/avif', 'image/webp'], // Formats modernes plus légers
    deviceSizes: [640, 768, 1024, 1280, 1536], // Breakpoints responsives
    imageSizes: [16, 32, 48, 64, 96], // Tailles des icônes
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache 30 jours
  },

  // Compression Gzip/Brotli automatique
  compress: true,

  // Headers de cache et sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache statique pour les assets
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Gestion du cache pour les pages statiques
  experimental: {
    optimizeCss: true, // Optimiser le CSS avec Critters
  },
}

module.exports = nextConfig
