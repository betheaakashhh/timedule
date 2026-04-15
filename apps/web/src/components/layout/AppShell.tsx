'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Calendar, Flame, Settings,
  Timer, LogOut, ChevronRight,
} from 'lucide-react'
import { ThemeToggle, Avatar } from '@/components/ui'
import { useUserStore } from '@/lib/stores/user.store'
import { useSocket } from '@/lib/hooks/useSocket'
import { MobileNav } from '@/components/mobile/MobileNav'
import { cn } from '@/lib/utils'
import { Toaster } from 'react-hot-toast'
import type { UserProfile } from '@timeflow/types'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schedule',  label: 'Schedule',  icon: Calendar },
  { href: '/streak',    label: 'Streak',     icon: Flame },
  { href: '/settings',  label: 'Settings',   icon: Settings },
]

interface AppShellProps {
  children: React.ReactNode
  initialUser: UserProfile
}

export function AppShell({ children, initialUser }: AppShellProps) {
  const pathname = usePathname()
  const { setUser, user, theme } = useUserStore()
  useSocket(user?.id ?? null)

  useEffect(() => {
    setUser(initialUser)
  }, []) // eslint-disable-line

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/auth/login'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white text-sm shadow-lg',
          duration: 4000,
          style: { borderRadius: '12px' },
        }}
      />

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 fixed top-0 left-0 bottom-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
            <Timer className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white tracking-tight">TimeFlow</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  'group relative',
                  active
                    ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <Icon className={cn(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  active && 'text-brand-600 dark:text-brand-400'
                )} />
                {label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-brand-400" />}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Avatar name={user?.name ?? 'U'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-snug">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="btn-ghost text-sm flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Timer className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">TimeFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Avatar name={user?.name ?? 'U'} size="sm" />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <MobileNav />
    </div>
  )
}
