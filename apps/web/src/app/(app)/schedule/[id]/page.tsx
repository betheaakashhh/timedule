import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'
import { redirect, notFound } from 'next/navigation'
import { TimetableEditClient } from './TimetableEditClient'

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const timetable = await prisma.timetable.findFirst({
    where: { id, userId: user.id },
    include: {
      intervals: {
        include: {
          tag: true,
          checklistItems: { orderBy: { sortOrder: 'asc' } },
          academicPeriods: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!timetable) notFound()

  const tags = await prisma.intervalTag.findMany({
    where: { OR: [{ isSystem: true }, { userId: user.id }] },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
  })

  return (
    <TimetableEditClient
      initialTimetable={JSON.parse(JSON.stringify(timetable))}
      availableTags={JSON.parse(JSON.stringify(tags))}
    />
  )
}
