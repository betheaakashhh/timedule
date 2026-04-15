import type { Server, Socket } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@timeflow/types'
import { prisma } from '../lib/prisma'

type TFServer = Server<ClientToServerEvents, ServerToClientEvents>
type TFSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export function registerSocketHandlers(io: TFServer) {
  io.use(async (socket, next) => {
    const userId = socket.handshake.auth?.userId as string | undefined
    if (!userId) {
      return next(new Error('Unauthorized — no userId in auth'))
    }
    // Attach to socket data for use in handlers
    socket.data.userId = userId
    next()
  })

  io.on('connection', (socket: TFSocket) => {
    const userId = socket.data.userId as string
    console.log(`[Socket] User ${userId} connected (${socket.id})`)

    // Join user-specific room — all server events are emitted to this room
    socket.join(`user:${userId}`)

    // ── Client → Server handlers ────────────────────────────────────────────

    socket.on('task:complete', async ({ dailyLogId }) => {
      try {
        const log = await prisma.dailyLog.update({
          where: { id: dailyLogId, userId },
          data: { status: 'completed', completedAt: new Date() },
          include: { interval: true },
        })

        // Points update
        if (log.countsForLevel) {
          const delta = log.interval.isStrict ? 10 : 5
          await prisma.user.update({
            where: { id: userId },
            data: { levelToday: { increment: delta } },
          })
          const user = await prisma.user.findUnique({ where: { id: userId } })
          if (user) {
            const { pointsToLevel } = await import('@timeflow/types')
            io.to(`user:${userId}`).emit('level:update', {
              points: user.levelToday,
              level: pointsToLevel(user.levelToday),
              delta,
            })
          }
        }

        socket.emit('system:message', { text: `✓ ${log.interval.label} completed`, type: 'success' })
      } catch (err) {
        console.error('[task:complete]', err)
        socket.emit('system:message', { text: 'Failed to mark task complete', type: 'warning' })
      }
    })

    socket.on('task:skip', async ({ dailyLogId, reason }) => {
      try {
        const log = await prisma.dailyLog.findUnique({
          where: { id: dailyLogId, userId },
          include: { interval: true },
        })
        if (!log) return

        // Strict hard-lock: cannot skip
        if (log.interval.isStrict && log.interval.strictMode === 'hard') {
          socket.emit('system:message', {
            text: 'This task is hard-locked — you must complete it to continue.',
            type: 'warning',
          })
          return
        }

        await prisma.dailyLog.update({
          where: { id: dailyLogId },
          data: { status: 'skipped', skippedAt: new Date() },
        })

        // Strict warn/grace → break streak
        if (log.interval.isStrict && log.countsForStreak) {
          await breakStreak(userId, io)
        }

        // Penalty points
        if (log.interval.isStrict && log.countsForLevel) {
          await prisma.user.update({
            where: { id: userId },
            data: { levelToday: { decrement: 10 } },
          })
          const user = await prisma.user.findUnique({ where: { id: userId } })
          if (user) {
            const { pointsToLevel } = await import('@timeflow/types')
            io.to(`user:${userId}`).emit('level:update', {
              points: Math.max(0, user.levelToday),
              level: pointsToLevel(Math.max(0, user.levelToday)),
              delta: -10,
            })
          }
        }
      } catch (err) {
        console.error('[task:skip]', err)
      }
    })

    socket.on('checklist:toggle', async ({ checklistLogId, checked }) => {
      try {
        await prisma.checklistLog.update({
          where: { id: checklistLogId },
          data: { checked, checkedAt: checked ? new Date() : null },
        })
      } catch (err) {
        console.error('[checklist:toggle]', err)
      }
    })

    socket.on('meal:log', async ({ dailyLogId, items, mealType }) => {
      try {
        if (!items || items.length === 0) {
          socket.emit('system:message', { text: 'Please add at least one food item', type: 'warning' })
          return
        }

        await prisma.$transaction([
          prisma.mealLog.upsert({
            where: { dailyLogId },
            create: { dailyLogId, items, mealType },
            update: { items, mealType },
          }),
          prisma.dailyLog.update({
            where: { id: dailyLogId },
            data: { status: 'completed', completedAt: new Date() },
          }),
        ])

        socket.emit('system:message', { text: 'Meal logged and task marked complete', type: 'success' })
      } catch (err) {
        console.error('[meal:log]', err)
      }
    })

    socket.on('academic:fetch', async () => {
      // Will be fully implemented in Phase 6
      socket.emit('system:message', { text: 'Academic periods loading...', type: 'info' })
    })

    socket.on('ping', () => {
      socket.emit('pong')
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User ${userId} disconnected: ${reason}`)
    })

    // Suppress socket-level ECONNRESET — just log and move on
    socket.on('error', (err: Error & { code?: string }) => {
      if (err.code === 'ECONNRESET') return
      console.warn(`[Socket error] user:${userId}`, err.message)
    })
  })
}

// ── Streak break helper ───────────────────────────────────────────────────────
async function breakStreak(userId: string, io: TFServer) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { streakCount: 0, streakLastDate: null },
    }),
    prisma.streakEvent.create({
      data: {
        userId,
        date: today,
        event: 'broken',
        streakCountAt: user.streakCount,
      },
    }),
  ])

  io.to(`user:${userId}`).emit('streak:update', {
    streakCount: 0,
    event: 'broken',
    message: `Streak of ${user.streakCount} days broken. Start again — you got this.`,
  })
}
