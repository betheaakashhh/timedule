import { Worker, type Job } from 'bullmq'
import { bullMQConnection } from '../lib/redis'
import { prisma } from '../lib/prisma'

export function graceExpiryWorker() {
  const worker = new Worker(
    'grace-expiry',
    async (job: Job<{ dailyLogId: string; userId: string }>) => {
      const { dailyLogId, userId } = job.data

      const log = await prisma.dailyLog.findUnique({
        where: { id: dailyLogId },
        include: { interval: true },
      })

      if (!log || log.status !== 'grace') return

      // Grace period expired without completion
      await prisma.dailyLog.update({
        where: { id: dailyLogId },
        data: { status: 'skipped', skippedAt: new Date() },
      })

      console.log(`[GraceExpiry] Log ${dailyLogId} expired — marked skipped`)
    },
    {
      connection: bullMQConnection,
      concurrency: 10,
    }
  )

  return worker
}
