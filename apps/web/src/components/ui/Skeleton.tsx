import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg',
        className
      )}
    />
  )
}

export function SkeletonCard({ lines = 3 }: SkeletonProps) {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2 items-end flex flex-col">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Active card */}
      <div className="card p-5">
        <div className="flex gap-4">
          <Skeleton className="w-22 h-22 rounded-full flex-shrink-0" style={{ width: 88, height: 88 }} />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-20 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-4">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Timeline */}
      <div className="card p-4">
        <Skeleton className="h-4 w-28 mb-4" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 mb-4">
            <Skeleton className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
