'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Timetable, Interval, IntervalTag } from '@timeflow/types'

export function useTimetables() {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.fetch('/api/timetables')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTimetables(data.timetables)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createTimetable = async (payload: { name: string; repeatDays: number[] }) => {
    const res = await window.fetch('/api/timetables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, validFrom: new Date().toISOString() }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setTimetables((prev) => [data.timetable, ...prev])
    return data.timetable as Timetable
  }

  const updateTimetable = async (id: string, payload: Partial<Timetable>) => {
    const res = await window.fetch(`/api/timetables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    await fetch()
  }

  const deleteTimetable = async (id: string) => {
    await window.fetch(`/api/timetables/${id}`, { method: 'DELETE' })
    setTimetables((prev) => prev.filter((t) => t.id !== id))
  }

  const activateTimetable = async (id: string) => {
    await updateTimetable(id, { isActive: true } as any)
  }

  return { timetables, loading, error, refetch: fetch, createTimetable, updateTimetable, deleteTimetable, activateTimetable }
}

export function useTags() {
  const [tags, setTags] = useState<IntervalTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.fetch('/api/tags')
      .then((r) => r.json())
      .then((d) => setTags(d.tags ?? []))
      .finally(() => setLoading(false))
  }, [])

  const createTag = async (payload: Partial<IntervalTag>) => {
    const res = await window.fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setTags((prev) => [...prev, data.tag])
    return data.tag as IntervalTag
  }

  return { tags, loading, createTag }
}
