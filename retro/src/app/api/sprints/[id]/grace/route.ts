import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const sprint = await prisma.sprint.findUnique({ where: { id: params.id } })
  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  if (sprint.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Sprint must be ACTIVE to enter grace period' }, { status: 400 })
  }

  const graceEndsAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const updated = await prisma.sprint.update({
    where: { id: params.id },
    data: { status: 'GRACE', graceEndsAt },
  })
  return NextResponse.json(updated)
}
