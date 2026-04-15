import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 text-center">
      <div className="mb-6">
        <p className="text-8xl font-black text-brand-100 dark:text-brand-900 select-none">404</p>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard" className="btn-primary flex items-center gap-2">
          <Home className="w-4 h-4" />
          Go home
        </Link>
        <Link href="/schedule" className="btn-secondary flex items-center gap-2">
          <Search className="w-4 h-4" />
          Schedule
        </Link>
      </div>
    </div>
  )
}
