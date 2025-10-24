'use client'

import { useState, useEffect } from 'react'
import Card from './ui/Card'
import Button from './ui/Button'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  serviceName: string
  confirmText: string
  title?: string
  description?: string
  warningMessage?: string
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  serviceName,
  confirmText,
  title = 'Confirmer la suppression',
  description,
  warningMessage,
}: ConfirmDeleteModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setInputValue('')
      setIsDeleting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  const isConfirmDisabled = inputValue !== confirmText || isDeleting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md">
        <Card className="bg-white">
          <div className="mb-6">
            {/* Icne d'avertissement */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h2>

            {description && <p className="text-sm text-gray-600 text-center mb-4">{description}</p>}
          </div>

          <div className="space-y-4">
            {/* Message d'avertissement */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-red-800">Attention !</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {warningMessage ||
                      'Cette action est irrversible. Toutes les donnes associes seront dfinitivement supprimes.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dtails de ce qui sera supprim */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Les lments suivants seront supprims :
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Connexion au service {serviceName}</li>
                <li>Tous les snapshots systme</li>
                <li>Toutes les donnes de production</li>
                <li>Toutes les donnes de consommation</li>
                <li>Toutes les donnes de batterie</li>
                <li>Tous les appareils et quipements</li>
                <li>Tous les vnements systme</li>
                <li>Tous les logs d&apos;appels API</li>
              </ul>
            </div>

            {/* Champ de confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pour confirmer, tapez <span className="font-mono font-bold">{confirmText}</span> :
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={confirmText}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                autoFocus
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={isDeleting}>
                Annuler
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300"
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer dfinitivement'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
