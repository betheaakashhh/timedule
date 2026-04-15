import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        SIZE[size],
        'rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center',
        'font-semibold text-brand-600 dark:text-brand-200 select-none',
        className
      )}
    >
      {initials}
    </div>
  )
}
