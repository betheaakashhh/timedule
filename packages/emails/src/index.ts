export { StreakWarningEmail } from './templates/StreakWarning'
export { StreakMilestoneEmail } from './templates/StreakMilestone'
export { TaskReminderEmail } from './templates/TaskReminder'

export const EMAILS = {
  STREAK_WARNING:   'streak-warning',
  STREAK_MILESTONE: 'streak-milestone',
  TASK_REMINDER:    'task-reminder',
  DAILY_DIGEST:     'daily-digest',
} as const

export type EmailType = typeof EMAILS[keyof typeof EMAILS]
