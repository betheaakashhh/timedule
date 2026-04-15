'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, CheckCircle, Loader2, Plus,
  LayoutGrid, List, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { IntervalFormModal } from '@/components/schedule/IntervalFormModal'
import { TimelineEditor } from '@/components/schedule/TimelineEditor'
import { IntervalListItem } from '@/components/schedule/IntervalListItem'
import toast from 'react-hot-toast'
import type { Interval, IntervalTag } from '@timeflow/types'

const DAYS = [
  { label: 'Su', value: 0 }, { label: 'Mo', value: 1 },
  { label: 'Tu', value: 2 }, { label: 'We', value: 3 },
  { label: 'Th', value: 4 }, { label: 'Fr', value: 5 },
  { label: 'Sa', value: 6 },
]

export function TimetableEditClient({
  initialTimetable,
  availableTags,
}: {
  initialTimetable: any
  availableTags: IntervalTag[]
}) {
  const router = useRouter()
  const [name, setName] = useState(initialTimetable.name)
  const [repeatDays, setRepeatDays] = useState<number[]>(initialTimetable.repeatDays)
  const [intervals, setIntervals] = useState<Interval[]>(initialTimetable.intervals)
  const [tags, setTags] = useState<IntervalTag[]>(availableTags)
  const [view, setView] = useState<'timeline' | 'list'>('list')
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingInterval, setEditingInterval] = useState<Interval | null>(null)
  const [addDefaults, setAddDefaults] = useState<{ startTime: string; endTime: string } | null>(null)

  function toggleDay(d: number) {
    setRepeatDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    )
  }

  async function handleCreateTag(tagName: string): Promise<IntervalTag> {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tagName }),
    })
    const data = await res.json()
    setTags((prev) => [...prev, data.tag])
    return data.tag
  }

  async function handleSaveInterval(data: any) {
    if (editingInterval) {
      const res = await fetch(`/api/intervals/${editingInterval.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      setIntervals((prev) => prev.map((iv) =>
        iv.id === editingInterval.id ? { ...json.interval, checklistItems: iv.checklistItems } : iv
      ))
      toast.success('Updated')
    } else {
      const res = await fetch('/api/intervals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetableId: initialTimetable.id,
          ...data,
          sortOrder: intervals.length,
          checklistItems: data.checklistItems.filter((i: any) => i.label.trim()),
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      setIntervals((prev) => [...prev, json.interval])
      toast.success('Interval added')
    }
  }

  async function handleDeleteInterval(id: string) {
    if (!confirm('Delete this interval?')) return
    await fetch(`/api/intervals/${id}`, { method: 'DELETE' })
    setIntervals((prev) => prev.filter((iv) => iv.id !== id))
    toast.success('Removed')
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/timetables/${initialTimetable.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, repeatDays }),
      })
      toast.success('Saved')
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate() {
    setActivating(true)
    try {
      await fetch(`/api/timetables/${initialTimetable.id}/activate`, { method: 'POST' })
      toast.success('Schedule activated!')
      router.push('/schedule')
    } finally {
      setActivating(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/timetables/${initialTimetable.id}`, { method: 'DELETE' })
    toast.success('Deleted')
    router.push('/schedule')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/schedule" className="btn-ghost p-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white flex-1 min-w-0"
        />
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={handleDelete} disabled={deleting} className="btn-ghost text-sm flex items-center gap-1.5 text-red-500 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-secondary flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
          {!initialTimetable.isActive && (
            <button onClick={handleActivate} disabled={activating} className="btn-primary flex items-center gap-2 text-sm">
              {activating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Activate
            </button>
          )}
          {initialTimetable.isActive && (
            <span className="flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400 font-medium">
              <CheckCircle className="w-4 h-4" /> Active
            </span>
          )}
        </div>
      </div>

      {/* Days */}
      <div className="card p-4">
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Repeat on</p>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map((d) => (
            <button
              key={d.value}
              onClick={() => toggleDay(d.value)}
              className={cn(
                'w-9 h-9 rounded-xl text-sm font-medium transition-colors',
                repeatDays.includes(d.value)
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* View + add */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(['timeline', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                view === v ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
              )}
            >
              {v === 'timeline' ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
              {v}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditingInterval(null); setAddDefaults(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add interval
        </button>
      </div>

      {/* Content */}
      {view === 'timeline' ? (
        <div style={{ minHeight: 600 }}>
          <TimelineEditor
            intervals={intervals}
            onAdd={(s, e) => { setEditingInterval(null); setAddDefaults({ startTime: s, endTime: e }); setModalOpen(true) }}
            onEdit={(iv) => { setEditingInterval(iv); setModalOpen(true) }}
            onDelete={handleDeleteInterval}
            onReorder={async (orders) => {
              await fetch('/api/intervals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orders }) })
            }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {intervals.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((iv) => (
            <IntervalListItem
              key={iv.id}
              interval={iv}
              onEdit={() => { setEditingInterval(iv); setModalOpen(true) }}
              onDelete={() => handleDeleteInterval(iv.id)}
            />
          ))}
        </div>
      )}

      <IntervalFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveInterval}
        tags={tags}
        onCreateTag={handleCreateTag}
        editMode={!!editingInterval}
        initialData={editingInterval ? {
          label: editingInterval.label,
          startTime: editingInterval.startTime,
          endTime: editingInterval.endTime,
          tagId: editingInterval.tagId,
          tag: editingInterval.tag as IntervalTag ?? null,
          isStrict: editingInterval.isStrict,
          strictMode: editingInterval.strictMode as any,
          graceMinutes: editingInterval.graceMinutes,
          autoComplete: editingInterval.autoComplete,
          requiresUserAction: editingInterval.requiresUserAction,
          emailRemind: editingInterval.emailRemind,
          checklistItems: (editingInterval.checklistItems ?? []).map((c) => ({ label: c.label, isBlocking: c.isBlocking })),
        } : addDefaults ? { startTime: addDefaults.startTime, endTime: addDefaults.endTime } : undefined}
      />
    </div>
  )
}
