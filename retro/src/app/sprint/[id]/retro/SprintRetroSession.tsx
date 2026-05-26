'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Task } from '@prisma/client'
import { WEIGHT_LABELS, STATUS_LABELS } from '@/lib/constants'

type TaskWithPreload = Task & {
  preloadedStatus: 'DONE' | 'NOT_DONE' | null
  existingEffectiveness: number | null
  existingNote: string | null
}

type Props = {
  sprintId: string
  sprintLabel: string
  person: string
  personLabel: string
  tasks: TaskWithPreload[]
}

type SaveState = 'idle' | 'saving' | 'saved'

function MiniRetroCard({
  task,
  sprintId,
  person,
}: {
  task: TaskWithPreload
  sprintId: string
  person: string
}) {
  const [status, setStatus] = useState<string | null>(task.preloadedStatus ?? null)
  const [effectiveness, setEffectiveness] = useState<number | null>(task.existingEffectiveness)
  const [note, setNote] = useState(task.existingNote ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const noteTimerRef = useRef<NodeJS.Timeout>()

  // Auto-save preloaded status on mount so closing without touching anything still persists data
  useEffect(() => {
    if (task.preloadedStatus !== null && task.existingEffectiveness === null) {
      save({ status: task.preloadedStatus, effectiveness: null, note: task.existingNote ?? '' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = useCallback(
    async (patch: { status?: string | null; effectiveness?: number | null; note?: string }) => {
      setSaveState('saving')
      try {
        await fetch(`/api/sprints/${sprintId}/items`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.id, person, ...patch }),
        })
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      } catch {
        setSaveState('idle')
      }
    },
    [sprintId, task.id, person],
  )

  function handleStatusChange(newStatus: string) {
    const newEffectiveness = newStatus === 'DONE' ? effectiveness : null
    setStatus(newStatus)
    if (newStatus !== 'DONE') setEffectiveness(null)
    save({ status: newStatus, effectiveness: newEffectiveness, note })
  }

  function handleEffectivenessChange(val: number) {
    setEffectiveness(val)
    save({ status, effectiveness: val, note })
  }

  function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setNote(val)
    clearTimeout(noteTimerRef.current)
    noteTimerRef.current = setTimeout(() => save({ status, effectiveness, note: val }), 600)
  }

  const weightColor =
    task.weight === 'HIGH'
      ? 'text-red-600 bg-red-50'
      : task.weight === 'MEDIUM'
        ? 'text-amber-600 bg-amber-50'
        : 'text-gray-500 bg-gray-100'

  const isPreloaded = task.preloadedStatus !== null

  return (
    <div
      className={`bg-white border rounded-lg p-4 space-y-3 ${
        status === 'DONE'
          ? 'border-green-200'
          : status === 'NOT_DONE'
            ? 'border-red-200'
            : status === 'NA'
              ? 'border-gray-200 opacity-70'
              : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-900 text-sm">{task.title}</p>
          {task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}
          {isPreloaded && (
            <span className="text-xs text-blue-500 mt-0.5 block">
              Pre-cargado del tracking semanal
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${weightColor}`}>
            {WEIGHT_LABELS[task.weight]}
          </span>
          <span
            className={`text-xs ${
              saveState === 'saving'
                ? 'text-amber-500'
                : saveState === 'saved'
                  ? 'text-green-500'
                  : 'text-transparent'
            }`}
          >
            {saveState === 'saving' ? '●' : '✓'}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {(['DONE', 'NOT_DONE', 'NA'] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors border
              ${
                status === s
                  ? s === 'DONE'
                    ? 'bg-green-600 text-white border-green-600'
                    : s === 'NOT_DONE'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-gray-500 text-white border-gray-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {status === 'DONE' && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Efectividad</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => handleEffectivenessChange(n)}
                className={`w-8 h-8 rounded-md text-sm font-bold transition-colors
                  ${
                    effectiveness === n
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {status && status !== 'NA' && (
        <textarea
          value={note}
          onChange={handleNoteChange}
          placeholder="Nota opcional..."
          rows={2}
          className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-700 placeholder-gray-300"
        />
      )}
    </div>
  )
}

export default function SprintRetroSession({ sprintId, sprintLabel, person, personLabel, tasks }: Props) {
  const router = useRouter()
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')

  async function handleClose() {
    setClosing(true)
    setError('')
    try {
      const res = await fetch(`/api/sprints/${sprintId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person }),
      })
      if (!res.ok) throw new Error()
      router.push(`/sprint/${sprintId}`)
    } catch {
      setError('Error al cerrar la sesión. Intenta de nuevo.')
      setClosing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <a href={`/sprint/${sprintId}`} className="text-xs text-gray-400 hover:text-gray-600">
          ← Volver al sprint
        </a>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Mini-retro</p>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">{sprintLabel}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Sesión de <span className="font-semibold text-gray-700">{personLabel}</span> ·{' '}
              {tasks.length} tareas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <p className="text-xs text-blue-700">
          El estado de cada tarea está pre-cargado desde tu tracking semanal. Ajusta si es necesario y agrega efectividad y notas.
        </p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <MiniRetroCard key={task.id} task={task} sprintId={sprintId} person={person} />
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          onClick={handleClose}
          disabled={closing}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {closing ? 'Guardando...' : 'Guardar mini-retro ✓'}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Una vez guardada, no podrás editar esta sección.
        </p>
      </div>
    </div>
  )
}
