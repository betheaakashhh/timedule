'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, SkipForward, Lock, AlertTriangle,
  Timer, Clock, ChevronDown, ChevronUp,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { CountdownRing } from './CountdownRing'
import { cn, formatCountdown, formatTimeDisplay } from '@/lib/utils'
import type { DailyLog, SocketIntervalTick, StrictMode } from '@timeflow/types'
import toast from 'react-hot-toast'

function TagIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Circle
  return <Icon className="w-5 h-5" />
}

interface ActiveIntervalCardProps {
  log: DailyLog & { interval: any }
  tick: SocketIntervalTick | null
  onComplete: (logId: string) => Promise<void>
  onSkip: (logId: string) => Promise<void>
  onOpenMeal: () => void
  onOpenChecklist: () => void
}

const STRICT_BADGE: Record<StrictMode, { label: string; icon: React.ReactNode; cls: string }> = {
  hard:  { label: 'Hard lock',    icon: <Lock className="w-3 h-3" />,          cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
  warn:  { label: 'Warn',         icon: <AlertTriangle className="w-3 h-3" />, cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  grace: { label: 'Grace period', icon: <Timer className="w-3 h-3" />,         cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
}

export function ActiveIntervalCard({
  log, tick, onComplete, onSkip, onOpenMeal, onOpenChecklist
}: ActiveIntervalCardProps) {
  const [completing, setCompleting] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [localSeconds, setLocalSeconds] = useState(tick?.secondsRemaining ?? 0)

  // Local countdown — ticks every second between socket updates
  useEffect(() => {
    if (tick) setLocalSeconds(tick.secondsRemaining)
  }, [tick])

  useEffect(() => {
    if (log.status !== 'active' && log.status !== 'grace') return
    const t = setInterval(() => setLocalSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [log.status])

  const interval = log.interval
  const tag = interval.tag
  const color = tag?.color ?? '#7F77DD'

  // Total duration in seconds
  const [sh, sm] = interval.startTime.split(':').map(Number)
  const [eh, em] = interval.endTime.split(':').map(Number)
  const totalSeconds = ((eh * 60 + em) - (sh * 60 + sm)) * 60

  const requiresMeal = tag?.requiresLog
  const hasChecklist = (interval.checklistItems?.length ?? 0) > 0

  async function handleComplete() {
    if (requiresMeal) { onOpenMeal(); return }
    setCompleting(true)
    try { await onComplete(log.id) }
    finally { setCompleting(false) }
  }

  async function handleSkip() {
    if (interval.isStrict && interval.strictMode === 'hard') {
      toast.error('This task is hard-locked — complete it before moving on.')
      return
    }
    setSkipping(true)
    try { await onSkip(log.id) }
    finally { setSkipping(false) }
  }

  const isGrace = log.status === 'grace' || tick?.status === 'grace'
  const graceLeft = tick?.graceSecondsRemaining ?? 0

  return (
    <div
      className="card overflow-hidden"
      style={{ borderTop: `4px solid ${color}` }}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Ring */}
          <div className="flex-shrink-0">
            <CountdownRing
              secondsRemaining={isGrace ? graceLeft : localSeconds}
              totalSeconds={isGrace ? (interval.graceMinutes ?? 15) * 60 : totalSeconds}
              size={88}
              strokeWidth={7}
              color={isGrace ? '#EF9F27' : color}
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 leading-none">
                  {formatCountdown(isGrace ? graceLeft : localSeconds)}
                </span>
                {isGrace && (
                  <span className="text-[9px] text-amber-500 font-medium mt-0.5 leading-none">grace</span>
                )}
              </div>
            </CountdownRing>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Tag chip */}
            {tag && (
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ color }} className="opacity-80">
                  <TagIcon name={tag.icon} />
                </span>
                <span className="text-xs font-medium text-gray-400">{tag.name}</span>
              </div>
            )}

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-snug">
              {interval.label || tag?.name}
            </h2>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {formatTimeDisplay(interval.startTime)} – {formatTimeDisplay(interval.endTime)}
              </span>
              {interval.isStrict && (
                <span className={cn(
                  'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                  STRICT_BADGE[interval.strictMode as StrictMode]?.cls
                )}>
                  {STRICT_BADGE[interval.strictMode as StrictMode]?.icon}
                  {STRICT_BADGE[interval.strictMode as StrictMode]?.label}
                </span>
              )}
              {isGrace && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium animate-pulse">
                  <Timer className="w-3 h-3" />
                  Grace: {formatCountdown(graceLeft)}
                </span>
              )}
            </div>

            {/* Checklist hint */}
            {hasChecklist && (
              <button
                onClick={onOpenChecklist}
                className="flex items-center gap-1.5 mt-2 text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {interval.checklistItems.length} checklist items
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {log.status !== 'completed' && log.status !== 'skipped' && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleComplete}
              disabled={completing}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              style={{ backgroundColor: color, borderColor: color }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {completing ? 'Marking...' : requiresMeal ? 'Log meal & complete' : 'Mark complete'}
            </button>

            {(!interval.isStrict || interval.strictMode !== 'hard') && (
              <button
                onClick={handleSkip}
                disabled={skipping}
                className="btn-secondary flex items-center gap-2 px-4"
              >
                <SkipForward className="w-4 h-4" />
                {skipping ? '...' : 'Skip'}
              </button>
            )}
          </div>
        )}

        {log.status === 'completed' && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">Completed</p>
          </div>
        )}
      </div>
    </div>
  )
}
