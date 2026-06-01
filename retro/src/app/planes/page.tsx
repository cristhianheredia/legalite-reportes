import { prisma } from '@/lib/prisma'
import { PHASE_ORDER } from '@/lib/constants'
import type { Phase } from '@prisma/client'
import PlanCard from './PlanCard'
import Link from 'next/link'

export const revalidate = 0

export default async function PlanesPage() {
  const templates = await prisma.cycleTemplate.findMany({
    orderBy: { version: 'desc' },
    include: {
      tasks: {
        where: { archived: false },
        select: { phase: true, owners: true },
        orderBy: [{ phase: 'asc' }, { order: 'asc' }],
      },
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes de ciclo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cada plan define las tareas y responsables por semana. Úsalo como base para un ciclo PM.
          </p>
        </div>
        <Link
          href="/cycle"
          className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Editar ciclo estándar →
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
          No hay planes registrados.
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <PlanCard
              key={t.id}
              template={{
                id: t.id,
                version: t.version,
                name: t.name,
                createdAt: t.createdAt.toISOString(),
                tasks: t.tasks as { phase: Phase; owners: string[] }[],
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
