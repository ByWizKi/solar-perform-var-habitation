'use client'

import Image from 'next/image'

interface VarHabitatLogoProps {
  className?: string
}

export default function VarHabitatLogo({ className = 'h-16' }: VarHabitatLogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/var-habitat-logo.png"
        alt="Var Habitat"
        width={400}
        height={200}
        className="object-contain w-full h-full"
        priority
      />
    </div>
  )
}
