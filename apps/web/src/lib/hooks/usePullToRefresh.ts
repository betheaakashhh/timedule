'use client'

import { useRef, useCallback, useEffect } from 'react'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number   // px to trigger refresh
  disabled?: boolean
}

export function usePullToRefresh({
  onRefresh,
  threshold = 72,
  disabled = false,
}: PullToRefreshOptions) {
  const startYRef    = useRef<number>(0)
  const pullingRef   = useRef(false)
  const refreshingRef = useRef(false)
  const indicatorRef = useRef<HTMLDivElement | null>(null)

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || refreshingRef.current) return
    if (window.scrollY > 0) return  // Only trigger when at top
    startYRef.current = e.touches[0].clientY
    pullingRef.current = true
  }, [disabled])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current || refreshingRef.current) return
    const deltaY = e.touches[0].clientY - startYRef.current
    if (deltaY <= 0) { pullingRef.current = false; return }

    // Rubber-band effect
    const resistance = 0.4
    const travel = Math.min(deltaY * resistance, threshold * 1.5)

    if (indicatorRef.current) {
      indicatorRef.current.style.transform = `translateY(${travel}px)`
      indicatorRef.current.style.opacity = String(Math.min(1, travel / threshold))
    }

    if (deltaY > threshold / resistance) {
      e.preventDefault()  // prevent scroll while pulling
    }
  }, [threshold])

  const onTouchEnd = useCallback(async (e: TouchEvent) => {
    if (!pullingRef.current || refreshingRef.current) return
    pullingRef.current = false

    const deltaY = e.changedTouches[0].clientY - startYRef.current
    const travel = deltaY * 0.4

    if (travel >= threshold) {
      refreshingRef.current = true
      if (indicatorRef.current) {
        indicatorRef.current.style.transform = `translateY(${threshold}px)`
      }
      try {
        await onRefresh()
      } finally {
        refreshingRef.current = false
      }
    }

    if (indicatorRef.current) {
      indicatorRef.current.style.transform = 'translateY(0)'
      indicatorRef.current.style.opacity = '0'
    }
  }, [onRefresh, threshold])

  useEffect(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd])

  return { indicatorRef }
}
