import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'
import { redirect } from 'next/navigation'
import { StreakBadge } from '@/components/dashboard/StreakBadge'
import { LevelBadge } from '@/components/dashboard/LevelBadge'
import { STREAK_MILESTONES } from '@timeflow/types'
import { format, subDays, startOfDay } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { CheckCircle2, XCircle, Sun, Star, Zap, Target, TrendingUp, Leaf, Sprout } from 'lucide-react'

const MILESTONE_ICONS = [Sun, Star, Zap, Target, TrendingUp, Leaf]

export default async function StreakPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.user.findUnique({ where: { id: user.id } })
  if (!profile) redirect('/auth/login')

  const timezone = profile.timezone ?? 'Asia/Kolkata'
  const now = toZonedTime(new Date(), timezone)

  // Last 30 days of streak events
  const thirtyDaysAgo = startOfDay(subDays(now, 29))
  const events = await prisma.streakEvent.findMany({
    where: { userId: user.id, date: { gte: thirtyDaysAgo } },
    orderBy: { date: 'asc' },
  })

  const eventMap = new Map(events.map((e) => [format(e.date, 'yyyy-MM-dd'), e.event]))

  // Build 30-day calendar
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i)
    const key = format(d, 'yyyy-MM-dd')
    return { date: d, key, event: eventMap.get(key) ?? null }
  })

  const longestStreak = await prisma.streakEvent.groupBy({
    by: ['userId'],
    _max: { streakCountAt: true },
    where: { userId: user.id, event: { in: ['earned', 'maintained'] } },
  })
  const maxStreak = longestStreak[0]?._max?.streakCountAt ?? profile.streakCount

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Streak & Level</h1>

      {/* Hero cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <StreakBadge count={profile.streakCount} className="justify-center mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{profile.streakCount}</p>
          <p className="text-xs text-gray-400 mt-1">Current streak</p>
        </div>
        <div className="card p-5 text-center">
          <div className="flex justify-center mb-2">
            <Sun className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{maxStreak}</p>
          <p className="text-xs text-gray-400 mt-1">Longest ever</p>
        </div>
      </div>

      {/* Level */}
      <div className="card p-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Today's level</p>
        <LevelBadge points={profile.levelToday} showProgress className="mb-3" />
        <p className="text-xs text-gray-400">Points reset at midnight. Earn points by completing strict tasks.</p>
      </div>

      {/* 30-day heatmap */}
      <div className="card p-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Last 30 days</p>
        <div className="grid grid-cols-10 gap-1.5">
          {days.map((day) => {
            const isToday = day.key === format(now, 'yyyy-MM-dd')
            const isFuture = day.date > now
            const event = day.event

            let bg = 'bg-gray-100 dark:bg-gray-800'
            if (!isFuture && event === 'earned' || event === 'maintained') bg = 'bg-amber-400'
            else if (!isFuture && event === 'broken') bg = 'bg-red-300 dark:bg-red-800'
            else if (!isFuture && !event) bg = 'bg-gray-200 dark:bg-gray-700'

            return (
              <div
                key={day.key}
                title={`${format(day.date, 'MMM d')}${event ? ` — ${event}` : ''}`}
                className={`h-6 rounded-md ${bg} ${isToday ? 'ring-2 ring-brand-400 ring-offset-1' : ''}`}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Maintained</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 inline-block" /> Broken</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> No strict tasks</span>
        </div>
      </div>

      {/* Milestones */}
      <div className="card p-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Milestones</p>
        <div className="space-y-2">
          {STREAK_MILESTONES.map((milestone, i) => {
            const Icon = MILESTONE_ICONS[i] ?? Sun
            const reached = profile.streakCount >= milestone || maxStreak >= milestone
            return (
              <div key={milestone} className={`flex items-center gap-3 p-3 rounded-xl ${reached ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <Icon className={`w-5 h-5 ${reached ? 'text-amber-500' : 'text-gray-300'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${reached ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {milestone} day streak
                  </p>
                </div>
                {reached
                  ? <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  : <span className="text-xs text-gray-400">{milestone - profile.streakCount} more</span>
                }
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
