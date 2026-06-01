import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PERSONS, PERSON_LABELS, PERSON_INITIALS, PHASE_LABELS } from '@/lib/constants'
import SprintRetroSession from './SprintRetroSession'

export const revalidate = 0

type Props = { params: { id: string }; searchParams: { person?: string } }

export default async function SprintRetroPage({ params, searchParams }: Props) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: params.id },
    include: {
      sessions: true,
      cycle: {
        include: {
          template: {
            include: {
              tasks: {
                where: { archived: false },
                orderBy: [{ order: 'asc' }],
              },
            },
          },
          items: true,
        },
      },
    },
  })

  if (!sprint) notFound()
  if (sprint.status !== 'CLOSED') redirect(`/sprint/${sprint.id}`)

  const selectedPerson = searchParams.person as (typeof PERSONS)[number] | undefined
  const validPerson = selectedPerson && PERSONS.includes(selectedPerson) ? selectedPerson : null

  // Already completed
  if (validPerson && sprint.sessions.some((s) => s.person === validPerson)) {
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

  if (validPerson) {
    const phaseTasks = sprint.cycle.template.tasks.filter(
      (t) => t.phase === sprint.phase && t.owners.includes(validPerson),
    )
    const personItems = sprint.cycle.items.filter((i) => i.person === validPerson)

    const tasksWithPreload = phaseTasks.map((task) => {
      const item = personItems.find((i) => i.taskId === task.id)
      const liveStatus = item?.liveStatus ?? 'PENDING'
      return {
        ...task,
        preloadedStatus: (liveStatus === 'DONE' ? 'DONE' : 'NOT_DONE') as 'DONE' | 'NOT_DONE',
        existingEffectiveness: item?.effectiveness ?? null,
        existingNote: item?.note ?? null,
      }
    })

    return (
      <SprintRetroSession
        sprintId={sprint.id}
        sprintLabel={PHASE_LABELS[sprint.phase]}
        person={validPerson}
        personLabel={PERSON_LABELS[validPerson]}
        tasks={tasksWithPreload}
      />
    )
  }

  // Person selector
  const completedSessions = sprint.sessions.map((s) => s.person)

  return (
    <div className="space-y-8">
      <div>
        <a href={`/sprint/${sprint.id}`} className="text-xs text-gray-400 hover:text-gray-600">
          ← Volver al sprint
        </a>
        <div className="mt-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Mini-retro del sprint</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
            {PHASE_LABELS[sprint.phase]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {completedSessions.length} de {PERSONS.length} sesiones completadas
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-4">¿Quién eres?</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PERSONS.map((person) => {
            const done = completedSessions.includes(person)
            return (
              <a
                key={person}
                href={done ? undefined : `/sprint/${sprint.id}/retro?person=${person}`}
                className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all text-center
                  ${
                    done
                      ? 'border-green-200 bg-green-50 cursor-not-allowed opacity-80'
                      : 'border-gray-200 bg-white hover:border-red-400 hover:shadow-md cursor-pointer'
                  }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                  ${done ? 'bg-green-600 text-white' : 'bg-gray-900 text-white'}`}
                >
                  {done ? '✓' : PERSON_INITIALS[person]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{PERSON_LABELS[person]}</p>
                  <p className={`text-xs mt-0.5 ${done ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    {done ? 'Completado' : 'Pendiente'}
                  </p>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
