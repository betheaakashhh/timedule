'use client'

import { Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STREAK_MILESTONES } from '@timeflow/types'

interface StreakBadgeProps {
  count: number
  className?: string
}

export function StreakBadge({ count, className }: StreakBadgeProps) {
  const isHot = count >= 7
  const isMilestone = STREAK_MILESTONES.includes(count)

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn(
        'relative flex items-center justify-center w-8 h-8 rounded-full',
        isHot
          ? 'bg-amber-100 dark:bg-amber-900/40'
          : 'bg-gray-100 dark:bg-gray-800'
      )}>
        <Sun className={cn(
          'w-4 h-4',
          isHot ? 'text-amber-500' : 'text-gray-400',
          isMilestone && 'animate-spin-slow'
        )} />
        {isMilestone && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </div>
      <div>
        <p className={cn(
          'text-sm font-bold leading-none',
          isHot ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'
        )}>
          {count}
        </p>
        <p className="text-[10px] text-gray-400 leading-none mt-0.5">
          {count === 1 ? 'day' : 'days'}
        </p>
      </div>
    </div>
  )
}
