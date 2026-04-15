// ─── Enums ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark'

export type StrictMode = 'hard' | 'warn' | 'grace'

export type IntervalStatus =
  | 'pending'
  | 'active'
  | 'grace'
  | 'completed'
  | 'skipped'
  | 'blocked'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type StreakEvent = 'earned' | 'maintained' | 'broken' | 'warned'

export type DailyLevel =
  | 'seedling'
  | 'sprout'
  | 'rising'
  | 'focused'
  | 'locked_in'
  | 'peak'

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  name: string
  timezone: string
  wakeTime: string // "06:00"
  streakCount: number
  streakLastDate: string | null
  levelToday: number
  emailReminders: boolean
  theme: Theme
  createdAt: string
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export interface IntervalTag {
  id: string
  userId: string | null
  name: string
  color: string
  icon: string // lucide icon name
  isSystem: boolean
  defaultStrict: boolean
  defaultStrictMode: StrictMode
  requiresLog: boolean
  emailRemind: boolean
}

// ─── Intervals ────────────────────────────────────────────────────────────────

export interface Interval {
  id: string
  timetableId: string
  tagId: string
  tag?: IntervalTag
  startTime: string // "07:30"
  endTime: string   // "08:30"
  label: string
  isStrict: boolean
  strictMode: StrictMode
  graceMinutes: number
  autoComplete: boolean
  requiresUserAction: boolean
  emailRemind: boolean
  sortOrder: number
  checklistItems?: ChecklistItem[]
  academicPeriods?: AcademicPeriod[]
}

// ─── Checklists ───────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string
  intervalId: string
  label: string
  isBlocking: boolean
  sortOrder: number
}

export interface ChecklistLog {
  id: string
  checklistItemId: string
  dailyLogId: string
  date: string
  checked: boolean
  checkedAt: string | null
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export interface DailyLog {
  id: string
  userId: string
  intervalId: string
  interval?: Interval
  date: string
  status: IntervalStatus
  completedAt: string | null
  skippedAt: string | null
  notes: string | null
  countsForStreak: boolean
  countsForLevel: boolean
  checklistLogs?: ChecklistLog[]
  mealLog?: MealLog
}

// ─── Meals ────────────────────────────────────────────────────────────────────

export interface MealLog {
  id: string
  dailyLogId: string
  items: string[]
  mealType: MealType
  loggedAt: string
}

// ─── Academic ─────────────────────────────────────────────────────────────────

export interface AcademicPeriod {
  id: string
  intervalId: string
  subject: string
  room: string
  teacher: string
  dayOfWeek: number // 0 = Sunday
  periodStart: string // "09:30"
  periodEnd: string   // "10:20"
}

// ─── Timetable ────────────────────────────────────────────────────────────────

export interface Timetable {
  id: string
  userId: string
  name: string
  isActive: boolean
  repeatDays: number[]
  validFrom: string
  validUntil: string | null
  createdAt: string
  intervals?: Interval[]
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface SocketIntervalTick {
  intervalId: string
  status: IntervalStatus
  secondsRemaining: number
  graceSecondsRemaining: number | null
}

export interface SocketAcademicCurrent {
  current: AcademicPeriod | null
  next: AcademicPeriod | null
  secondsUntilNext: number | null
}

export interface SocketStreakUpdate {
  streakCount: number
  event: StreakEvent
  message: string
}

export interface SocketLevelUpdate {
  points: number
  level: DailyLevel
  delta: number
}

// Server → Client
export interface ServerToClientEvents {
  'interval:tick': (data: SocketIntervalTick) => void
  'interval:started': (data: { intervalId: string; label: string }) => void
  'interval:ended': (data: { intervalId: string; autoCompleted: boolean }) => void
  'streak:update': (data: SocketStreakUpdate) => void
  'level:update': (data: SocketLevelUpdate) => void
  'academic:current': (data: SocketAcademicCurrent) => void
  'warning:strictPending': (data: { intervalId: string; mode: StrictMode; minutesLeft: number }) => void
  'system:message': (data: { text: string; type: 'info' | 'warning' | 'success' }) => void
  'pong': () => void
}

// Client → Server
export interface ClientToServerEvents {
  'task:complete': (data: { dailyLogId: string }) => void
  'task:skip': (data: { dailyLogId: string; reason?: string }) => void
  'checklist:toggle': (data: { checklistLogId: string; checked: boolean }) => void
  'meal:log': (data: { dailyLogId: string; items: string[]; mealType: MealType }) => void
  'academic:fetch': () => void
  'ping': () => void
}

// ─── Level helpers ────────────────────────────────────────────────────────────

export const LEVEL_THRESHOLDS: Record<DailyLevel, number> = {
  seedling: 0,
  sprout: 20,
  rising: 40,
  focused: 60,
  locked_in: 80,
  peak: 100,
}

export const LEVEL_ICONS: Record<DailyLevel, string> = {
  seedling: 'Sprout',
  sprout: 'Leaf',
  rising: 'TrendingUp',
  focused: 'Target',
  locked_in: 'Zap',
  peak: 'Star',
}

export function pointsToLevel(points: number): DailyLevel {
  if (points >= 100) return 'peak'
  if (points >= 80) return 'locked_in'
  if (points >= 60) return 'focused'
  if (points >= 40) return 'rising'
  if (points >= 20) return 'sprout'
  return 'seedling'
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100]
