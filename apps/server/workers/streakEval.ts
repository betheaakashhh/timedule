import { Worker, type Job } from 'bullmq'
import type { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@timeflow/types'
import { bullMQConnection } from '../lib/redis'
import { prisma } from '../lib/prisma'
import { emailQueue } from './queues'
import { STREAK_MILESTONES } from '@timeflow/types'
import { startOfDay } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

type TFServer = Server<ClientToServerEvents, ServerToClientEvents>

export function streakEvalWorker(io: TFServer) {
  const worker = new Worker(
    'streak-eval',
    async (_job: Job) => {
      const users = await prisma.user.findMany()

      for (const user of users) {
        const today = startOfDay(toZonedTime(new Date(), user.timezone))

        const strictLogs = await prisma.dailyLog.findMany({
          where: { userId: user.id, date: today, countsForStreak: true },
          include: { interval: { select: { isStrict: true } } },
        })

        const strictToday = strictLogs.filter((l) => l.interval.isStrict)
        if (strictToday.length === 0) continue

        const allCompleted  = strictToday.every((l) => l.status === 'completed')
        const incomplete    = strictToday.filter((l) => l.status !== 'completed' && l.status !== 'skipped')
        const anyIncomplete = incomplete.length > 0

        if (allCompleted) {
          const newCount = user.streakCount + 1
          await prisma.$transaction([
            prisma.user.update({
              where: { id: user.id },
              data: { streakCount: newCount, streakLastDate: today },
            }),
            prisma.streakEvent.create({
              data: {
                userId: user.id,
                date: today,
                event: 'earned',
                streakCountAt: newCount,
              },
            }),
          ])

          io.to(`user:${user.id}`).emit('streak:update', {
            streakCount: newCount,
            event: newCount === 1 ? 'earned' : 'maintained',
            message:
              newCount === 1
                ? 'You earned your first streak day!'
                : `Day ${newCount} streak! 🔥`,
          })

          if (STREAK_MILESTONES.includes(newCount) && user.emailReminders) {
            await emailQueue.add('streak-milestone', {
              type: 'streak-milestone',
              userId: user.id,
              email: user.email,
              name: user.name,
              streakCount: newCount,
            })
          }
        } else if (anyIncomplete) {
          await prisma.streakEvent.create({
            data: {
              userId: user.id,
              date: today,
              event: 'warned',
              streakCountAt: user.streakCount,
            },
          })

          io.to(`user:${user.id}`).emit('streak:update', {
            streakCount: user.streakCount,
            event: 'warned',
            message: `${incomplete.length} strict task${incomplete.length !== 1 ? 's' : ''} incomplete — complete them to keep your streak!`,
          })

          if (user.emailReminders) {
            await emailQueue.add('streak-warning', {
              type: 'streak-warning',
              userId: user.id,
              email: user.email,
              name: user.name,
              streakCount: user.streakCount,
              incompleteCount: incomplete.length,
            })
          }
        }
      }
    },
    { connection: bullMQConnection, concurrency: 2 }
  )

  worker.on('failed', (job, err) => {
    console.error('[streakEval] Failed:', err.message)
  })

  return worker
}
