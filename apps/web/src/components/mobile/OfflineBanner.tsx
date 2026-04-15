'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineBanner() {
  const [online, setOnline] = useState(true)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    setOnline(navigator.onLine)

    function handleOnline() {
      setOnline(true)
      setJustReconnected(true)
      setTimeout(() => setJustReconnected(false), 3000)
    }
    function handleOffline() {
      setOnline(false)
      setJustReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online && !justReconnected) return null

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-all duration-300',
      online
        ? 'bg-teal-500 text-white'
        : 'bg-gray-800 dark:bg-gray-900 text-gray-200'
    )}>
      {online ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          Back online — syncing...
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          You're offline — actions will sync when reconnected
        </>
      )}
    </div>
  )
}
