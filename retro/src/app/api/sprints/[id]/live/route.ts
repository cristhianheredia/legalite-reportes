import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { taskId, person, liveStatus } = await req.json()

  const sprint = await prisma.sprint.findUnique({ where: { id: params.id } })
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  if (sprint.status !== 'ACTIVE' && sprint.status !== 'GRACE') {
    return NextResponse.json({ error: 'Sprint is not editable' }, { status: 403 })
  }

  const item = await prisma.retroItem.upsert({
    where: { retroId_taskId_person: { retroId: sprint.cycleId, taskId, person } },
    update: { liveStatus },
    create: { retroId: sprint.cycleId, taskId, person, liveStatus },
  })
  return NextResponse.json(item)
}
