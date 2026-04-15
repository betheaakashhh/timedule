'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@timeflow/types'
import { useUserStore } from '@/lib/stores/user.store'
import toast from 'react-hot-toast'

type TFSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socketInstance: TFSocket | null = null

export function useSocket(userId: string | null) {
  const socketRef = useRef<TFSocket | null>(null)
  const { updateStreak, updateLevel } = useUserStore()

  const getSocket = useCallback((): TFSocket | null => {
    if (!userId) return null
    if (socketInstance?.connected) {
      socketRef.current = socketInstance
      return socketInstance
    }

    const socket: TFSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001', {
      auth: { userId },
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Error:', err.message)
    })

    // ── Event handlers — dispatch to window for page-level consumption ──

    socket.on('interval:tick', (data) => {
      window.dispatchEvent(new CustomEvent('socket:interval:tick', { detail: data }))
    })

    socket.on('interval:started', (data) => {
      toast(`Now: ${data.label}`, { icon: '▶️', duration: 4000 })
    })

    socket.on('interval:ended', (data) => {
      window.dispatchEvent(new CustomEvent('socket:interval:ended', { detail: data }))
    })

    socket.on('streak:update', (data) => {
      updateStreak(data.streakCount)
      window.dispatchEvent(new CustomEvent('socket:streak:update', { detail: data }))
      if (data.event === 'earned' || data.event === 'maintained') {
        toast.success(data.message, { duration: 5000 })
      } else if (data.event === 'broken') {
        toast.error(data.message, { duration: 6000 })
      } else {
        toast(data.message, { icon: '⚠️', duration: 5000 })
      }
    })

    socket.on('level:update', (data) => {
      updateLevel(data.points)
      window.dispatchEvent(new CustomEvent('socket:level:update', { detail: data }))
    })

    socket.on('warning:strictPending', (data) => {
      window.dispatchEvent(new CustomEvent('socket:warning:strict', { detail: data }))
      toast(`⚠ ${data.minutesLeft}m left on strict task`, { duration: 6000 })
    })

    socket.on('system:message', (data) => {
      if (data.type === 'success') toast.success(data.text)
      else if (data.type === 'warning') toast(data.text, { icon: '⚠️' })
      else toast(data.text)
    })

    // Keepalive
    const pingInterval = setInterval(() => {
      if (socket.connected) socket.emit('ping')
    }, 25_000)

    socket.on('disconnect', () => clearInterval(pingInterval))

    // Suppress ECONNRESET at socket level
    socket.on('error', (err: any) => {
      if (err?.code === 'ECONNRESET') return
      console.warn('[Socket error]', err?.message)
    })

    socketInstance = socket
    socketRef.current = socket
    return socket
  }, [userId, updateStreak, updateLevel])

  useEffect(() => {
    getSocket()
  }, [getSocket])

  const emit = useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      ...args: Parameters<ClientToServerEvents[K]>
    ) => {
      const socket = getSocket()
      if (socket?.connected) {
        ;(socket.emit as Function)(event, ...args)
      }
    },
    [getSocket]
  )

  return { socket: socketRef.current, emit }
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
