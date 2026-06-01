import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const templates = await prisma.cycleTemplate.findMany({
    orderBy: { version: 'desc' },
    include: {
      tasks: { where: { archived: false }, select: { phase: true, owners: true } },
    },
  })
  return NextResponse.json(templates)
}
