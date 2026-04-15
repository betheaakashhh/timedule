import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'
import { prisma } from '@timeflow/db'
import { toZonedTime } from 'date-fns-tz'
import { startOfDay } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.user.findUnique({ where: { id: user.id } })
  if (!profile) redirect('/auth/login')

  const timezone = profile.timezone ?? 'Asia/Kolkata'
  const now = toZonedTime(new Date(), timezone)
  const today = startOfDay(now)
  const dayOfWeek = now.getDay()
  const hour = now.getHours()

  // Show wake-up card only in the morning window (within 2 hours of wake time)
  const [wh] = profile.wakeTime.split(':').map(Number)
  const showWakeUp = hour >= wh && hour < wh + 2

  // Active timetable
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
          academicPeriods: { where: { dayOfWeek }, orderBy: { periodStart: 'asc' } },
        },
        orderBy: { startTime: 'asc' },
      },
    },
  })

  // Load or create daily logs
  let initialLogs: any[] = []
  if (timetable) {
    initialLogs = await Promise.all(
      timetable.intervals.map(async (interval) => {
        const nowMins = now.getHours() * 60 + now.getMinutes()
        const [sh, sm] = interval.startTime.split(':').map(Number)
        const [eh, em] = interval.endTime.split(':').map(Number)
        const startMins = sh * 60 + sm
        const endMins   = eh * 60 + em

        let status: 'pending' | 'active' | 'completed' | 'grace' = 'pending'
        if (nowMins >= startMins && nowMins < endMins) status = 'active'
        else if (nowMins >= endMins && interval.autoComplete) status = 'completed'
        else if (nowMins >= endMins && nowMins < endMins + (interval.graceMinutes ?? 15)) status = 'grace'

        try {
          const existing = await prisma.dailyLog.findUnique({
            where: { userId_intervalId_date: { userId: user.id, intervalId: interval.id, date: today } },
            include: { checklistLogs: true, mealLog: true },
          })
          if (existing) return { ...existing, interval }

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
            // Re-fetch with checklist logs
            const withChecklist = await prisma.dailyLog.findUnique({
              where: { id: created.id },
              include: { checklistLogs: true, mealLog: true },
            })
            return { ...withChecklist, interval }
          }

          return { ...created, interval }
        } catch {
          return null
        }
      })
    )
    initialLogs = initialLogs.filter(Boolean)
  }

  const serializedProfile = JSON.parse(JSON.stringify(profile))
  const serializedLogs = JSON.parse(JSON.stringify(initialLogs))
  const serializedTimetable = timetable ? JSON.parse(JSON.stringify(timetable)) : null

  return (
    <DashboardClient
      initialProfile={serializedProfile}
      initialLogs={serializedLogs}
      timetable={serializedTimetable}
      showWakeUp={showWakeUp}
      timezone={timezone}
    />
  )
}
