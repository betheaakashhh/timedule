import { Queue } from 'bullmq'
import { redis } from '../lib/redis'

const connection = redis

export const minuteTickQueue  = new Queue('minute-tick',  { connection })
export const streakEvalQueue  = new Queue('streak-eval',  { connection })
export const emailQueue       = new Queue('email',        { connection })
export const fileParserQueue  = new Queue('file-parser',  { connection })
export const graceExpiryQueue = new Queue('grace-expiry', { connection })
