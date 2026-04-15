'use client'

import { Sunrise, Check } from 'lucide-react'
import { getWakeUpMessage } from '@/lib/utils'
import { useState } from 'react'

interface WakeUpCardProps {
  name: string
  wakeTime: string
}

export function WakeUpCard({ name, wakeTime }: WakeUpCardProps) {
  const [dismissed, setDismissed] = useState(false)
  const message = getWakeUpMessage()

  if (dismissed) return null

  return (
    <div className="card p-5 border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
          <Sunrise className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">
            Good morning, {name.split(' ')[0]}!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{message}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
            Wake-up time: {wakeTime}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          aria-label="Dismiss"
        >
          <Check className="w-3.5 h-3.5 text-amber-500" />
        </button>
      </div>
    </div>
  )
}
