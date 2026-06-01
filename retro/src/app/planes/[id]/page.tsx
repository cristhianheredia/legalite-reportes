import { prisma } from '@/lib/prisma'
import { PHASE_ORDER, PHASE_LABELS } from '@/lib/constants'
import CycleEditor from '@/app/cycle/CycleEditor'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function PlanDetailPage({ params }: { params: { id: string } }) {
  const template = await prisma.cycleTemplate.findUnique({
    where: { id: params.id },
    include: {
      tasks: { where: { archived: false }, orderBy: [{ phase: 'asc' }, { order: 'asc' }] },
    },
  })

  if (!template) notFound()

  const displayName = template.name || 'Ciclo estándar'

  const tasksByPhase = PHASE_ORDER.map((phase) => ({
    phase,
    label: PHASE_LABELS[phase],
    tasks: template.tasks.filter((t) => t.phase === phase),
  })).filter((g) => g.tasks.length > 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/planes" className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-2 inline-block">
            ← Planes de ciclo
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            v{template.version} · {template.tasks.length} tareas · {tasksByPhase.length} semanas
          </p>
        </div>
      </div>

      <CycleEditor templateId={template.id} tasksByPhase={tasksByPhase} />
    </div>
  )
}
