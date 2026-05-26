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
  const { name, cycleDate, withSprints } = await req.json()

  const template = await prisma.cycleTemplate.findFirst({ orderBy: { version: 'desc' } })
  if (!template) return NextResponse.json({ error: 'No template found' }, { status: 404 })

  const retro = await prisma.retro.create({
    data: { name, cycleDate: new Date(cycleDate), templateId: template.id },
  })

  if (withSprints) {
    await prisma.sprint.createMany({
      data: PHASE_ORDER.map((phase) => ({ cycleId: retro.id, phase })),
    })
  }

  return NextResponse.json(retro, { status: 201 })
}
