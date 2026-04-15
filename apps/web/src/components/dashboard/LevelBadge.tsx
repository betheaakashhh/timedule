'use client'

import { Sprout, Leaf, TrendingUp, Target, Zap, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pointsToLevel, LEVEL_THRESHOLDS, type DailyLevel } from '@timeflow/types'

const LEVEL_CONFIG: Record<DailyLevel, {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
}> = {
  seedling: { label: 'Seedling', icon: <Sprout className="w-4 h-4" />,    color: 'text-gray-400',                          bg: 'bg-gray-100 dark:bg-gray-800' },
  sprout:   { label: 'Sprout',   icon: <Leaf className="w-4 h-4" />,      color: 'text-teal-500',                          bg: 'bg-teal-50 dark:bg-teal-900/30' },
  rising:   { label: 'Rising',   icon: <TrendingUp className="w-4 h-4" />, color: 'text-brand-500',                        bg: 'bg-brand-50 dark:bg-brand-900/30' },
  focused:  { label: 'Focused',  icon: <Target className="w-4 h-4" />,    color: 'text-brand-600',                         bg: 'bg-brand-100 dark:bg-brand-900/40' },
  locked_in:{ label: 'Locked in',icon: <Zap className="w-4 h-4" />,       color: 'text-amber-500',                         bg: 'bg-amber-50 dark:bg-amber-900/30' },
  peak:     { label: 'Peak',     icon: <Star className="w-4 h-4" />,      color: 'text-amber-400',                         bg: 'bg-amber-50 dark:bg-amber-900/40' },
}

interface LevelBadgeProps {
  points: number
  showProgress?: boolean
  className?: string
}

export function LevelBadge({ points, showProgress = false, className }: LevelBadgeProps) {
  const level = pointsToLevel(points)
  const cfg = LEVEL_CONFIG[level]

  // Next level threshold
  const levels = Object.entries(LEVEL_THRESHOLDS) as [DailyLevel, number][]
  const currentIdx = levels.findIndex(([l]) => l === level)
  const nextLevel = levels[currentIdx + 1]
  const progressPct = nextLevel
    ? Math.min(100, ((points - LEVEL_THRESHOLDS[level]) / (nextLevel[1] - LEVEL_THRESHOLDS[level])) * 100)
    : 100

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', cfg.bg)}>
        <span className={cfg.color}>{cfg.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <p className={cn('text-sm font-semibold', cfg.color)}>{cfg.label}</p>
          <p className="text-xs text-gray-400">{points} pts</p>
        </div>
        {showProgress && nextLevel && (
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, backgroundColor: cfg.color.replace('text-', '') }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{nextLevel[0]}</span>
          </div>
        )}
      </div>
    </div>
  )
}
