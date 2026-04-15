import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

// Shared Redis connection for BullMQ workers
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: false,
})

// Separate connection for pub/sub (BullMQ requirement)
export const redisSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

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
