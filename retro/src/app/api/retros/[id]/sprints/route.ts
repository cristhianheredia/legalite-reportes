import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sprints = await prisma.sprint.findMany({
    where: { cycleId: params.id },
    include: { sessions: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(sprints)
}
