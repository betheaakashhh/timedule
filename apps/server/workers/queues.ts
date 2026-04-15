import { Queue } from 'bullmq'
import { bullMQConnection } from '../lib/redis'

export const minuteTickQueue  = new Queue('minute-tick',  { connection: bullMQConnection })
export const streakEvalQueue  = new Queue('streak-eval',  { connection: bullMQConnection })
export const emailQueue       = new Queue('email',        { connection: bullMQConnection })
export const fileParserQueue  = new Queue('file-parser',  { connection: bullMQConnection })
export const graceExpiryQueue = new Queue('grace-expiry', { connection: bullMQConnection })