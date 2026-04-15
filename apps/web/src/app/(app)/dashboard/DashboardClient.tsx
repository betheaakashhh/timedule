'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { useSocket } from '@/lib/hooks/useSocket'
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh'
import { useOfflineQueue } from '@/lib/hooks/useOfflineQueue'
import { useUserStore } from '@/lib/stores/user.store'
import { ActiveIntervalCard } from '@/components/dashboard/ActiveIntervalCard'
import { TodayTimeline } from '@/components/dashboard/TodayTimeline'
import { StreakBadge } from '@/components/dashboard/StreakBadge'
import { LevelBadge } from '@/components/dashboard/LevelBadge'
import { WakeUpCard } from '@/components/dashboard/WakeUpCard'
import { AcademicBanner } from '@/components/dashboard/AcademicBanner'
import { MobileDashboard } from '@/components/mobile/MobileDashboard'
import { ChecklistModal } from '@/components/modals/ChecklistModal'
import { MealLogModal } from '@/components/modals/MealLogModal'
import { StrictWarningModal } from '@/components/modals/StrictWarningModal'
import { getGreeting } from '@/lib/utils'
import { pointsToLevel } from '@timeflow/types'
import type { DailyLog, SocketIntervalTick, AcademicPeriod, MealType, StrictMode } from '@timeflow/types'
import toast from 'react-hot-toast'

interface Props {
  initialProfile: any
  initialLogs: any[]
  timetable: any
  showWakeUp: boolean
  timezone: string
}

