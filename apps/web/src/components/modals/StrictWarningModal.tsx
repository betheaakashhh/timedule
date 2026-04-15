'use client'

import { Lock, AlertTriangle, Timer, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StrictMode } from '@timeflow/types'

interface StrictWarningModalProps {
  open: boolean
  mode: StrictMode
  intervalLabel: string
  minutesLeft: number
  onConfirmSkip: () => void
  onContinue: () => void
  onClose: () => void
}

const CONFIG: Record<StrictMode, {
  icon: React.ReactNode
  title: string
  titleCls: string
  bodyColor: string
  borderColor: string
}> = {
  hard: {
    icon: <Lock className="w-6 h-6" />,
    title: 'Task hard-locked',
    titleCls: 'text-red-600 dark:text-red-400',
    bodyColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  warn: {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'Skipping will break your streak',
    titleCls: 'text-amber-600 dark:text-amber-400',
    bodyColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  grace: {
    icon: <Timer className="w-6 h-6" />,
    title: 'Grace period still running',
    titleCls: 'text-blue-600 dark:text-blue-400',
    bodyColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
}

export function StrictWarningModal({
  open, mode, intervalLabel, minutesLeft, onConfirmSkip, onContinue, onClose,
}: StrictWarningModalProps) {
  if (!open) return null

  const cfg = CONFIG[mode]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border animate-slide-up',
        cfg.borderColor
      )}>
        <div className={cn('p-5 rounded-t-2xl', cfg.bodyColor)}>
          <div className="flex items-center gap-3">
            <span className={cfg.titleCls}>{cfg.icon}</span>
            <div>
              <h3 className={cn('font-semibold', cfg.titleCls)}>{cfg.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{intervalLabel}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {mode === 'hard' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This interval is set to <strong>hard lock</strong>. You must complete it before moving to the next task.
              Next intervals are blocked until you mark this done.
            </p>
          )}
          {mode === 'warn' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Skipping this task will <strong>break your streak</strong> and deduct points.
              Are you sure you want to skip?
            </p>
          )}
          {mode === 'grace' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You still have <strong>{minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}</strong> in the grace period.
              Completing now will preserve your streak.
            </p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          {mode === 'hard' ? (
            <button onClick={onContinue} className="btn-primary flex-1">Got it — I'll complete it</button>
          ) : (
            <>
              <button onClick={onContinue} className="btn-primary flex-1">
                {mode === 'grace' ? 'Complete now' : 'Go back'}
              </button>
              <button onClick={onConfirmSkip} className="btn-danger flex-1">Skip anyway</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
