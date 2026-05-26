import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const sprint = await prisma.sprint.findUnique({ where: { id: params.id } })
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  if (sprint.status !== 'UPCOMING') {
    return NextResponse.json({ error: 'Sprint is not UPCOMING' }, { status: 400 })
  }

  const activeExists = await prisma.sprint.findFirst({
    where: { cycleId: sprint.cycleId, status: 'ACTIVE' },
  })
  if (activeExists) {
    return NextResponse.json({ error: 'Another sprint is already ACTIVE' }, { status: 409 })
  }

  const updated = await prisma.sprint.update({
    where: { id: params.id },
    data: { status: 'ACTIVE', startedAt: new Date() },
  })
  return NextResponse.json(updated)
}
