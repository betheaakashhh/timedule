'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Flame, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Home',     icon: LayoutDashboard },
  { href: '/schedule',  label: 'Schedule', icon: Calendar },
  { href: '/streak',    label: 'Streak',   icon: Flame },
  { href: '/settings',  label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40
                 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg
                 border-t border-gray-100 dark:border-gray-800
                 safe-area-pb"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-14">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 h-full',
                'transition-colors active:scale-95',
                active
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform', active && 'scale-110')} />
              <span className={cn(
                'text-[10px] font-medium leading-none',
                active ? 'opacity-100' : 'opacity-70'
              )}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-brand-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
