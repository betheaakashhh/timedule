'use client'

import { useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeableIntervalCardProps {
  children: ReactNode
  onSwipeRight?: () => void   // complete
  onSwipeLeft?: () => void    // skip
  disabled?: boolean
  className?: string
}

const SWIPE_THRESHOLD = 80   // px to trigger action
const MAX_SWIPE = 120         // px max visible travel

export function SwipeableIntervalCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  disabled = false,
  className,
}: SwipeableIntervalCardProps) {
  const startXRef = useRef<number>(0)
  const currentXRef = useRef<number>(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const [translateX, setTranslateX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [triggered, setTriggered] = useState<'left' | 'right' | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    if (disabled) return
    startXRef.current = e.touches[0].clientX
    setSwiping(true)
    setTriggered(null)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!swiping || disabled) return
    const deltaX = e.touches[0].clientX - startXRef.current
    currentXRef.current = deltaX
    const clamped = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX))
    setTranslateX(clamped)

    if (deltaX > SWIPE_THRESHOLD) setTriggered('right')
    else if (deltaX < -SWIPE_THRESHOLD) setTriggered('left')
    else setTriggered(null)
  }

  function onTouchEnd() {
    setSwiping(false)
    const delta = currentXRef.current

    if (delta > SWIPE_THRESHOLD && onSwipeRight) {
      // Animate off-screen then trigger
      setTranslateX(MAX_SWIPE * 1.5)
      setTimeout(() => {
        setTranslateX(0)
        setTriggered(null)
        onSwipeRight()
      }, 200)
    } else if (delta < -SWIPE_THRESHOLD && onSwipeLeft) {
      setTranslateX(-MAX_SWIPE * 1.5)
      setTimeout(() => {
        setTranslateX(0)
        setTriggered(null)
        onSwipeLeft()
      }, 200)
    } else {
      setTranslateX(0)
      setTriggered(null)
    }

    currentXRef.current = 0
  }

  const swipeRightOpacity = Math.min(1, Math.max(0, translateX / SWIPE_THRESHOLD))
  const swipeLeftOpacity  = Math.min(1, Math.max(0, -translateX / SWIPE_THRESHOLD))

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Right action (complete) */}
      {onSwipeRight && (
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-start pl-5 bg-teal-500 rounded-2xl"
          style={{ opacity: swipeRightOpacity, width: '100%' }}
          aria-hidden
        >
          <CheckCircle2 className="w-6 h-6 text-white" />
          <span className="ml-2 text-white font-semibold text-sm">Complete</span>
        </div>
      )}

      {/* Left action (skip) */}
      {onSwipeLeft && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-5 bg-gray-400 dark:bg-gray-600 rounded-2xl"
          style={{ opacity: swipeLeftOpacity, width: '100%' }}
          aria-hidden
        >
          <span className="mr-2 text-white font-semibold text-sm">Skip</span>
          <SkipForward className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Card */}
      <div
        ref={cardRef}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative z-10 touch-pan-y"
      >
        {children}
      </div>
    </div>
  )
}
