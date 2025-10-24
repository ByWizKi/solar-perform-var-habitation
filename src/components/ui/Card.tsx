import { ReactNode, memo } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
}

function CardComponent({ children, className, title, description }: CardProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-6 shadow-sm', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ color: '#000000' }}>
          {title}
        </h3>
      )}
      {description && <p className="text-gray-600 text-sm mb-4">{description}</p>}
      {children}
    </div>
  )
}

// Optimisation : Éviter les re-renders inutiles
export default memo(CardComponent)
