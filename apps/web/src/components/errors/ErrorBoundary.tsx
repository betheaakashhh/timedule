'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, info: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)

    // Send to logging service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[ErrorBoundary]', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  reset() {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
            {process.env.NODE_ENV === 'development'
              ? this.state.error?.message ?? 'An unexpected error occurred'
              : 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
            <pre className="text-xs text-left bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4 max-w-lg overflow-auto max-h-40 text-red-600 dark:text-red-400">
              {this.state.error.stack}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => this.reset()}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <a href="/dashboard" className="btn-secondary flex items-center gap-2">
              <Home className="w-4 h-4" />
              Go home
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook-based wrapper for simpler usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
