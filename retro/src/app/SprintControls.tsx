'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Sprint = {
  id: string
  phase: string
  status: 'UPCOMING' | 'ACTIVE' | 'GRACE' | 'CLOSED'
}

export default function SprintControls({ sprint }: { sprint: Sprint }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function callEndpoint(path: string, key: string) {
    setLoading(key)
    await fetch(path, { method: 'POST' })
    setLoading(null)
    router.refresh()
  }

  if (sprint.status === 'UPCOMING') {
    return (
      <button
        onClick={() => callEndpoint(`/api/sprints/${sprint.id}/open`, 'open')}
        disabled={!!loading}
        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading === 'open' ? 'Abriendo...' : 'Abrir sprint →'}
      </button>
    )
  }

  if (sprint.status === 'ACTIVE') {
    return (
      <button
        onClick={() => callEndpoint(`/api/sprints/${sprint.id}/grace`, 'grace')}
        disabled={!!loading}
        className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
      >
        {loading === 'grace' ? 'Procesando...' : 'Iniciar cierre (gracia 8h)'}
      </button>
    )
  }

  if (sprint.status === 'GRACE') {
    return (
      <button
        onClick={() => callEndpoint(`/api/sprints/${sprint.id}/close`, 'close')}
        disabled={!!loading}
        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {loading === 'close' ? 'Cerrando...' : 'Confirmar cierre →'}
      </button>
    )
  }

  return null
}
