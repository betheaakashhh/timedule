'use client'
import { useState, useEffect } from 'react'
import {
  X, Clock, Shield, Bell, List, Plus, Trash2,
  AlertTriangle, Lock, Timer
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import { TagPicker } from './TagPicker'
import type { IntervalTag, ChecklistItem, StrictMode } from '@timeflow/types'

function TagIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Circle
  return <Icon className={className ?? 'w-4 h-4'} />
}

interface IntervalFormData {
  label: string
  startTime: string
  endTime: string
  tagId: string
  tag: IntervalTag | null
  isStrict: boolean
  strictMode: StrictMode
  graceMinutes: number
  autoComplete: boolean
  requiresUserAction: boolean
  emailRemind: boolean
  checklistItems: { label: string; isBlocking: boolean }[]
}

interface IntervalFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: IntervalFormData) => Promise<void>
  tags: IntervalTag[]
  onCreateTag: (name: string) => Promise<IntervalTag>
  initialData?: Partial<IntervalFormData>
  editMode?: boolean
}

const STRICT_MODES: { value: StrictMode; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: 'hard',
    label: 'Hard lock',
    desc: 'Next tasks blocked until complete',
    icon: <Lock className="w-4 h-4" />,
  },
  {
    value: 'warn',
    label: 'Warn + break streak',
    desc: 'Can skip but streak breaks',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    value: 'grace',
    label: 'Grace period',
    desc: 'Extra time before it counts as missed',
    icon: <Timer className="w-4 h-4" />,
  },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function IntervalFormModal({
  open, onClose, onSave, tags, onCreateTag, initialData, editMode,
}: IntervalFormModalProps) {
  const [tab, setTab] = useState<'basic' | 'strict' | 'checklist' | 'notify'>('basic')
  const [saving, setSaving] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)

  const [form, setForm] = useState<IntervalFormData>({
    label: '',
    startTime: '09:00',
    endTime: '10:00',
    tagId: '',
    tag: null,
    isStrict: false,
    strictMode: 'warn',
    graceMinutes: 15,
    autoComplete: false,
    requiresUserAction: true,
    emailRemind: false,
    checklistItems: [],
  })

  useEffect(() => {
    if (initialData) {
      setForm((f) => ({ ...f, ...initialData }))
    }
    setTab('basic')
    setShowTagPicker(false)
  }, [open]) // eslint-disable-line

  function set<K extends keyof IntervalFormData>(key: K, value: IntervalFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function selectTag(tag: IntervalTag) {
    setForm((f) => ({
      ...f,
      tagId: tag.id,
      tag,
      isStrict: tag.defaultStrict || f.isStrict,
      strictMode: tag.defaultStrict ? tag.defaultStrictMode : f.strictMode,
      emailRemind: tag.emailRemind || f.emailRemind,
    }))
    setShowTagPicker(false)
  }

  function addChecklist() {
    set('checklistItems', [...form.checklistItems, { label: '', isBlocking: false }])
  }

  function updateChecklist(i: number, key: 'label' | 'isBlocking', val: any) {
    const items = [...form.checklistItems]
    items[i] = { ...items[i], [key]: val }
    set('checklistItems', items)
  }

  function removeChecklist(i: number) {
    set('checklistItems', form.checklistItems.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!form.tagId) return
    if (form.startTime >= form.endTime) return
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const TABS = [
    { key: 'basic',     label: 'Basics',    icon: Clock },
    { key: 'strict',    label: 'Strict',    icon: Shield },
    { key: 'checklist', label: 'Checklist', icon: List },
    { key: 'notify',    label: 'Notify',    icon: Bell },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full md:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
            {editMode ? 'Edit interval' : 'Add interval'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                tab === key
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── Basics tab ── */}
          {tab === 'basic' && (
            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Label
                </label>
                <input
                  value={form.label}
                  onChange={(e) => set('label', e.target.value)}
                  placeholder="e.g. Morning workout"
                  className="input"
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Start time
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set('startTime', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    End time
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set('endTime', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              {form.startTime >= form.endTime && (
                <p className="text-xs text-red-500">End time must be after start time</p>
              )}

              {/* Tag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category tag
                </label>
                {form.tag ? (
                  <button
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-400 transition-colors"
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: form.tag.color + '22', color: form.tag.color }}
                    >
                      <TagIcon name={form.tag.icon} className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 text-left">
                      {form.tag.name}
                    </span>
                    <span className="text-xs text-gray-400">Change</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-400 transition-colors text-sm text-gray-400"
                  >
                    <Plus className="w-4 h-4" />
                    Select a tag
                  </button>
                )}
                {showTagPicker && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <TagPicker
                      tags={tags}
                      selected={form.tag}
                      onSelect={selectTag}
                      onCreateTag={onCreateTag}
                    />
                  </div>
                )}
              </div>

              {/* Auto-complete toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-complete</p>
                  <p className="text-xs text-gray-400 mt-0.5">Marks done automatically when time passes (basic routines)</p>
                </div>
                <Toggle
                  checked={form.autoComplete}
                  onChange={(v) => {
                    set('autoComplete', v)
                    if (v) { set('requiresUserAction', false); set('isStrict', false) }
                    else set('requiresUserAction', true)
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Strict tab ── */}
          {tab === 'strict' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Strict mode</p>
                  <p className="text-xs text-gray-400 mt-0.5">Enforce completion or consequences apply</p>
                </div>
                <Toggle
                  checked={form.isStrict}
                  onChange={(v) => set('isStrict', v)}
                  disabled={form.autoComplete}
                />
              </div>

              {form.isStrict && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Enforcement type</p>
                    {STRICT_MODES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => set('strictMode', m.value)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
                          form.strictMode === m.value
                            ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        )}
                      >
                        <span className={cn(
                          'mt-0.5 flex-shrink-0',
                          form.strictMode === m.value ? 'text-brand-600' : 'text-gray-400'
                        )}>
                          {m.icon}
                        </span>
                        <div>
                          <p className={cn(
                            'text-sm font-medium',
                            form.strictMode === m.value
                              ? 'text-brand-700 dark:text-brand-300'
                              : 'text-gray-700 dark:text-gray-300'
                          )}>
                            {m.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {form.strictMode === 'grace' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Grace period — {form.graceMinutes} minutes
                      </label>
                      <input
                        type="range"
                        min={5} max={60} step={5}
                        value={form.graceMinutes}
                        onChange={(e) => set('graceMinutes', Number(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>5 min</span><span>60 min</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {form.autoComplete && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Auto-complete intervals cannot be strict — they don't affect stats.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Checklist tab ── */}
          {tab === 'checklist' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Checklist items appear when this interval is active. Blocking items must be checked before the interval can be marked complete.
              </p>

              {form.checklistItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={item.label}
                    onChange={(e) => updateChecklist(i, 'label', e.target.value)}
                    placeholder={`Item ${i + 1}`}
                    className="input flex-1 py-2 text-sm"
                  />
                  <button
                    onClick={() => updateChecklist(i, 'isBlocking', !item.isBlocking)}
                    className={cn(
                      'p-2 rounded-lg border text-xs font-medium transition-colors flex-shrink-0',
                      item.isBlocking
                        ? 'border-red-300 bg-red-50 text-red-600 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'
                    )}
                    title={item.isBlocking ? 'Blocking (required)' : 'Optional'}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeChecklist(i)} className="btn-ghost p-2">
                    <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              ))}

              <button
                onClick={addChecklist}
                className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add checklist item
              </button>

              {form.checklistItems.some((i) => i.isBlocking) && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl mt-2">
                  <Lock className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Items marked with a lock icon must be checked before this interval can be completed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Notify tab ── */}
          {tab === 'notify' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email reminder</p>
                  <p className="text-xs text-gray-400 mt-0.5">Send an email when this interval starts</p>
                </div>
                <Toggle
                  checked={form.emailRemind}
                  onChange={(v) => set('emailRemind', v)}
                />
              </div>

              {form.emailRemind && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <Bell className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    You'll receive an email at the start time of this interval. Make sure your email is set in Settings.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.tagId || form.startTime >= form.endTime}
            className="btn-primary flex-1"
          >
            {saving ? 'Saving...' : editMode ? 'Update' : 'Add interval'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
        checked ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
        checked && 'translate-x-5'
      )} />
    </button>
  )
}
