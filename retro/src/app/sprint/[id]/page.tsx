import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PERSONS, PERSON_LABELS, PERSON_INITIALS, PHASE_LABELS, PHASE_ORDER } from '@/lib/constants'
import SprintTracker from './SprintTracker'

export const revalidate = 0

type Props = { params: { id: string }; searchParams: { person?: string } }

const SPRINT_STATUS_LABELS = {
  UPCOMING: 'Próximo',
  ACTIVE: 'Semana activa',
  GRACE: 'Periodo de gracia',
  CLOSED: 'Cerrado',
} as const

export default async function SprintPage({ params, searchParams }: Props) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: params.id },
    include: {
      sessions: true,
      cycle: {
        include: {
          template: {
            include: {
              tasks: { where: { archived: false }, orderBy: [{ order: 'asc' }] },
            },
          },
          items: { include: { task: { select: { phase: true } } } },
        },
      },
    },
  })

  if (!sprint) notFound()

  const selectedPerson = searchParams.person as (typeof PERSONS)[number] | undefined
  const validPerson = selectedPerson && PERSONS.includes(selectedPerson) ? selectedPerson : null

  const phaseTasks = sprint.cycle.template.tasks.filter((t) => t.phase === sprint.phase)
  const personTasks = validPerson
    ? phaseTasks.filter((t) => t.owners.includes(validPerson))
    : []

  const personItems = sprint.cycle.items.filter(
    (i) => i.person === validPerson && i.task.phase === sprint.phase,
  )

  const tasksWithStatus = personTasks.map((task) => {
    const item = personItems.find((i) => i.taskId === task.id)
    return {
      ...task,
      liveStatus: (item?.liveStatus ?? 'PENDING') as 'PENDING' | 'DONE',
    }
  })

  const completedSessions = sprint.sessions.map((s) => s.person)

  if (validPerson && sprint.status !== 'UPCOMING') {
    const alreadyCompleted = sprint.status === 'CLOSED' && completedSessions.includes(validPerson)

    if (alreadyCompleted) {
      return (
        <div className="max-w-md mx-auto mt-16 text-center space-y-4">
          <p className="text-4xl">✅</p>
          <h1 className="text-xl font-bold text-gray-900">Mini-retro completada</h1>
          <p className="text-sm text-gray-500">
            Ya completaste la mini-retro de {PHASE_LABELS[sprint.phase]}.
          </p>
          <a
            href={`/retro/${sprint.cycleId}`}
            className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
          >
            Volver al ciclo
          </a>
        </div>
      )
    }

    return (
      <SprintTracker
        sprint={{
          id: sprint.id,
          cycleId: sprint.cycleId,
          status: sprint.status,
          graceEndsAt: sprint.graceEndsAt?.toISOString() ?? null,
        }}
        tasks={tasksWithStatus}
        person={validPerson}
        personLabel={PERSON_LABELS[validPerson]}
        sprintLabel={PHASE_LABELS[sprint.phase]}
      />
    )
  }

  // Person selector
  return (
    <div className="space-y-8">
      <div>
        <a href={`/retro/${sprint.cycleId}`} className="text-xs text-gray-400 hover:text-gray-600">
          ← Volver al ciclo
        </a>
        <div className="mt-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Sprint activo</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
            {PHASE_LABELS[sprint.phase]}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                sprint.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700'
                  : sprint.status === 'GRACE'
                    ? 'bg-amber-100 text-amber-700'
                    : sprint.status === 'CLOSED'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-blue-100 text-blue-700'
              }`}
            >
              {SPRINT_STATUS_LABELS[sprint.status]}
            </span>
            <span className="text-xs text-gray-400">
              {phaseTasks.length} tareas en esta semana
            </span>
          </div>
        </div>
      </div>

      {sprint.status === 'UPCOMING' ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-sm text-blue-800 font-medium">
            Este sprint aún no ha sido abierto por el admin.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-4">¿Quién eres?</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PERSONS.map((person) => {
              const personTaskCount = phaseTasks.filter((t) => t.owners.includes(person)).length
              const personDone = sprint.cycle.items.filter(
                (i) => i.person === person && i.liveStatus === 'DONE' && i.task.phase === sprint.phase,
              ).length
              const miniRetroDone = completedSessions.includes(person) && sprint.status === 'CLOSED'

              return (
                <a
                  key={person}
                  href={`/sprint/${sprint.id}?person=${person}`}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all text-center border-gray-200 bg-white hover:border-red-400 hover:shadow-md cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-gray-900 text-white">
                    {PERSON_INITIALS[person]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{PERSON_LABELS[person]}</p>
                    {personTaskCount > 0 ? (
                      <p className="text-xs mt-0.5 text-gray-400">
                        {personDone}/{personTaskCount} hechas
                        {miniRetroDone && (
                          <span className="ml-1 text-green-600 font-medium">· mini-retro ✓</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5 text-gray-400">Sin tareas</p>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
