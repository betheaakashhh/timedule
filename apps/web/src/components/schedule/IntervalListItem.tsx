'use client'
import { Pencil, Trash2, Lock, AlertTriangle, Timer, CheckSquare, Bell } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn, formatTimeDisplay } from '@/lib/utils'
import type { Interval, IntervalTag, StrictMode } from '@timeflow/types'

function TagIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Circle
  return <Icon className="w-3.5 h-3.5" />
}

const STRICT_ICONS: Record<StrictMode, React.ReactNode> = {
  hard:  <Lock className="w-3 h-3" />,
  warn:  <AlertTriangle className="w-3 h-3" />,
  grace: <Timer className="w-3 h-3" />,
}

const STRICT_COLORS: Record<StrictMode, string> = {
  hard:  'text-red-500 bg-red-50 dark:bg-red-900/20',
  warn:  'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  grace: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
}

interface IntervalListItemProps {
  interval: Interval
  onEdit: () => void
  onDelete: () => void
}

export function IntervalListItem({ interval, onEdit, onDelete }: IntervalListItemProps) {
  const tag = interval.tag as IntervalTag | undefined
  const color = tag?.color ?? '#7F77DD'

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm group',
      'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
    )}>
      {/* Color bar */}
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

      {/* Tag icon */}
      {tag && (
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '22', color }}
        >
          <TagIcon name={tag.icon} />
        </span>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {interval.label || tag?.name}
          </p>
          {interval.isStrict && (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium',
              STRICT_COLORS[interval.strictMode as StrictMode]
            )}>
              {STRICT_ICONS[interval.strictMode as StrictMode]}
              {interval.strictMode === 'hard' ? 'Hard' : interval.strictMode === 'warn' ? 'Warn' : 'Grace'}
            </span>
          )}
          {interval.autoComplete && (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
              Auto
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-xs text-gray-400">
            {formatTimeDisplay(interval.startTime)} – {formatTimeDisplay(interval.endTime)}
          </p>
          {(interval.checklistItems?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <CheckSquare className="w-3 h-3" />
              {interval.checklistItems!.length}
            </span>
          )}
          {interval.emailRemind && (
            <Bell className="w-3 h-3 text-gray-300" />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Pencil className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
    </div>
  )
}
