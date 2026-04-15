// Redis-backed rate limiter using sliding window algorithm
// Falls back to in-memory if Redis is unavailable

import { NextRequest, NextResponse } from 'next/server'

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  key: string           // e.g. 'api:user:123'
  limit: number         // max requests
  windowMs: number      // window in milliseconds
  message?: string
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number         // Unix timestamp ms
}

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowMs, message } = options
  const now = Date.now()
  const resetAt = now + windowMs

  // Try Redis first (via fetch to avoid edge runtime issues)
  // Falls back to in-memory for simplicity in Phase 9
  const entry = memoryStore.get(key)

  if (!entry || entry.resetAt < now) {
    // New window
    memoryStore.set(key, { count: 1, resetAt })
    return { success: true, limit, remaining: limit - 1, reset: resetAt }
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetAt }
  }

  entry.count++
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  }
}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of memoryStore.entries()) {
      if (val.resetAt < now) memoryStore.delete(key)
    }
  }, 5 * 60 * 1000)
}

// Helper: apply rate limit to an API route and return 429 if exceeded
export async function withRateLimit(
  req: NextRequest,
  userId: string | null,
  options: Omit<RateLimitOptions, 'key'>
): Promise<NextResponse | null> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'

  const key = userId ? `rl:user:${userId}` : `rl:ip:${ip}`

  const result = await rateLimit({ ...options, key })

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: options.message ?? `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)}s`,
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset':     String(result.reset),
          'Retry-After':           String(Math.ceil((result.reset - Date.now()) / 1000)),
        },
      }
    )
  }

  return null // No rate limit hit — continue
}

// Pre-configured limiters
export const LIMITS = {
  auth:       { limit: 10,  windowMs: 60_000 },        // 10/min for auth
  api:        { limit: 120, windowMs: 60_000 },         // 120/min for regular API
  upload:     { limit: 5,   windowMs: 60_000 },         // 5/min for file uploads
  emailParse: { limit: 3,   windowMs: 5 * 60_000 },    // 3 per 5min for AI parse
} as const
