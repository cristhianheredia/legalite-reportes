import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const sprint = await prisma.sprint.findUnique({ where: { id: params.id } })
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  if (sprint.status !== 'GRACE' && sprint.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Sprint must be ACTIVE or GRACE to close' }, { status: 400 })
  }

  const updated = await prisma.sprint.update({
    where: { id: params.id },
    data: { status: 'CLOSED', closedAt: new Date() },
  })
  return NextResponse.json(updated)
}
