'use client'

import { useState } from 'react'
import { Calendar, Flame, ChevronDown, ChevronUp } from 'lucide-react'
import { SwipeableIntervalCard } from './SwipeableIntervalCard'
import { ActiveIntervalCard } from '@/components/dashboard/ActiveIntervalCard'
import { StreakBadge } from '@/components/dashboard/StreakBadge'
import { LevelBadge } from '@/components/dashboard/LevelBadge'
import { WakeUpCard } from '@/components/dashboard/WakeUpCard'
import { AcademicBanner } from '@/components/dashboard/AcademicBanner'
import { cn, formatTimeDisplay } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import type { DailyLog, SocketIntervalTick, IntervalStatus, AcademicPeriod, MealType } from '@timeflow/types'

function TagIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Circle
  return <Icon className="w-3.5 h-3.5" />
}

const STATUS_DOT: Record<IntervalStatus, string> = {
  pending:   'bg-gray-200 dark:bg-gray-700',
  active:    'bg-brand-400 animate-pulse',
  grace:     'bg-amber-400 animate-pulse',
  completed: 'bg-teal-400',
  skipped:   'bg-gray-300 dark:bg-gray-600',
  blocked:   'bg-red-400',
}

interface MobileDashboardProps {
  profile: any
  logs: any[]
  ticks: Record<string, SocketIntervalTick>
  activeLog: any
  streakCount: number
  levelPoints: number
  showWakeUp: boolean
  timezone: string
  academicCurrent: AcademicPeriod | null
  academicNext: AcademicPeriod | null
  onComplete: (logId: string) => Promise<void>
  onSkip: (logId: string) => Promise<void>
  onOpenMeal: () => void
  onOpenChecklist: () => void
}

export function MobileDashboard({
  profile, logs, ticks, activeLog, streakCount, levelPoints,
  showWakeUp, timezone, academicCurrent, academicNext,
  onComplete, onSkip, onOpenMeal, onOpenChecklist,
}: MobileDashboardProps) {
  const [showFullTimeline, setShowFullTimeline] = useState(false)

  const sorted = [...logs].sort((a, b) =>
    a.interval?.startTime?.localeCompare(b.interval?.startTime ?? '') ?? 0
  )

  const statsCompleted = logs.filter((l) => l.status === 'completed' && l.countsForLevel).length
  const statsTotal     = logs.filter((l) => l.countsForLevel).length
  const progressPct    = statsTotal > 0 ? Math.round((statsCompleted / statsTotal) * 100) : 0

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* ── Header strip ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
          </p>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StreakBadge count={streakCount} />
        </div>
      </div>

      {/* ── Progress pill ── */}
      {statsTotal > 0 && (
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-gray-500">Today's progress</span>
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {statsCompleted}/{statsTotal}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <LevelBadge points={levelPoints} />
        </div>
      )}

      {/* ── Wake up ── */}
      {showWakeUp && (
        <WakeUpCard
          name={profile.name?.split(' ')[0] ?? 'there'}
          wakeTime={profile.wakeTime}
        />
      )}

      {/* ── Academic banner ── */}
      {(academicCurrent || academicNext) && (
        <AcademicBanner current={academicCurrent} next={academicNext} />
      )}

      {/* ── Active interval (swipeable on mobile) ── */}
      {activeLog && (
        <SwipeableIntervalCard
          onSwipeRight={() => {
            if (activeLog.interval?.tag?.requiresLog) { onOpenMeal(); return }
            onComplete(activeLog.id)
          }}
          onSwipeLeft={() => onSkip(activeLog.id)}
          disabled={activeLog.status === 'completed' || activeLog.status === 'skipped'}
        >
          <ActiveIntervalCard
            log={activeLog}
            tick={ticks[activeLog.interval?.id] ?? null}
            onComplete={onComplete}
            onSkip={onSkip}
            onOpenMeal={onOpenMeal}
            onOpenChecklist={onOpenChecklist}
          />
        </SwipeableIntervalCard>
      )}

      {/* ── Swipe hint (first time) ── */}
      {activeLog && activeLog.status === 'active' && (
        <SwipeHint />
      )}

      {/* ── No schedule ── */}
      {logs.length === 0 && (
        <div className="card p-8 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No schedule today</p>
          <p className="text-xs text-gray-400 mb-4">Create a schedule and activate it to start tracking.</p>
          <a href="/schedule/build" className="btn-primary text-sm inline-flex items-center gap-1.5">
            Build schedule
          </a>
        </div>
      )}

      {/* ── Timeline (compact + expandable) ── */}
      {sorted.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Today</p>
            <button
              onClick={() => setShowFullTimeline(!showFullTimeline)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              {showFullTimeline ? 'Show less' : `All ${sorted.length}`}
              {showFullTimeline
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </button>
          </div>

          <div>
            {(showFullTimeline ? sorted : sorted.slice(0, 4)).map((log, idx, arr) => {
              const interval = log.interval
              const tag      = interval?.tag
              const color    = tag?.color ?? '#7F77DD'
              const status   = log.status as IntervalStatus
              const isLast   = idx === arr.length - 1

              return (
                <div key={log.id} className="flex items-stretch">
                  {/* Spine */}
                  <div className="flex flex-col items-center pl-4 pt-3 w-8 flex-shrink-0">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[status])} />
                    {!isLast && <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 mt-1" />}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    'flex-1 px-3 py-3',
                    !isLast && 'border-b border-gray-50 dark:border-gray-800'
                  )}>
                    <div className="flex items-center gap-1.5">
                      {tag && (
                        <span style={{ color }} className="flex-shrink-0">
                          <TagIcon name={tag.icon} />
                        </span>
                      )}
                      <p className={cn(
                        'text-sm font-medium flex-1 min-w-0 truncate',
                        (status === 'completed' || status === 'skipped')
                          ? 'text-gray-400 line-through'
                          : 'text-gray-800 dark:text-gray-200'
                      )}>
                        {interval?.label || tag?.name}
                      </p>
                      <p className="text-xs text-gray-400 flex-shrink-0 ml-auto">
                        {interval?.startTime && formatTimeDisplay(interval.startTime)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

            {!showFullTimeline && sorted.length > 4 && (
              <button
                onClick={() => setShowFullTimeline(true)}
                className="w-full py-2.5 text-xs text-brand-600 dark:text-brand-400 font-medium text-center hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                Show {sorted.length - 4} more intervals
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SwipeHint() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem('swipe-hint-seen')
  })

  if (!visible) return null

  return (
    <div
      className="flex items-center justify-center gap-6 py-2 text-xs text-gray-400 animate-fade-in"
      onClick={() => {
        localStorage.setItem('swipe-hint-seen', '1')
        setVisible(false)
      }}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-teal-400">←</span> swipe right to complete
      </span>
      <span className="w-px h-3 bg-gray-200" />
      <span className="flex items-center gap-1.5">
        swipe left to skip <span className="text-gray-400">→</span>
      </span>
    </div>
  )
}
