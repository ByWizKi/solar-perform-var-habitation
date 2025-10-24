'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Rediriger automatiquement vers le dashboard
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="min-h-scréeen flex items-center justify-center">
      <p className="text-gray-500">Redirection...</p>
    </div>
  )
}
