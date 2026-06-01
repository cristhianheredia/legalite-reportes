import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PHASE_ORDER } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  const retros = await prisma.retro.findMany({
    orderBy: { createdAt: 'desc' },
    include: { sessions: true, items: true },
  })
  return NextResponse.json(retros)
}

export async function POST(req: Request) {
  const { name, cycleDate, withSprints, templateId } = await req.json()

  const template = templateId
    ? await prisma.cycleTemplate.findUnique({ where: { id: templateId } })
    : await prisma.cycleTemplate.findFirst({ orderBy: { version: 'desc' } })
  if (!template) return NextResponse.json({ error: 'No template found' }, { status: 404 })

  const retro = await prisma.retro.create({
    data: { name, cycleDate: new Date(cycleDate), templateId: template.id },
  })

  if (withSprints) {
    // Only create sprints for phases that have tasks in this template
    const phasesWithTasks = await prisma.task.findMany({
      where: { templateId: template.id, archived: false },
      select: { phase: true },
      distinct: ['phase'],
    })
    const phases = PHASE_ORDER.filter((p) => phasesWithTasks.some((t) => t.phase === p))
    await prisma.sprint.createMany({
      data: phases.map((phase) => ({ cycleId: retro.id, phase })),
    })
  }

  return NextResponse.json(retro, { status: 201 })
}
