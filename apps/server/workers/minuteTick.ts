import { Worker, type Job } from 'bullmq'
import type { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, IntervalStatus } from '@timeflow/types'
import { redis } from '../lib/redis'
import { prisma } from '../lib/prisma'
import { emailQueue } from './queues'
import { toZonedTime, format } from 'date-fns-tz'
import { startOfDay } from 'date-fns'

type TFServer = Server<ClientToServerEvents, ServerToClientEvents>

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function toAmPm(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export function minuteTickWorker(io: TFServer) {
  const worker = new Worker(
    'minute-tick',
    async (_job: Job) => {
      const users = await prisma.user.findMany({
        include: {
          timetables: {
            where: { isActive: true },
            include: {
              intervals: {
                include: { tag: true, checklistItems: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      })

      for (const user of users) {
        const timetable = user.timetables[0]
        if (!timetable) continue

        const now = toZonedTime(new Date(), user.timezone)
        const nowMins = now.getHours() * 60 + now.getMinutes()
        const today = startOfDay(now)
        const dowNow = now.getDay()

        if (!timetable.repeatDays.includes(dowNow)) continue

        for (const interval of timetable.intervals) {
          const startMins = timeToMinutes(interval.startTime)
          const endMins   = timeToMinutes(interval.endTime)
          const graceMins = interval.graceMinutes ?? 15

          let newStatus: IntervalStatus | null = null
          let secondsRemaining = 0
          let graceSecondsRemaining: number | null = null

          if (nowMins < startMins) {
            newStatus = 'pending'
            secondsRemaining = (startMins - nowMins) * 60
          } else if (nowMins >= startMins && nowMins < endMins) {
            newStatus = 'active'
            secondsRemaining = (endMins - nowMins) * 60

            // Exact start minute — send email reminder
            if (nowMins === startMins && interval.emailRemind && user.emailReminders) {
              await emailQueue.add('task-reminder', {
                type: 'task-reminder',
                userId: user.id,
                email: user.email,
                name: user.name,
                taskLabel: interval.label || interval.tag?.name || 'Task',
                startTime: toAmPm(interval.startTime),
                tagName: interval.tag?.name ?? '',
                isStrict: interval.isStrict,
              })
            }

            // Strict warning — 5 minutes before end
            if (interval.isStrict && secondsRemaining <= 300) {
              io.to(`user:${user.id}`).emit('warning:strictPending', {
                intervalId: interval.id,
                mode: interval.strictMode as any,
                minutesLeft: Math.ceil(secondsRemaining / 60),
              })
            }
          } else if (nowMins >= endMins && nowMins < endMins + graceMins) {
            newStatus = 'grace'
            graceSecondsRemaining = (endMins + graceMins - nowMins) * 60
          } else {
            newStatus = interval.autoComplete ? 'completed' : null
          }

          if (!newStatus) continue

          try {
            const existingLog = await prisma.dailyLog.findUnique({
              where: {
                userId_intervalId_date: {
                  userId: user.id,
                  intervalId: interval.id,
                  date: today,
                },
              },
            })

            if (!existingLog) {
              await prisma.dailyLog.create({
                data: {
                  userId: user.id,
                  intervalId: interval.id,
                  date: today,
                  status: newStatus,
                  countsForStreak: !interval.autoComplete,
                  countsForLevel: !interval.autoComplete,
                },
              })
            } else if (
              existingLog.status !== 'completed' &&
              existingLog.status !== 'skipped' &&
              existingLog.status !== newStatus
            ) {
              await prisma.dailyLog.update({
                where: { id: existingLog.id },
                data: { status: newStatus },
              })
            }

            io.to(`user:${user.id}`).emit('interval:tick', {
              intervalId: interval.id,
              status: newStatus,
              secondsRemaining,
              graceSecondsRemaining,
            })

            if (
              newStatus === 'active' &&
              (!existingLog || existingLog.status === 'pending')
            ) {
              io.to(`user:${user.id}`).emit('interval:started', {
                intervalId: interval.id,
                label: interval.label || interval.tag?.name || 'Interval',
              })
            }
          } catch {
            // Unique constraint race condition — safe to ignore
          }
        }
      }
    },
    { connection: redis, concurrency: 5 }
  )

  worker.on('failed', (job, err) => {
    console.error('[minuteTick] Job failed:', err.message)
  })

  return worker
}
