import { Worker, type Job } from 'bullmq'
import { redis } from '../lib/redis'
import { prisma } from '../lib/prisma'

interface FileParserJob {
  userId: string
  intervalId: string
  fileUrl: string
  fileName: string
}

export function fileParserWorker() {
  const worker = new Worker(
    'file-parser',
    async (job: Job<FileParserJob>) => {
      const { userId, intervalId, fileUrl, fileName } = job.data
      console.log(`[FileParser] Processing ${fileName} for user ${userId}`)

      // Phase 6: full implementation
      // 1. Download file from Supabase Storage
      // 2. Call Claude API to extract academic periods
      // 3. Save to academic_periods table
      // 4. Emit socket event to client
    },
    {
      connection: redis,
      concurrency: 3,
    }
  )

  worker.on('failed', (job, err) => {
    console.error('[fileParser] Failed:', err.message)
  })

  return worker
}
