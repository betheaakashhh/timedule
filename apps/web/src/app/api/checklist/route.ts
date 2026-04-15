import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'

// POST /api/checklist — add checklist item to interval
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { intervalId, label, isBlocking, sortOrder } = await req.json()

  // Verify ownership
  const interval = await prisma.interval.findFirst({
    where: { id: intervalId, timetable: { userId: user.id } },
  })
  if (!interval) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = await prisma.checklistItem.create({
    data: { intervalId, label: label.trim(), isBlocking: isBlocking ?? false, sortOrder: sortOrder ?? 0 },
  })

  return NextResponse.json({ item }, { status: 201 })
}

// DELETE /api/checklist?itemId=xxx
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const itemId = req.nextUrl.searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  await prisma.checklistItem.deleteMany({
    where: { id: itemId, interval: { timetable: { userId: user.id } } },
  })

  return NextResponse.json({ success: true })
}
