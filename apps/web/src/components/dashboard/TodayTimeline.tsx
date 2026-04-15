'use client'

import { CheckCircle2, Circle, Clock, Lock, AlertTriangle, Timer, SkipForward } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn, formatTimeDisplay } from '@/lib/utils'
import type { DailyLog, IntervalStatus, StrictMode } from '@timeflow/types'

function TagIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Circle
  return <Icon className="w-3.5 h-3.5" />
}

const STATUS_CONFIG: Record<IntervalStatus, { dotCls: string; labelCls: string; label: string }> = {
  pending:   { dotCls: 'bg-gray-200 dark:bg-gray-700', labelCls: 'text-gray-400',                          label: 'Upcoming' },
  active:    { dotCls: 'bg-brand-400 animate-pulse',   labelCls: 'text-brand-600 dark:text-brand-400',     label: 'In progress' },
  grace:     { dotCls: 'bg-amber-400 animate-pulse',   labelCls: 'text-amber-600 dark:text-amber-400',     label: 'Grace period' },
  completed: { dotCls: 'bg-teal-400',                  labelCls: 'text-teal-600 dark:text-teal-400',       label: 'Done' },
  skipped:   { dotCls: 'bg-gray-300 dark:bg-gray-600', labelCls: 'text-gray-400 dark:text-gray-500',       label: 'Skipped' },
  blocked:   { dotCls: 'bg-red-400',                   labelCls: 'text-red-500 dark:text-red-400',         label: 'Blocked' },
}

interface TodayTimelineProps {
  logs: (DailyLog & { interval: any })[]
  onSelectLog: (log: DailyLog & { interval: any }) => void
  activeLogId: string | null
}

export function TodayTimeline({ logs, onSelectLog, activeLogId }: TodayTimelineProps) {
  const sorted = [...logs].sort((a, b) =>
    a.interval.startTime.localeCompare(b.interval.startTime)
  )

  if (sorted.length === 0) {
    return (
      <div className="card p-6 text-center">
        <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No intervals scheduled for today</p>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Today's timeline
      </h3>

      <div className="space-y-0">
        {sorted.map((log, idx) => {
          const interval = log.interval
          const tag = interval.tag
          const color = tag?.color ?? '#7F77DD'
          const status = log.status as IntervalStatus
          const cfg = STATUS_CONFIG[status]
          const isActive = log.id === activeLogId
          const isLast = idx === sorted.length - 1

          return (
            <div key={log.id} className="flex gap-3 group">
              {/* Timeline spine */}
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                {/* Dot */}
                <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', cfg.dotCls)} />
                {/* Line */}
                {!isLast && <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 mt-1" />}
              </div>

              {/* Content */}
              <button
                onClick={() => onSelectLog(log)}
                className={cn(
                  'flex-1 pb-4 text-left rounded-xl px-3 py-2 -mx-3 transition-colors',
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {tag && (
                        <span style={{ color }} className="flex-shrink-0">
                          <TagIcon name={tag.icon} />
                        </span>
                      )}
                      <p className={cn(
                        'text-sm font-medium truncate',
                        status === 'completed' || status === 'skipped'
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      )}>
                        {interval.label || tag?.name}
                      </p>
                      {status === 'completed' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                      )}
                      {status === 'skipped' && (
                        <SkipForward className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">
                        {formatTimeDisplay(interval.startTime)} – {formatTimeDisplay(interval.endTime)}
                      </p>
                      {interval.isStrict && status !== 'completed' && status !== 'skipped' && (
                        <span className="text-xs text-amber-500">
                          {interval.strictMode === 'hard' ? '🔒' : '⚠'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status pill */}
                  <span className={cn('text-xs font-medium flex-shrink-0 mt-0.5', cfg.labelCls)}>
                    {cfg.label}
                  </span>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
