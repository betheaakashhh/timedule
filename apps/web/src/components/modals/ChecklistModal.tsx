'use client'

import { useState } from 'react'
import { X, CheckSquare, Square, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ChecklistItem {
  id: string
  label: string
  isBlocking: boolean
}

interface ChecklistLog {
  id: string
  checklistItemId: string
  checked: boolean
}

interface ChecklistModalProps {
  open: boolean
  onClose: () => void
  items: ChecklistItem[]
  logs: ChecklistLog[]
  intervalLabel: string
  onToggle: (checklistLogId: string, checked: boolean) => Promise<void>
}

export function ChecklistModal({
  open, onClose, items, logs, intervalLabel, onToggle
}: ChecklistModalProps) {
  const [toggling, setToggling] = useState<string | null>(null)

  if (!open) return null

  const getLog = (itemId: string) => logs.find((l) => l.checklistItemId === itemId)

  async function handleToggle(log: ChecklistLog | undefined, checked: boolean) {
    if (!log) return
    setToggling(log.id)
    try {
      await onToggle(log.id, checked)
    } catch {
      toast.error('Failed to update')
    } finally {
      setToggling(null)
    }
  }

  const allBlockingDone = items
    .filter((i) => i.isBlocking)
    .every((i) => getLog(i.id)?.checked)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Checklist</h2>
            <p className="text-xs text-gray-400 mt-0.5">{intervalLabel}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2">
          {items.map((item) => {
            const log = getLog(item.id)
            const checked = log?.checked ?? false

            return (
              <button
                key={item.id}
                onClick={() => handleToggle(log, !checked)}
                disabled={toggling === log?.id}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                  checked
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                {checked
                  ? <CheckSquare className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  : <Square className="w-4 h-4 text-gray-300 dark:text-gray-500 flex-shrink-0" />
                }
                <span className={cn(
                  'flex-1 text-sm',
                  checked ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'
                )}>
                  {item.label}
                </span>
                {item.isBlocking && (
                  <Lock className="w-3 h-3 text-red-400 flex-shrink-0" title="Required" />
                )}
              </button>
            )
          })}
        </div>

        {!allBlockingDone && items.some((i) => i.isBlocking) && (
          <div className="px-5 pb-4">
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Complete all locked items before marking this interval done.
            </p>
          </div>
        )}

        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      </div>
    </div>
  )
}
