'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service worker registered:', reg.scope)

        // Check for updates every 60s
        setInterval(() => reg.update(), 60_000)

        // Notify user of update
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available — could show a toast here
              console.log('[PWA] New version available')
            }
          })
        })
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err)
      })
  }, [])

  return null
}
