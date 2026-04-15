import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'

// GET /api/academic?intervalId=xxx  — list academic periods for an interval
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const intervalId = req.nextUrl.searchParams.get('intervalId')
  if (!intervalId) return NextResponse.json({ error: 'intervalId required' }, { status: 400 })

  const periods = await prisma.academicPeriod.findMany({
    where: { intervalId, interval: { timetable: { userId: user.id } } },
    orderBy: [{ dayOfWeek: 'asc' }, { periodStart: 'asc' }],
  })

  return NextResponse.json({ periods })
}

// POST /api/academic — create academic periods (from parser or manual)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { intervalId, periods } = await req.json()

  if (!intervalId || !Array.isArray(periods)) {
    return NextResponse.json({ error: 'intervalId and periods required' }, { status: 400 })
  }

  // Verify ownership
  const interval = await prisma.interval.findFirst({
    where: { id: intervalId, timetable: { userId: user.id } },
  })
  if (!interval) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Replace all periods for this interval
  await prisma.academicPeriod.deleteMany({ where: { intervalId } })

  const created = await prisma.academicPeriod.createMany({
    data: periods.map((p: any) => ({
      intervalId,
      subject: p.subject,
      room: p.room ?? '',
      teacher: p.teacher ?? '',
      dayOfWeek: p.dayOfWeek,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
    })),
  })

  return NextResponse.json({ count: created.count }, { status: 201 })
}

// DELETE /api/academic?periodId=xxx
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const periodId = req.nextUrl.searchParams.get('periodId')
  if (!periodId) return NextResponse.json({ error: 'periodId required' }, { status: 400 })

  await prisma.academicPeriod.deleteMany({
    where: { id: periodId, interval: { timetable: { userId: user.id } } },
  })

  return NextResponse.json({ success: true })
}
