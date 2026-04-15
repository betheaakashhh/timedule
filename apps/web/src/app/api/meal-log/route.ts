import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { logId, items, mealType } = await req.json()

  if (!items?.length) {
    return NextResponse.json({ error: 'Add at least one food item' }, { status: 400 })
  }

  const log = await prisma.dailyLog.findFirst({
    where: { id: logId, userId: user.id },
    include: { interval: { include: { tag: true } } },
  })
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [mealLog] = await prisma.$transaction([
    prisma.mealLog.upsert({
      where: { dailyLogId: logId },
      create: { dailyLogId: logId, items, mealType },
      update: { items, mealType, loggedAt: new Date() },
    }),
    prisma.dailyLog.update({
      where: { id: logId },
      data: { status: 'completed', completedAt: new Date() },
    }),
  ])

  return NextResponse.json({ mealLog })
}
