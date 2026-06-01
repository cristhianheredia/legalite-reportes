import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sessions = await prisma.sprintSession.findMany({
    where: { sprintId: params.id },
  })
  return NextResponse.json(sessions)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { person } = await req.json()

  const existing = await prisma.sprintSession.findUnique({
    where: { sprintId_person: { sprintId: params.id, person } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Sprint session already completed' }, { status: 409 })
  }

  const session = await prisma.sprintSession.create({
    data: { sprintId: params.id, person },
  })
  return NextResponse.json(session, { status: 201 })
}
