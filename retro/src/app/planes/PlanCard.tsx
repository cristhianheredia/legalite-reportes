'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PHASE_LABELS, PHASE_ORDER } from '@/lib/constants'
import type { Phase } from '@prisma/client'

type TaskSummary = { phase: Phase; owners: string[] }

type Template = {
  id: string
  version: number
  name: string
  createdAt: string
  tasks: TaskSummary[]
}

const PERSON_LABELS: Record<string, string> = {
  cristhian: 'Cristhian',
  andres: 'Andrés',
  sahian: 'Sahian',
  sandra: 'Sandra',
}

export default function PlanCard({ template }: { template: Template }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [cycleDate, setCycleDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const phaseGroups = PHASE_ORDER.map((phase) => {
    const phaseTasks = template.tasks.filter((t) => t.phase === phase)
    if (phaseTasks.length === 0) return null
    const allOwners = Array.from(new Set(phaseTasks.flatMap((t) => t.owners)))
    return { phase, count: phaseTasks.length, owners: allOwners }
  }).filter(Boolean) as { phase: Phase; count: number; owners: string[] }[]

  const displayName = template.name || 'Ciclo estándar'
  const isStandard = !template.name

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !cycleDate) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/retros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          cycleDate,
          withSprints: true,
          templateId: template.id,
        }),
      })
      if (!res.ok) throw new Error()
      const retro = await res.json()
      router.push(`/retro/${retro.id}`)
    } catch {
      setError('No se pudo crear el ciclo. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isStandard && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  Estándar
                </span>
              )}
              {!isStandard && (
                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  Especial
                </span>
              )}
              <span className="text-xs text-gray-400">v{template.version}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{displayName}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {template.tasks.length} tareas · {phaseGroups.length} semanas ·{' '}
              {new Date(template.createdAt).toLocaleDateString('es-EC', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          {!showForm && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/planes/${template.id}`}
                className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ver tareas
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
              >
                + Crear ciclo PM
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Phase breakdown */}
      <div className="px-5 py-4 space-y-2">
        {phaseGroups.map((g) => (
          <div key={g.phase} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-48 shrink-0 truncate">
              {PHASE_LABELS[g.phase]}
            </span>
            <span className="text-xs font-medium text-gray-700">{g.count} tareas</span>
            <div className="flex gap-1 ml-auto">
              {g.owners.map((o) => (
                <span
                  key={o}
                  className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium"
                >
                  {PERSON_LABELS[o] ?? o}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create cycle form */}
      {showForm && (
        <div className="border-t border-gray-100 p-5 bg-gray-50">
          <p className="text-xs font-semibold text-gray-700 mb-3">Nuevo ciclo PM basado en este plan</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del ciclo (ej: Ciclo Junio 2026)"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <input
              type="date"
              value={cycleDate}
              onChange={(e) => setCycleDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !name.trim() || !cycleDate}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Iniciar ciclo PM →'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError('') }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
