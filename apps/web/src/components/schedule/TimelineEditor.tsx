'use client'
import { useState, useRef, useCallback } from 'react'
import { Plus, GripVertical, Pencil, Trash2, Clock, Lock, AlertTriangle, Timer } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn, formatTimeDisplay } from '@/lib/utils'
import type { Interval, IntervalTag } from '@timeflow/types'

function TagIcon({ name, size = 14 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Circle
  return <Icon style={{ width: size, height: size }} />
}

// Convert "HH:mm" → minutes from midnight
function toMins(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function fromMins(m: number) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// 5am–midnight visible range
const DAY_START = 5 * 60   // 300 mins
const DAY_END   = 24 * 60  // 1440 mins
const DAY_RANGE = DAY_END - DAY_START

const HOUR_LABELS = Array.from({ length: 20 }, (_, i) => i + 5) // 5–24

interface TimelineEditorProps {
  intervals: Interval[]
  onAdd: (startTime: string, endTime: string) => void
  onEdit: (interval: Interval) => void
  onDelete: (id: string) => void
  onReorder: (orders: { id: string; sortOrder: number }[]) => void
}

export function TimelineEditor({ intervals, onAdd, onEdit, onDelete, onReorder }: TimelineEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [ghostTime, setGhostTime] = useState<string | null>(null)

  const sorted = [...intervals].sort((a, b) => toMins(a.startTime) - toMins(b.startTime))

  // Pixel height per minute
  function getPixelsPerMin() {
    const h = containerRef.current?.clientHeight ?? 800
    return h / DAY_RANGE
  }

  function minsToPercent(mins: number) {
    return ((mins - DAY_START) / DAY_RANGE) * 100
  }

  function yToMins(y: number) {
    const h = containerRef.current?.clientHeight ?? 800
    const raw = DAY_START + (y / h) * DAY_RANGE
    return Math.round(raw / 15) * 15 // snap to 15-min grid
  }

  // Click on empty space → open add at that time
  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-interval]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const startMins = Math.max(DAY_START, Math.min(yToMins(y), DAY_END - 60))
    onAdd(fromMins(startMins), fromMins(startMins + 60))
  }

  const strictIcon = (interval: Interval) => {
    if (!interval.isStrict) return null
    const icons = { hard: Lock, warn: AlertTriangle, grace: Timer }
    const Icon = icons[interval.strictMode as keyof typeof icons] ?? AlertTriangle
    return <Icon className="w-2.5 h-2.5" />
  }

  return (
    <div className="flex gap-0 h-full">
      {/* Hour axis */}
      <div className="w-14 flex-shrink-0 relative select-none" style={{ height: '100%' }}>
        {HOUR_LABELS.map((h) => (
          <div
            key={h}
            className="absolute right-2 text-xs text-gray-400 dark:text-gray-500"
            style={{ top: `${minsToPercent(h * 60)}%`, transform: 'translateY(-50%)' }}
          >
            {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
          </div>
        ))}
      </div>

      {/* Track */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-crosshair overflow-hidden"
        onClick={handleTrackClick}
        style={{ minHeight: 600 }}
      >
        {/* Hour grid lines */}
        {HOUR_LABELS.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
            style={{ top: `${minsToPercent(h * 60)}%` }}
          />
        ))}

        {/* 30-min minor lines */}
        {HOUR_LABELS.map((h) => (
          <div
            key={`${h}-30`}
            className="absolute left-0 right-0 border-t border-dashed border-gray-100 dark:border-gray-800 opacity-50"
            style={{ top: `${minsToPercent(h * 60 + 30)}%` }}
          />
        ))}

        {/* Current time indicator */}
        <CurrentTimeBar minsToPercent={minsToPercent} />

        {/* Interval blocks */}
        {sorted.map((interval) => {
          const top    = minsToPercent(toMins(interval.startTime))
          const height = minsToPercent(toMins(interval.endTime)) - top
          const tag    = interval.tag as IntervalTag | undefined
          const color  = tag?.color ?? '#7F77DD'
          const durationMins = toMins(interval.endTime) - toMins(interval.startTime)

          return (
            <div
              key={interval.id}
              data-interval={interval.id}
              className={cn(
                'absolute left-2 right-2 rounded-lg border overflow-hidden',
                'transition-shadow hover:shadow-md cursor-default select-none group',
                dragging === interval.id && 'opacity-50'
              )}
              style={{
                top: `${top}%`,
                height: `${Math.max(height, 3)}%`,
                backgroundColor: color + '18',
                borderColor: color + '55',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5 rounded-t-lg"
                style={{ backgroundColor: color }}
              />
              <div className="px-2 pt-2.5 pb-1 h-full flex flex-col">
                {/* Title row */}
                <div className="flex items-start gap-1.5 min-w-0">
                  {tag && (
                    <span style={{ color }} className="flex-shrink-0 mt-0.5">
                      <TagIcon name={tag.icon} size={12} />
                    </span>
                  )}
                  <p
                    className="text-xs font-semibold leading-tight flex-1 min-w-0 truncate"
                    style={{ color }}
                  >
                    {interval.label || tag?.name}
                  </p>
                  {interval.isStrict && (
                    <span style={{ color }} className="flex-shrink-0 mt-0.5 opacity-70">
                      {strictIcon(interval)}
                    </span>
                  )}
                </div>

                {/* Time */}
                {durationMins >= 30 && (
                  <p className="text-xs mt-1 opacity-60" style={{ color }}>
                    {formatTimeDisplay(interval.startTime)} – {formatTimeDisplay(interval.endTime)}
                  </p>
                )}

                {/* Checklist count */}
                {durationMins >= 45 && (interval.checklistItems?.length ?? 0) > 0 && (
                  <p className="text-xs mt-auto opacity-50" style={{ color }}>
                    {interval.checklistItems!.length} checklist items
                  </p>
                )}
              </div>

              {/* Action buttons - show on hover */}
              <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(interval) }}
                  className="w-6 h-6 bg-white dark:bg-gray-800 rounded-md shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-3 h-3 text-gray-600" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(interval.id) }}
                  className="w-6 h-6 bg-white dark:bg-gray-800 rounded-md shadow flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
          )
        })}

        {/* Empty state hint */}
        {intervals.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-brand-400" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Click anywhere to add an interval</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Or use the Add button above</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CurrentTimeBar({ minsToPercent }: { minsToPercent: (m: number) => number }) {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  if (nowMins < DAY_START || nowMins > DAY_END) return null
  const top = minsToPercent(nowMins)

  return (
    <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${top}%` }}>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 shadow-sm" />
        <div className="flex-1 h-px bg-red-400 opacity-60" />
      </div>
    </div>
  )
}
