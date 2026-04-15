import Redis from 'ioredis'


const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

// For general use only
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
  retryStrategy: (times: number) => Math.min(times * 1000, 5000), // keep retrying
})

// Plain config object for BullMQ — it creates its own connections from this
const parsed = new URL(REDIS_URL)
export const bullMQConnection = {
  host: parsed.hostname,
  port: Number(parsed.port) || 6379,
  password: decodeURIComponent(parsed.password) || undefined,
  tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
}


redis.on('error', (err: Error & { code?: string }) => {
  if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
    console.warn('[Redis] Connection lost, retrying...')
    return
  }
  console.error('[Redis Error]', err.message)
})

redis.on('connect', () => console.log('[Redis] Connected'))
redis.on('reconnecting', () => console.log('[Redis] Reconnecting...'))

export default redis