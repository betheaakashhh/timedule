import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parse, isAfter, isBefore, addMinutes } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import type { IntervalStatus, DailyLevel } from '@timeflow/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Parse "HH:mm" string into a Date today in the given timezone */
export function parseTimeString(timeStr: string, timezone: string): Date {
  const now = toZonedTime(new Date(), timezone)
  const [hours, minutes] = timeStr.split(':').map(Number)
  const result = new Date(now)
  result.setHours(hours, minutes, 0, 0)
  return result
}

/** Format seconds into MM:SS */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Format seconds into human-readable (e.g. "2h 30m") */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`.trim()
  return `${m}m`
}

/** "07:30" → "7:30 AM" */
export function formatTimeDisplay(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

/** Get current time as "HH:mm" in timezone */
export function getCurrentTimeString(timezone: string): string {
  const now = toZonedTime(new Date(), timezone)
  return format(now, 'HH:mm')
}

/** Check if current time is within an interval */
export function isIntervalActive(
  startTime: string,
  endTime: string,
  timezone: string
): boolean {
  const now = toZonedTime(new Date(), timezone)
  const start = parseTimeString(startTime, timezone)
  const end = parseTimeString(endTime, timezone)
  return !isBefore(now, start) && isBefore(now, end)
}

/** Seconds remaining in an interval */
export function secondsRemaining(endTime: string, timezone: string): number {
  const now = toZonedTime(new Date(), timezone)
  const end = parseTimeString(endTime, timezone)
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function statusLabel(status: IntervalStatus): string {
  const map: Record<IntervalStatus, string> = {
    pending: 'Upcoming',
    active: 'In progress',
    grace: 'Grace period',
    completed: 'Completed',
    skipped: 'Skipped',
    blocked: 'Blocked',
  }
  return map[status]
}

export function statusClass(status: IntervalStatus): string {
  const map: Record<IntervalStatus, string> = {
    pending: 'pill-pending',
    active: 'pill-active',
    grace: 'pill-grace',
    completed: 'pill-completed',
    skipped: 'pill-skipped',
    blocked: 'pill-blocked',
  }
  return map[status]
}

// ─── Level helpers ────────────────────────────────────────────────────────────

export function levelLabel(level: DailyLevel): string {
  const map: Record<DailyLevel, string> = {
    seedling: 'Seedling',
    sprout: 'Sprout',
    rising: 'Rising',
    focused: 'Focused',
    locked_in: 'Locked in',
    peak: 'Peak',
  }
  return map[level]
}

export function levelColor(level: DailyLevel): string {
  const map: Record<DailyLevel, string> = {
    seedling: 'text-gray-400',
    sprout: 'text-teal-400',
    rising: 'text-brand-400',
    focused: 'text-brand-600',
    locked_in: 'text-amber-200',
    peak: 'text-amber-100',
  }
  return map[level]
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

export function getGreeting(name: string, timezone: string): string {
  const hour = toZonedTime(new Date(), timezone).getHours()
  if (hour < 12) return `Good morning, ${name} ☀️`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

// ─── Wake up messages ─────────────────────────────────────────────────────────

export const WAKE_UP_MESSAGES = [
  "Good morning! A new day, a fresh start. You've got this.",
  "Rise and shine! Today is full of potential — make it count.",
  "Morning! Hope you slept well. Let's build something great today.",
  "Good morning! Small steps every day add up to big wins.",
  "You're up! That's already the first win of the day.",
  "Morning! Consistency is the secret. Let's stay on track today.",
]

export function getWakeUpMessage(): string {
  return WAKE_UP_MESSAGES[Math.floor(Math.random() * WAKE_UP_MESSAGES.length)]
}
