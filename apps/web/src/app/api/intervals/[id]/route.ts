import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'

// PATCH /api/intervals/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Verify ownership via timetable
  const existing = await prisma.interval.findFirst({
    where: { id, timetable: { userId: user.id } },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const allowed = [
    'tagId', 'startTime', 'endTime', 'label', 'isStrict',
    'strictMode', 'graceMinutes', 'autoComplete',
    'requiresUserAction', 'emailRemind', 'sortOrder',
  ]
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const interval = await prisma.interval.update({
    where: { id },
    data: updates,
    include: { tag: true, checklistItems: { orderBy: { sortOrder: 'asc' } } },
  })

  return NextResponse.json({ interval })
}

// DELETE /api/intervals/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.interval.findFirst({
    where: { id, timetable: { userId: user.id } },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.interval.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
