import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const person = searchParams.get('person')

  const sprint = await prisma.sprint.findUnique({
    where: { id: params.id },
    include: {
      cycle: {
        include: {
          template: {
            include: {
              tasks: {
                where: { archived: false, phase: undefined },
                orderBy: [{ phase: 'asc' }, { order: 'asc' }],
              },
            },
          },
          items: person
            ? { where: { person } }
            : true,
        },
      },
    },
  })

  if (!sprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })

  const allTasks = sprint.cycle.template.tasks.filter((t) => t.phase === sprint.phase)
  const tasks = person ? allTasks.filter((t) => t.owners.includes(person)) : allTasks

  const items = sprint.cycle.items as Array<{
    id: string; retroId: string; taskId: string; person: string;
    status: string | null; effectiveness: number | null; note: string | null;
    liveStatus: string | null; updatedAt: Date
  }>

  const tasksWithStatus = tasks.map((task) => {
    const item = items.find((i) => i.taskId === task.id && (!person || i.person === person))
    return { ...task, liveStatus: item?.liveStatus ?? 'PENDING' }
  })

  return NextResponse.json({ sprint, tasks: tasksWithStatus })
}
