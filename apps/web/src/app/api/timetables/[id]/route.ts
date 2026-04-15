import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'

// GET /api/timetables/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

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

  if (!timetable) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ timetable })
}

// PATCH /api/timetables/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // If activating this timetable, deactivate all others first
  if (body.isActive === true) {
    await prisma.timetable.updateMany({
      where: { userId: user.id, id: { not: id } },
      data: { isActive: false },
    })
  }

  const allowed = ['name', 'repeatDays', 'validFrom', 'validUntil', 'isActive']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) {
      if (key === 'validFrom' || key === 'validUntil') {
        updates[key] = body[key] ? new Date(body[key]) : null
      } else {
        updates[key] = body[key]
      }
    }
  }

  const timetable = await prisma.timetable.updateMany({
    where: { id, userId: user.id },
    data: updates,
  })

  return NextResponse.json({ timetable })
}

// DELETE /api/timetables/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.timetable.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ success: true })
}
