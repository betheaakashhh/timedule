// Structured logger — outputs JSON in production, pretty in dev

type Level = 'debug' | 'info' | 'warn' | 'error'

interface LogPayload {
  level: Level
  message: string
  timestamp: string
  [key: string]: unknown
}

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  if (process.env.NODE_ENV === 'production') {
    // JSON output for log aggregation (Datadog, Logtail, etc.)
    const method = level === 'error' ? console.error
                 : level === 'warn'  ? console.warn
                 : console.log
    method(JSON.stringify(payload))
  } else {
    // Pretty for dev
    const color = level === 'error' ? '\x1b[31m'
                : level === 'warn'  ? '\x1b[33m'
                : level === 'info'  ? '\x1b[36m'
                : '\x1b[90m'
    const reset = '\x1b[0m'
    const prefix = `${color}[${level.toUpperCase()}]${reset}`
    const metaStr = meta ? ' ' + JSON.stringify(meta) : ''
    console.log(`${prefix} ${message}${metaStr}`)
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info:  (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
}

// Request logger middleware helper
export function logRequest(method: string, path: string, userId?: string, status?: number, ms?: number) {
  logger.info('api_request', { method, path, userId, status, ms })
}
