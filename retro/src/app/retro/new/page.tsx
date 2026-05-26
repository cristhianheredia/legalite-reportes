'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewRetroPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [cycleDate, setCycleDate] = useState('')
  const [withSprints, setWithSprints] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !cycleDate) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/retros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), cycleDate, withSprints }),
      })
      if (!res.ok) throw new Error('Error al crear la retro')
      const retro = await res.json()
      router.push(`/retro/${retro.id}`)
    } catch {
      setError('No se pudo crear la retro. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Iniciar nueva retro</h1>
        <p className="text-sm text-gray-500 mt-1">
          Se tomará un snapshot del ciclo estándar actual como base.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del ciclo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Retro Taller Mayo 2026"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del taller
          </label>
          <input
            type="date"
            value={cycleDate}
            onChange={(e) => setCycleDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div
          onClick={() => setWithSprints(!withSprints)}
          className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
            withSprints ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Modo PM — Sprints semanales</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Crea 6 sprints (uno por semana) con tracking en tiempo real.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
              withSprints ? 'border-red-500 bg-red-500' : 'border-gray-300'
            }`}>
              {withSprints && <span className="text-white text-xs font-bold">✓</span>}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim() || !cycleDate}
          className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : withSprints ? 'Iniciar ciclo PM →' : 'Iniciar retro →'}
        </button>
      </form>
    </div>
  )
}
