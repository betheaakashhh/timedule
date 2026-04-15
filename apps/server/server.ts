
import { createServer } from 'http'
import { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@timeflow/types'
import { registerSocketHandlers } from './socket/handlers'
import { startWorkers } from './workers'
import { redis } from './lib/redis'
import { prisma } from './lib/prisma'



const PORT = parseInt(process.env.SOCKET_PORT ?? '3001', 10)
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

console.log('[ENV] REDIS_URL:', process.env.REDIS_URL ? 'loaded ✅' : 'missing ❌')
console.log('[ENV] DATABASE_URL:', process.env.DATABASE_URL ? 'loaded ✅' : 'missing ❌')
console.log('[ENV] SOCKET_PORT:', process.env.SOCKET_PORT ? 'loaded ✅' : 'missing ❌')
console.log('[ENV] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL ? 'loaded ✅' : 'missing ❌')


// ── HTTP server ───────────────────────────────────────────────────────────────
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage().heapUsed,
      timestamp: new Date().toISOString(),
    }))
    return
  }
  res.writeHead(404)
  res.end()
})

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin:      ALLOWED_ORIGIN,
    credentials: true,
    methods:     ['GET', 'POST'],
  },
  pingTimeout:    60_000,   // 60s before declaring disconnect
  pingInterval:   25_000,   // send ping every 25s
  connectTimeout: 10_000,   // 10s to complete handshake
  transports:     ['websocket', 'polling'],
  // Limit max payload size
  maxHttpBufferSize: 1e6,   // 1 MB
})

// Suppress ECONNRESET at engine level — client disconnected mid-handshake
io.engine.on('connection_error', (err: Error & { code?: string }) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') return
  console.warn('[Socket engine error]', err.code, err.message)
})

// ── Register all handlers ─────────────────────────────────────────────────────
registerSocketHandlers(io)
startWorkers(io)

// ── Start listening ───────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`✅ TimeFlow server running on :${PORT}`)
  console.log(`   Accepting connections from: ${ALLOWED_ORIGIN}`)
  console.log(`   Node: ${process.version}  PID: ${process.pid}`)
})

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let isShuttingDown = false

async function shutdown(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(`\n[${signal}] Starting graceful shutdown...`)

  // Stop accepting new connections (15s timeout)
  const shutdownTimeout = setTimeout(() => {
    console.error('[Shutdown] Forced exit after 15s timeout')
    process.exit(1)
  }, 15_000)

  try {
    // Notify all clients before closing
    io.emit('system:message', { text: 'Server restarting — reconnecting shortly...', type: 'info' })

    await new Promise<void>((resolve) => {
      io.close(() => {
        console.log('[Shutdown] Socket.io closed')
        resolve()
      })
    })

    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        console.log('[Shutdown] HTTP server closed')
        resolve()
      })
    })

    await redis.quit()
    console.log('[Shutdown] Redis closed')

    await prisma.$disconnect()
    console.log('[Shutdown] Database closed')

    clearTimeout(shutdownTimeout)
    console.log('[Shutdown] Complete ✓')
    process.exit(0)
  } catch (err) {
    console.error('[Shutdown] Error during shutdown:', err)
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

// ── Global error handlers — prevent crashes from stray socket errors ──────────
process.on('uncaughtException', (err: Error & { code?: string }) => {
  // ECONNRESET / EPIPE are expected when clients disconnect abruptly
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') return

  console.error('[Uncaught Exception]', {
    message: err.message,
    code:    err.code,
    stack:   err.stack?.split('\n').slice(0, 5).join('\n'),
  })

  // Don't exit for non-fatal errors in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('[Unhandled Rejection]', {
    reason: reason instanceof Error ? reason.message : String(reason),
  })
})

// Memory leak detection — warn if heap grows beyond 512 MB
setInterval(() => {
  const mb = process.memoryUsage().heapUsed / 1024 / 1024
  if (mb > 512) {
    console.warn(`[Memory] Heap usage high: ${mb.toFixed(0)} MB`)
  }
}, 60_000)
