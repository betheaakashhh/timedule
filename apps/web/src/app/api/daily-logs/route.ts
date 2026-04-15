import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'

// PATCH /api/daily-logs — update a log status (complete / skip)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { logId, status, notes } = body

  const log = await prisma.dailyLog.findFirst({
    where: { id: logId, userId: user.id },
    include: {
      interval: true,
      checklistLogs: { include: { checklistItem: true } },
    },
  })
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check blocking checklist items
  if (status === 'completed') {
    const blockingUnchecked = log.checklistLogs.filter(
      (cl) => cl.checklistItem.isBlocking && !cl.checked
    )
    if (blockingUnchecked.length > 0) {
      return NextResponse.json(
        {
          error: 'blocking_checklist',
          message: `Complete all required checklist items first: ${blockingUnchecked.map((c) => c.checklistItem.label).join(', ')}`,
        },
        { status: 422 }
      )
    }
  }

  // Hard-lock: cannot skip
  if (status === 'skipped' && log.interval.isStrict && log.interval.strictMode === 'hard') {
    return NextResponse.json(
      { error: 'hard_lock', message: 'This task is hard-locked — you must complete it.' },
      { status: 422 }
    )
  }

  const updated = await prisma.dailyLog.update({
    where: { id: logId },
    data: {
      status,
      notes: notes ?? undefined,
      completedAt: status === 'completed' ? new Date() : undefined,
      skippedAt: status === 'skipped' ? new Date() : undefined,
    },
    include: { checklistLogs: true, mealLog: true },
  })

  // Award / deduct points
  const profile = await prisma.user.findUnique({ where: { id: user.id } })
  if (profile && log.countsForLevel) {
    let delta = 0
    if (status === 'completed') delta = log.interval.isStrict ? 10 : 5
    if (status === 'skipped' && log.interval.isStrict) delta = -10

    if (delta !== 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { levelToday: { increment: delta } },
      })
    }
  }

  return NextResponse.json({ log: updated })
}