export function DashboardClient({ initialProfile, initialLogs, timetable, showWakeUp, timezone }: Props) {
  const { user } = useUserStore()
  useSocket(initialProfile.id)
  const { fetchOrQueue } = useOfflineQueue()

  const [logs, setLogs] = useState<any[]>(initialLogs)
  const [ticks, setTicks] = useState<Record<string, SocketIntervalTick>>({})
  const [streakCount, setStreakCount] = useState<number>(initialProfile.streakCount ?? 0)
  const [levelPoints, setLevelPoints] = useState<number>(initialProfile.levelToday ?? 0)
  const [isMobile, setIsMobile] = useState(false)

  const [academicCurrent, setAcademicCurrent] = useState<AcademicPeriod | null>(null)
  const [academicNext, setAcademicNext] = useState<AcademicPeriod | null>(null)

  const [checklistModal, setChecklistModal] = useState<{ logId: string } | null>(null)
  const [mealModal, setMealModal] = useState<{ logId: string; mealType: MealType } | null>(null)
  const [strictModal, setStrictModal] = useState<{
    logId: string; mode: StrictMode; label: string; minutesLeft: number
  } | null>(null)

  const activeLog = logs.find((l) => l.status === 'active' || l.status === 'grace') ?? null

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Socket listeners
  useEffect(() => {
    const onTick = (e: CustomEvent<SocketIntervalTick>) => {
      const tick = e.detail
      setTicks((prev) => ({ ...prev, [tick.intervalId]: tick }))
      setLogs((prev) => prev.map((log) => {
        if (log.interval?.id === tick.intervalId) {
          if (log.status === 'completed' || log.status === 'skipped') return log
          return { ...log, status: tick.status }
        }
        return log
      }))
    }
    const onStreak = (e: CustomEvent) => setStreakCount(e.detail.streakCount)
    const onLevel  = (e: CustomEvent) => setLevelPoints(e.detail.points)

    window.addEventListener('socket:interval:tick', onTick as any)
    window.addEventListener('socket:streak:update', onStreak as any)
    window.addEventListener('socket:level:update', onLevel as any)
    return () => {
      window.removeEventListener('socket:interval:tick', onTick as any)
      window.removeEventListener('socket:streak:update', onStreak as any)
      window.removeEventListener('socket:level:update', onLevel as any)
    }
  }, [])

  // Refresh logs
  const refreshLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/daily-logs/today')
      const data = await res.json()
      if (data.logs) setLogs(data.logs)
    } catch {}
  }, [])

  // Pull to refresh
  const { indicatorRef } = usePullToRefresh({ onRefresh: refreshLogs })

  // Fallback poll every 60s
  useEffect(() => {
    const t = setInterval(refreshLogs, 60_000)
    return () => clearInterval(t)
  }, [refreshLogs])

  // Academic period tracking
  useEffect(() => {
    function checkAcademic() {
      if (!timetable) return
      const now = new Date()
      const nowMins = now.getHours() * 60 + now.getMinutes()
      for (const interval of timetable.intervals ?? []) {
        if (!interval.academicPeriods?.length) continue
        let current: AcademicPeriod | null = null
        let next: AcademicPeriod | null = null
        for (const p of interval.academicPeriods as AcademicPeriod[]) {
          const [sh, sm] = p.periodStart.split(':').map(Number)
          const [eh, em] = p.periodEnd.split(':').map(Number)
          const startMins = sh * 60 + sm
          const endMins   = eh * 60 + em
          if (nowMins >= startMins && nowMins < endMins) current = p
          else if (nowMins < startMins && !next) next = p
        }
        setAcademicCurrent(current)
        setAcademicNext(next)
        break
      }
    }
    checkAcademic()
    const t = setInterval(checkAcademic, 60_000)
    return () => clearInterval(t)
  }, [timetable])

  async function handleComplete(logId: string) {
    const { ok, queued } = await fetchOrQueue('/api/daily-logs', 'PATCH', { logId, status: 'completed' })
    if (!ok) { toast.error('Failed to complete'); return }
    setLogs((prev) => prev.map((l) => l.id === logId ? { ...l, status: 'completed', completedAt: new Date().toISOString() } : l))
    toast.success(queued ? 'Completed (will sync when online)' : 'Task completed! 🎉')
    const log = logs.find((l) => l.id === logId)
    setLevelPoints((p) => p + (log?.interval?.isStrict ? 10 : 5))
  }

  async function handleSkip(logId: string) {
    const log = logs.find((l) => l.id === logId)
    if (!log) return
    if (log.interval?.isStrict) {
      const tick = ticks[log.interval.id]
      setStrictModal({
        logId,
        mode: log.interval.strictMode as StrictMode,
        label: log.interval.label || log.interval.tag?.name || '',
        minutesLeft: Math.ceil((tick?.graceSecondsRemaining ?? 0) / 60),
      })
      return
    }
    await doSkip(logId)
  }

  async function doSkip(logId: string) {
    const { ok } = await fetchOrQueue('/api/daily-logs', 'PATCH', { logId, status: 'skipped' })
    if (!ok) { toast.error('Failed to skip'); return }
    setLogs((prev) => prev.map((l) => l.id === logId ? { ...l, status: 'skipped', skippedAt: new Date().toISOString() } : l))
    toast('Skipped', { icon: '⏭' })
    setLevelPoints((p) => Math.max(0, p - 10))
  }

  async function handleChecklistToggle(checklistLogId: string, checked: boolean) {
    const res = await fetch('/api/checklist/toggle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistLogId, checked }),
    })
    if (!res.ok) throw new Error('Failed')
    setLogs((prev) => prev.map((log) => ({
      ...log,
      checklistLogs: log.checklistLogs?.map((cl: any) =>
        cl.id === checklistLogId ? { ...cl, checked, checkedAt: checked ? new Date().toISOString() : null } : cl
      ),
    })))
  }

  async function handleMealSubmit(logId: string, items: string[], mealType: MealType) {
    const res = await fetch('/api/meal-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, items, mealType }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error)
    }
    setLogs((prev) => prev.map((l) => l.id === logId ? { ...l, status: 'completed', completedAt: new Date().toISOString() } : l))
    toast.success('Meal logged! ✅')
  }

  function openMeal() {
    if (!activeLog) return
    const tagName = (activeLog.interval?.tag?.name ?? '').toLowerCase()
    setMealModal({
      logId: activeLog.id,
      mealType: tagName.includes('breakfast') ? 'breakfast'
              : tagName.includes('lunch')     ? 'lunch'
              : tagName.includes('dinner')    ? 'dinner'
              : 'snack',
    })
  }

  const checklistLog = logs.find((l) => l.id === checklistModal?.logId)
  const mealLogEntry = logs.find((l) => l.id === mealModal?.logId)
  const statsCompleted = logs.filter((l) => l.status === 'completed' && l.countsForLevel).length
  const statsTotal     = logs.filter((l) => l.countsForLevel).length

  // Pull-to-refresh indicator
  const PTR = (
    <div
      ref={indicatorRef}
      className="fixed top-16 md:top-4 left-1/2 -translate-x-1/2 w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center shadow-lg z-50 opacity-0 pointer-events-none transition-opacity"
    >
      <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  )

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {PTR}
        <MobileDashboard
          profile={initialProfile}
          logs={logs}
          ticks={ticks}
          activeLog={activeLog}
          streakCount={streakCount}
          levelPoints={levelPoints}
          showWakeUp={showWakeUp}
          timezone={timezone}
          academicCurrent={academicCurrent}
          academicNext={academicNext}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onOpenMeal={openMeal}
          onOpenChecklist={() => activeLog && setChecklistModal({ logId: activeLog.id })}
        />
        <Modals />
      </>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <>
      {PTR}
      <div className="space-y-4 animate-fade-in pb-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getGreeting((user?.name ?? initialProfile.name)?.split(' ')[0] ?? 'there', timezone)}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StreakBadge count={streakCount} />
            <LevelBadge points={levelPoints} />
          </div>
        </div>

        {showWakeUp && (
          <WakeUpCard name={(user?.name ?? initialProfile.name)?.split(' ')[0] ?? 'there'} wakeTime={initialProfile.wakeTime} />
        )}

        {(academicCurrent || academicNext) && (
          <AcademicBanner current={academicCurrent} next={academicNext} />
        )}

        {!timetable && (
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No active schedule</h2>
            <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">Create and activate a schedule to start tracking your day in real time.</p>
            <Link href="/schedule/build" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Build schedule
            </Link>
          </div>
        )}

        {activeLog && (
          <ActiveIntervalCard
            log={activeLog}
            tick={ticks[activeLog.interval?.id] ?? null}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onOpenMeal={openMeal}
            onOpenChecklist={() => setChecklistModal({ logId: activeLog.id })}
          />
        )}

        {timetable && statsTotal > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Today's progress</p>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                {statsCompleted}/{statsTotal} done
              </p>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-700"
                style={{ width: `${statsTotal > 0 ? (statsCompleted / statsTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {timetable && (
          <TodayTimeline
            logs={logs}
            activeLogId={activeLog?.id ?? null}
            onSelectLog={(log) => toast(`${log.interval?.label || log.interval?.tag?.name} — ${log.status}`, { duration: 2000 })}
          />
        )}
      </div>
      <Modals />
    </>
  )

  function Modals() {
    return (
      <>
        {checklistLog && (
          <ChecklistModal
            open={!!checklistModal}
            onClose={() => setChecklistModal(null)}
            items={checklistLog.interval?.checklistItems ?? []}
            logs={checklistLog.checklistLogs ?? []}
            intervalLabel={checklistLog.interval?.label ?? ''}
            onToggle={handleChecklistToggle}
          />
        )}
        {mealLogEntry && (
          <MealLogModal
            open={!!mealModal}
            onClose={() => setMealModal(null)}
            logId={mealLogEntry.id}
            defaultMealType={mealModal?.mealType ?? 'breakfast'}
            onSubmit={handleMealSubmit}
          />
        )}
        {strictModal && (
          <StrictWarningModal
            open={!!strictModal}
            mode={strictModal.mode}
            intervalLabel={strictModal.label}
            minutesLeft={strictModal.minutesLeft}
            onContinue={() => setStrictModal(null)}
            onConfirmSkip={() => { doSkip(strictModal.logId); setStrictModal(null) }}
            onClose={() => setStrictModal(null)}
          />
        )}
      </>
    )
  }
}
