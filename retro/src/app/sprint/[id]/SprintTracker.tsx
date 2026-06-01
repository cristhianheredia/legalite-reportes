'use client'

import { useState, useCallback } from 'react'
import { WEIGHT_LABELS } from '@/lib/constants'

type Task = {
  id: string
  title: string
  description: string
  weight: 'HIGH' | 'MEDIUM' | 'LOW'
  liveStatus: 'PENDING' | 'DONE'
}

type Sprint = {
  id: string
  cycleId: string
  status: 'UPCOMING' | 'ACTIVE' | 'GRACE' | 'CLOSED'
  graceEndsAt: string | null
}

type Props = {
  sprint: Sprint
  tasks: Task[]
  person: string
  personLabel: string
  sprintLabel: string
}

export default function SprintTracker({ sprint, tasks, person, personLabel, sprintLabel }: Props) {
  const [statuses, setStatuses] = useState<Map<string, 'PENDING' | 'DONE'>>(
    () => new Map(tasks.map((t) => [t.id, t.liveStatus])),
  )

  const done = Array.from(statuses.values()).filter((s) => s === 'DONE').length
  const total = tasks.length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  const readonly = sprint.status === 'CLOSED'

  const graceEnd = sprint.graceEndsAt ? new Date(sprint.graceEndsAt) : null
  const graceHoursLeft = graceEnd
    ? Math.max(0, Math.round((graceEnd.getTime() - Date.now()) / (1000 * 60 * 60)))
    : null

  function handleToggle(taskId: string, newStatus: 'PENDING' | 'DONE') {
    setStatuses((prev) => {
      const next = new Map(prev)
      next.set(taskId, newStatus)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <a href={`/retro/${sprint.cycleId}`} className="text-xs text-gray-400 hover:text-gray-600">
          ← Volver al ciclo
        </a>
        <div className="flex items-start justify-between mt-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{sprintLabel}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">
              Sesión de {personLabel}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {done}<span className="text-sm font-normal text-gray-400">/{total}</span>
            </p>
            <p className="text-xs text-gray-400">completadas</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${pct === 100 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Grace banner */}
      {sprint.status === 'GRACE' && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-amber-500 text-lg">⏳</span>
          <p className="text-sm text-amber-800 font-medium">
            Periodo de gracia activo · Cierra en ~{graceHoursLeft}h. Marca tus últimas tareas.
          </p>
        </div>
      )}

      {/* Closed banner */}
      {sprint.status === 'CLOSED' && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600 font-medium">
            Sprint cerrado. Vista de solo lectura.
          </p>
          <a
            href={`/sprint/${sprint.id}/retro?person=${person}`}
            className="shrink-0 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors"
          >
            Ir a mini-retro →
          </a>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No tienes tareas asignadas en esta semana.
          </p>
        ) : (
          tasks.map((task) => (
            <TaskToggleControlled
              key={task.id}
              task={task}
              sprintId={sprint.id}
              person={person}
              readonly={readonly}
              onToggle={(newStatus) => handleToggle(task.id, newStatus)}
            />
          ))
        )}
      </div>

      {pct === 100 && !readonly && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
          <p className="text-sm text-green-800 font-medium">
            ¡Todas las tareas completadas! Espera al cierre del sprint para la mini-retro.
          </p>
        </div>
      )}
    </div>
  )
}

function TaskToggleControlled({
  task,
  sprintId,
  person,
  readonly,
  onToggle,
}: {
  task: Task
  sprintId: string
  person: string
  readonly: boolean
  onToggle: (newStatus: 'PENDING' | 'DONE') => void
}) {
  const [liveStatus, setLiveStatus] = useState<'PENDING' | 'DONE'>(task.liveStatus)
  const [saving, setSaving] = useState(false)

  const toggle = useCallback(async () => {
    if (readonly || saving) return
    const next = liveStatus === 'DONE' ? 'PENDING' : 'DONE'
    setSaving(true)
    setLiveStatus(next)
    onToggle(next)
    try {
      await fetch(`/api/sprints/${sprintId}/live`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, person, liveStatus: next }),
      })
    } finally {
      setSaving(false)
    }
  }, [liveStatus, saving, sprintId, task.id, person, readonly, onToggle])

  const weightColor =
    task.weight === 'HIGH'
      ? 'text-red-600 bg-red-50'
      : task.weight === 'MEDIUM'
        ? 'text-amber-600 bg-amber-50'
        : 'text-gray-500 bg-gray-100'

  return (
    <button
      onClick={toggle}
      disabled={readonly || saving}
      className={`w-full text-left flex items-center gap-3 p-4 rounded-lg border-2 transition-all
        ${liveStatus === 'DONE'
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
        ${readonly ? 'cursor-default opacity-75' : 'cursor-pointer active:scale-[0.99]'}
      `}
    >
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
          ${liveStatus === 'DONE' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
      >
        {liveStatus === 'DONE' && <span className="text-white text-xs font-bold">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            liveStatus === 'DONE' ? 'text-green-800 line-through opacity-70' : 'text-gray-900'
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
        )}
      </div>
      <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${weightColor}`}>
        {WEIGHT_LABELS[task.weight]}
      </span>
      {saving && <span className="text-xs text-amber-500 shrink-0">●</span>}
    </button>
  )
}
