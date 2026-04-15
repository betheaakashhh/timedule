export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">You're offline</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        TimeFlow needs a connection to sync your schedule. Your last-loaded pages are still available.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary"
      >
        Try again
      </button>
      <p className="text-xs text-gray-400 mt-4">
        Any actions you take offline will sync automatically when you reconnect.
      </p>
    </div>
  )
}
