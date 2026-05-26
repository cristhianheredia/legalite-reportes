import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PERSONS, PERSON_LABELS, PHASE_LABELS, PHASE_ORDER } from '@/lib/constants'
import { executionScore } from '@/lib/scoring'
import SprintControls from './SprintControls'

export const revalidate = 0

const SPRINT_STATUS_LABELS = {
  UPCOMING: 'Próximo',
  ACTIVE: 'Semana activa',
  GRACE: 'Periodo de gracia',
  CLOSED: 'Cerrado',
} as const

const SPRINT_STATUS_COLORS = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  GRACE: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-gray-100 text-gray-500',
} as const

export default async function Dashboard() {
  const allRetros = await prisma.retro.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sessions: true,
      items: { include: { task: true } },
      sprints: { include: { sessions: true }, orderBy: { createdAt: 'asc' } },
    },
  })

  const open = allRetros.filter((r) => r.status === 'OPEN')
  const closed = allRetros.filter((r) => r.status === 'CLOSED').slice(0, 5)

  // Split open retros into PM cycles (with sprints) and legacy retros
  const pmCycles = open.filter((r) => r.sprints.length > 0)
  const legacyRetros = open.filter((r) => r.sprints.length === 0)

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retrospectivas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión del ciclo operativo Legalité</p>
        </div>
        <Link
          href="/retro/new"
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + Iniciar nueva retro
        </Link>
      </div>

      {/* PM Cycles con sprints */}
      {pmCycles.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Ciclos PM activos
          </h2>
          <div className="space-y-4">
            {pmCycles.map((cycle) => {
              const activeSprint = cycle.sprints.find(
                (s) => s.status === 'ACTIVE' || s.status === 'GRACE',
              )
              const nextSprint = cycle.sprints.find((s) => s.status === 'UPCOMING')
              const sprintToShow = activeSprint ?? nextSprint

              const closedCount = cycle.sprints.filter((s) => s.status === 'CLOSED').length
              const totalSprints = cycle.sprints.length

              return (
                <div
                  key={cycle.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
                >
                  {/* Cycle header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{cycle.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(cycle.cycleDate).toLocaleDateString('es-EC', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {closedCount}
                        <span className="text-xs font-normal text-gray-400">/{totalSprints} sprints</span>
                      </p>
                      <p className="text-xs text-gray-400">cerrados</p>
                    </div>
                  </div>

                  {/* Sprint timeline pills */}
                  <div className="flex gap-1.5 flex-wrap">
                    {cycle.sprints.map((sprint) => (
                      <a
                        key={sprint.id}
                        href={
                          sprint.status !== 'UPCOMING'
                            ? `/sprint/${sprint.id}`
                            : undefined
                        }
                        className={`text-xs px-2 py-1 rounded-md font-medium transition-colors
                          ${SPRINT_STATUS_COLORS[sprint.status]}
                          ${sprint.status !== 'UPCOMING' ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
                        `}
                        title={PHASE_LABELS[sprint.phase as keyof typeof PHASE_LABELS]}
                      >
                        S{PHASE_ORDER.indexOf(sprint.phase as typeof PHASE_ORDER[number]) + 1}
                        {' · '}
                        {sprint.status === 'CLOSED'
                          ? `${sprint.sessions.length}/${PERSONS.length} ✓`
                          : SPRINT_STATUS_LABELS[sprint.status]}
                      </a>
                    ))}
                  </div>

                  {/* Active sprint detail */}
                  {sprintToShow && (
                    <div
                      className={`rounded-lg border p-4 ${
                        sprintToShow.status === 'ACTIVE'
                          ? 'border-green-200 bg-green-50'
                          : sprintToShow.status === 'GRACE'
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${SPRINT_STATUS_COLORS[sprintToShow.status]}`}
                            >
                              {SPRINT_STATUS_LABELS[sprintToShow.status]}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {PHASE_LABELS[sprintToShow.phase as keyof typeof PHASE_LABELS]}
                          </p>

                          {/* Per-person progress for active sprint */}
                          {(sprintToShow.status === 'ACTIVE' || sprintToShow.status === 'GRACE') && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {PERSONS.map((p) => {
                                const personItems = cycle.items.filter(
                                  (i) => i.person === p && i.liveStatus === 'DONE' && i.task.phase === sprintToShow.phase,
                                )
                                return (
                                  <span key={p} className="text-xs text-gray-500">
                                    {PERSON_LABELS[p]}: {personItems.length} ✓
                                  </span>
                                )
                              })}
                            </div>
                          )}

                          {sprintToShow.status === 'CLOSED' && (
                            <a
                              href={`/sprint/${sprintToShow.id}/retro`}
                              className="text-xs text-red-600 hover:underline mt-1 block"
                            >
                              Mini-retro pendiente →
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {sprintToShow.status !== 'UPCOMING' && (
                            <a
                              href={`/sprint/${sprintToShow.id}`}
                              className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                              Ver sprint
                            </a>
                          )}
                          <SprintControls sprint={sprintToShow} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Link
                      href={`/retro/${cycle.id}`}
                      className="text-xs text-gray-500 hover:text-gray-900"
                    >
                      Ver ciclo completo →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Retros clásicas activas */}
      {legacyRetros.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Retros activas
          </h2>
          <div className="space-y-3">
            {legacyRetros.map((retro) => {
              const completed = retro.sessions.length
              const total = PERSONS.length
              return (
                <div
                  key={retro.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{retro.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(retro.cycleDate).toLocaleDateString('es-EC', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {PERSONS.map((p) => {
                        const done = retro.sessions.some((s) => s.person === p)
                        return (
                          <span
                            key={p}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {done ? '✓ ' : ''}
                            {PERSON_LABELS[p]}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {completed}
                        <span className="text-sm font-normal text-gray-400">/{total}</span>
                      </p>
                      <p className="text-xs text-gray-400">sesiones</p>
                    </div>
                    <Link
                      href={`/retro/${retro.id}`}
                      className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      Abrir retro →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {open.length === 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Retros activas
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
            No hay retros activas.{' '}
            <Link href="/retro/new" className="text-red-600 hover:underline">
              Inicia una nueva retro
            </Link>
          </div>
        </section>
      )}

      {/* Historial reciente */}
      {closed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Historial reciente
            </h2>
            <Link href="/history" className="text-xs text-red-600 hover:underline">
              Ver todo →
            </Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Ciclo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">
                    Ejecución
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Reporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {closed.map((retro) => (
                  <tr key={retro.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{retro.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-bold ${
                          executionScore(retro.items) >= 70 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {executionScore(retro.items)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/report/${retro.id}`}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
