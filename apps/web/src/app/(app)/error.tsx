'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-950">
      <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred. Your data is safe.'}
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-4 font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <a href="/dashboard" className="btn-secondary flex items-center gap-2">
          <Home className="w-4 h-4" />
          Dashboard
        </a>
      </div>
    </div>
  )
}
