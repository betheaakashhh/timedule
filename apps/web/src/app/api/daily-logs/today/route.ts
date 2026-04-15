import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'
import { toZonedTime } from 'date-fns-tz'
import { startOfDay } from 'date-fns'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.user.findUnique({ where: { id: user.id } })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const timezone = profile.timezone ?? 'Asia/Kolkata'
  const now = toZonedTime(new Date(), timezone)
  const today = startOfDay(now)
  const dayOfWeek = now.getDay()

  // Get active timetable for today
  const timetable = await prisma.timetable.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      repeatDays: { has: dayOfWeek },
    },
    include: {
      intervals: {
        include: {
          tag: true,
          checklistItems: { orderBy: { sortOrder: 'asc' } },
          academicPeriods: {
            where: { dayOfWeek },
            orderBy: { periodStart: 'asc' },
          },
        },
        orderBy: { startTime: 'asc' },
      },
    },
  })

  if (!timetable) {
    return NextResponse.json({ timetable: null, logs: [], user: profile })
  }

  // Get or create daily logs for each interval
  const logs = await Promise.all(
    timetable.intervals.map(async (interval) => {
      const existing = await prisma.dailyLog.findUnique({
        where: {
          userId_intervalId_date: {
            userId: user.id,
            intervalId: interval.id,
            date: today,
          },
        },
        include: {
          checklistLogs: true,
          mealLog: true,
        },
      })

      if (existing) return { ...existing, interval }

      // Determine initial status from time
      const nowMins = now.getHours() * 60 + now.getMinutes()
      const [sh, sm] = interval.startTime.split(':').map(Number)
      const [eh, em] = interval.endTime.split(':').map(Number)
      const startMins = sh * 60 + sm
      const endMins = eh * 60 + em

      let status: 'pending' | 'active' | 'completed' | 'skipped' = 'pending'
      if (nowMins >= startMins && nowMins < endMins) status = 'active'
      else if (nowMins >= endMins && interval.autoComplete) status = 'completed'

      const created = await prisma.dailyLog.create({
        data: {
          userId: user.id,
          intervalId: interval.id,
          date: today,
          status,
          countsForStreak: !interval.autoComplete,
          countsForLevel: !interval.autoComplete,
        },
        include: { checklistLogs: true, mealLog: true },
      })

      // Create checklist log entries for each checklist item
      if (interval.checklistItems.length > 0) {
        await prisma.checklistLog.createMany({
          data: interval.checklistItems.map((item) => ({
            checklistItemId: item.id,
            dailyLogId: created.id,
            date: today,
            checked: false,
          })),
          skipDuplicates: true,
        })
      }

      return { ...created, interval }
    })
  )

  return NextResponse.json({
    timetable,
    logs,
    user: profile,
    todayDate: today.toISOString(),
    timezone,
  })
}
