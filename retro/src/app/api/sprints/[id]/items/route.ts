import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { taskId, person, status, effectiveness, note } = await req.json()

  const sprint = await prisma.sprint.findUnique({ where: { id: params.id } })
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  if (sprint.status !== 'CLOSED') {
    return NextResponse.json({ error: 'Mini-retro is only available after sprint is closed' }, { status: 400 })
  }

  // Block saves if sprint mini-retro session already completed
  const session = await prisma.sprintSession.findUnique({
    where: { sprintId_person: { sprintId: params.id, person } },
  })
  if (session) {
    return NextResponse.json({ error: 'Sprint session already completed' }, { status: 403 })
  }

  const effectivenessValue = status === 'DONE' ? (effectiveness ?? null) : null

  const item = await prisma.retroItem.upsert({
    where: { retroId_taskId_person: { retroId: sprint.cycleId, taskId, person } },
    update: { status, effectiveness: effectivenessValue, note: note ?? null },
    create: {
      retroId: sprint.cycleId,
      taskId,
      person,
      status,
      effectiveness: effectivenessValue,
      note: note ?? null,
    },
  })
  return NextResponse.json(item)
}
