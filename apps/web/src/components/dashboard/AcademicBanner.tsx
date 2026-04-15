'use client'

import { GraduationCap, ChevronRight, Clock } from 'lucide-react'
import { formatTimeDisplay } from '@/lib/utils'
import type { AcademicPeriod } from '@timeflow/types'

interface AcademicBannerProps {
  current: AcademicPeriod | null
  next: AcademicPeriod | null
}

export function AcademicBanner({ current, next }: AcademicBannerProps) {
  if (!current && !next) return null

  return (
    <div className="card p-3.5 border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900/10">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          {current ? (
            <>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Now: {current.subject}
              </span>
              {current.room && (
                <span className="text-xs text-blue-500">Room {current.room}</span>
              )}
              <span className="text-xs text-blue-400">
                until {formatTimeDisplay(current.periodEnd)}
              </span>
            </>
          ) : (
            <span className="text-sm text-blue-600 dark:text-blue-400">No ongoing period</span>
          )}

          {next && (
            <div className="flex items-center gap-1.5 ml-auto">
              <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-blue-500">
                Next: <span className="font-medium text-blue-600 dark:text-blue-300">{next.subject}</span>{' '}
                at {formatTimeDisplay(next.periodStart)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
