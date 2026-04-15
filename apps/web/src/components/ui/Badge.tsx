import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  success: 'bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300',
  warning: 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300',
  danger:  'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300',
  info:    'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300',
  brand:   'bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-200',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
