import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { executionScore, effectivenessScore, phaseScores, criticalGaps } from '@/lib/scoring'
import { generateRecommendations } from '@/lib/recommendations'
import { PHASE_LABELS, PHASE_ORDER, WEIGHT_LABELS, PERSON_LABELS, PERSONS } from '@/lib/constants'
import CloseRetroButton from './CloseRetroButton'
import PrintButton from './PrintButton'

export const revalidate = 0

export default async function ReportPage({ params }: { params: { id: string } }) {
  const retro = await prisma.retro.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { task: true } },
      sessions: true,
      sprints: { include: { sessions: true }, orderBy: { createdAt: 'asc' } },
      template: {
        include: { tasks: { where: { archived: false }, orderBy: [{ phase: 'asc' }, { order: 'asc' }] } },
      },
    },
  })

  if (!retro) notFound()

  if (retro.status === 'OPEN') {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900">{retro.name}</h1>
        <p className="text-sm text-gray-500">
          La retro está abierta ({retro.sessions.length} de 4 sesiones completadas).
          Para generar el reporte debes cerrarla.
        </p>
        <CloseRetroButton retroId={retro.id} />
      </div>
    )
  }

  const items = retro.items
  const execution = executionScore(items)
  const effectiveness = effectivenessScore(items)
  const phases = phaseScores(items)
  const gaps = criticalGaps(items)
  const recommendations = generateRecommendations(items)

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between" data-print-hide>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Reporte de ciclo</p>
          <h1 className="text-2xl font-bold text-gray-900">{retro.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(retro.cycleDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
            {retro.closedAt && ` · Cerrado el ${new Date(retro.closedAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'long' })}`}
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Print header (only in print) */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">{retro.name}</h1>
        <p className="text-sm text-gray-500">
          {new Date(retro.cycleDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Global scores */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ScoreCard label="Ejecución" value={`${execution}%`} color={execution >= 70 ? 'green' : execution >= 50 ? 'amber' : 'red'} />
        <ScoreCard label="Efectividad" value={effectiveness > 0 ? effectiveness.toString() : '—'} sub="/5" color={effectiveness >= 4 ? 'green' : effectiveness >= 2.5 ? 'amber' : 'red'} />
        <ScoreCard label="Tareas hechas" value={items.filter(i => i.status === 'DONE').length.toString()} sub={`/${items.filter(i => i.status !== 'NA').length}`} color="gray" />
        <ScoreCard label="Brechas críticas" value={gaps.length.toString()} color={gaps.length === 0 ? 'green' : 'red'} />
      </div>

      {/* Phase breakdown */}
      <section className="phase-section">
        <h2 className="section-title text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Breakdown por fase</h2>
        <div className="space-y-3">
          {PHASE_ORDER.map((phase) => {
            const ps = phases[phase]
            return (
              <div key={phase} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{PHASE_LABELS[phase]}</span>
                  <span className="text-sm font-bold text-gray-900">{ps.execution}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2" data-phase-bar>
                  <div
                    className={`h-2 rounded-full ${ps.execution >= 70 ? 'bg-green-500' : ps.execution >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${ps.execution}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{ps.done}/{ps.total} tareas · efectividad: {ps.effectiveness > 0 ? `${ps.effectiveness}/5` : '—'}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tasks table */}
      <section className="phase-section">
        <h2 className="section-title text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Detalle de tareas</h2>
        <div className="space-y-6">
          {PHASE_ORDER.map((phase) => {
            const phaseTasks = retro.template.tasks.filter((t) => t.phase === phase)
            if (phaseTasks.length === 0) return null
            return (
              <div key={phase}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{PHASE_LABELS[phase]}</p>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Tarea</th>
                        <th className="text-center px-3 py-2 text-gray-500 font-medium">Estado</th>
                        <th className="text-center px-3 py-2 text-gray-500 font-medium">Ef.</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {phaseTasks.map((task) => {
                        const taskItems = items.filter((i) => i.taskId === task.id)
                        const doneItem = taskItems.find((i) => i.status === 'DONE')
                        const anyDone = taskItems.some((i) => i.status === 'DONE')
                        const anyNotDone = taskItems.some((i) => i.status === 'NOT_DONE')
                        const allNA = taskItems.every((i) => i.status === 'NA') && taskItems.length > 0
                        const statusDisplay = allNA ? 'NA' : anyDone ? 'DONE' : anyNotDone ? 'NOT_DONE' : '—'
                        const notes = taskItems.filter((i) => i.note).map((i) => `${PERSON_LABELS[i.person as keyof typeof PERSON_LABELS] ?? i.person}: ${i.note}`).join(' / ')
                        const avgEf = taskItems.filter(i => i.effectiveness).length > 0
                          ? (taskItems.reduce((s, i) => s + (i.effectiveness ?? 0), 0) / taskItems.filter(i => i.effectiveness).length).toFixed(1)
                          : '—'
                        return (
                          <tr key={task.id} className={task.weight === 'HIGH' ? 'bg-red-50/30' : ''}>
                            <td className="px-3 py-2">
                              <span className="font-medium text-gray-800">{task.title}</span>
                              <span className="text-gray-400 ml-1">· {WEIGHT_LABELS[task.weight]}</span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusDisplay === 'DONE' ? 'bg-green-100 text-green-700' : statusDisplay === 'NOT_DONE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                {statusDisplay === 'DONE' ? 'Hecho' : statusDisplay === 'NOT_DONE' ? 'No hecho' : statusDisplay === 'NA' ? 'N/A' : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center text-gray-600">{avgEf}</td>
                            <td className="px-3 py-2 text-gray-500">{notes || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Critical gaps */}
      {gaps.length > 0 && (
        <section className="phase-section">
          <h2 className="section-title text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Brechas críticas</h2>
          <div className="space-y-2">
            {gaps.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <span className="text-red-500 text-sm">⚠</span>
                <div>
                  <p className="text-sm font-medium text-red-800">{item.task.title}</p>
                  <p className="text-xs text-red-600">{PHASE_LABELS[item.task.phase]} · Ponderación alta</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sprint timeline (PM cycles only) */}
      {retro.sprints.length > 0 && (
        <section className="phase-section">
          <h2 className="section-title text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Timeline de sprints
          </h2>
          <div className="space-y-2">
            {retro.sprints.map((sprint, i) => {
              const sprintItems = items.filter(
                (item) => item.task.phase === sprint.phase,
              )
              const sprintExecution = executionScore(sprintItems)
              const sprintEffectiveness = effectivenessScore(sprintItems)
              const miniRetroDone = sprint.sessions.length
              const statusColors: Record<string, string> = {
                UPCOMING: 'bg-blue-100 text-blue-700',
                ACTIVE: 'bg-green-100 text-green-700',
                GRACE: 'bg-amber-100 text-amber-700',
                CLOSED: 'bg-gray-100 text-gray-600',
              }
              const statusLabels: Record<string, string> = {
                UPCOMING: 'Próximo',
                ACTIVE: 'Activo',
                GRACE: 'Gracia',
                CLOSED: 'Cerrado',
              }

              return (
                <div
                  key={sprint.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    S{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">
                        {PHASE_LABELS[sprint.phase as keyof typeof PHASE_LABELS]}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[sprint.status]}`}>
                        {statusLabels[sprint.status]}
                      </span>
                    </div>
                    {sprint.status === 'CLOSED' && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Mini-retros: {miniRetroDone}/{PERSONS.length}
                        {sprint.closedAt && ` · Cerrado ${new Date(sprint.closedAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}`}
                      </p>
                    )}
                  </div>
                  {sprint.status === 'CLOSED' && sprintItems.length > 0 && (
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-bold ${sprintExecution >= 70 ? 'text-green-600' : sprintExecution >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {sprintExecution}%
                      </p>
                      <p className="text-xs text-gray-400">
                        ef. {sprintEffectiveness > 0 ? `${sprintEffectiveness}/5` : '—'}
                      </p>
                    </div>
                  )}
                  {sprint.status !== 'UPCOMING' && (
                    <a
                      href={`/sprint/${sprint.id}`}
                      className="text-xs text-gray-400 hover:text-red-600 shrink-0"
                    >
                      Ver →
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="phase-section">
          <h2 className="section-title text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recomendaciones para el siguiente ciclo</h2>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <span className="text-blue-400 text-sm mt-0.5">→</span>
                <p className="text-sm text-blue-800">{rec}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ScoreCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const colors = {
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    gray: 'text-gray-700',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${colors[color as keyof typeof colors]}`}>
        {value}<span className="text-base font-normal text-gray-400">{sub}</span>
      </p>
    </div>
  )
}
