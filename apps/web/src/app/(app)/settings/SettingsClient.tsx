'use client'

import { useState } from 'react'
import {
  User, Clock, Bell, Palette, Tag, Trash2, Plus,
  Check, Loader2, Moon, Sun, AlertCircle, Mail,
  Globe, Lock
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useUserStore } from '@/lib/stores/user.store'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { IntervalTag } from '@timeflow/types'

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
  'America/Chicago', 'Australia/Sydney', 'Pacific/Auckland',
]

const LUCIDE_TAG_ICONS = [
  'Circle', 'Star', 'Heart', 'Zap', 'Target', 'Flame', 'Globe',
  'Home', 'Music', 'Camera', 'Code', 'BookOpen', 'Coffee', 'Dumbbell',
  'Bike', 'Car', 'Plane', 'Phone', 'Laptop', 'Palette',
]

const TAG_COLORS = [
  '#7F77DD', '#1D9E75', '#E24B4A', '#EF9F27', '#378ADD',
  '#639922', '#D4537E', '#534AB7', '#0F6E56', '#BA7517',
]

function TagIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Circle
  return <Icon className="w-4 h-4" />
}

interface SettingsClientProps {
  initialProfile: any
  customTags: IntervalTag[]
}

const SECTIONS = [
  { key: 'profile',       label: 'Profile',          icon: User },
  { key: 'preferences',   label: 'Preferences',      icon: Globe },
  { key: 'notifications', label: 'Notifications',    icon: Bell },
  { key: 'tags',          label: 'Custom tags',      icon: Tag },
  { key: 'account',       label: 'Account',          icon: Lock },
]

export function SettingsClient({ initialProfile, customTags: initialTags }: SettingsClientProps) {
  const { setTheme, theme } = useUserStore()
  const [section, setSection] = useState('profile')
  const [saving, setSaving] = useState(false)

  // Profile
  const [name, setName] = useState(initialProfile.name)
  const [email] = useState(initialProfile.email)

  // Preferences
  const [timezone, setTimezone] = useState(initialProfile.timezone)
  const [wakeTime, setWakeTime] = useState(initialProfile.wakeTime)

  // Notifications
  const [emailReminders, setEmailReminders] = useState(initialProfile.emailReminders)

  // Tags
  const [tags, setTags] = useState<IntervalTag[]>(initialTags)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [newTagIcon, setNewTagIcon] = useState('Circle')
  const [addingTag, setAddingTag] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)

  async function save(updates: Record<string, any>) {
    setSaving(true)
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTag() {
    if (!newTagName.trim()) return
    setAddingTag(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor, icon: newTagIcon }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTags((prev) => [...prev, data.tag])
      setNewTagName('')
      setShowNewTag(false)
      toast.success('Tag created')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAddingTag(false)
    }
  }

  async function handleDeleteTag(id: string) {
    if (!confirm('Delete this tag? Intervals using it will lose the tag.')) return
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    setTags((prev) => prev.filter((t) => t.id !== id))
    toast.success('Tag deleted')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-0 animate-fade-in">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* Sidebar nav */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:w-44 flex-shrink-0">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                section === key
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {/* ── Profile ── */}
          {section === 'profile' && (
            <div className="card p-6 space-y-5">
              <div className="flex items-center gap-4">
                <Avatar name={name} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                  <p className="text-sm text-gray-400">{email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Display name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email address
                </label>
                <input value={email} disabled className="input opacity-60 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Use Supabase auth settings.</p>
              </div>

              <button
                onClick={() => save({ name })}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save profile
              </button>
            </div>
          )}

          {/* ── Preferences ── */}
          {section === 'preferences' && (
            <div className="card p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">All interval times and streak resets use this timezone.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Wake time
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">The wake-up greeting card shows within 2 hours of this time.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="flex gap-3">
                  {(['light', 'dark'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTheme(t)
                        save({ theme: t })
                      }}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                        theme === t
                          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                      )}
                    >
                      {t === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => save({ timezone, wakeTime })}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save preferences
              </button>
            </div>
          )}

          {/* ── Notifications ── */}
          {section === 'notifications' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email reminders</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Send email when strict tasks start. Also sends streak warnings.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEmailReminders(!emailReminders)
                    save({ emailReminders: !emailReminders })
                  }}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                    emailReminders ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                    emailReminders && 'translate-x-5'
                  )} />
                </button>
              </div>

              {emailReminders && (
                <div className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Emails enabled</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      You'll receive emails for: strict task reminders, streak warnings, streak milestones.
                      Individual intervals can override this in the schedule builder.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Email types</p>
                {[
                  { label: 'Strict task reminder', desc: 'Sent when a strict interval starts', always: false },
                  { label: 'Streak warning', desc: 'Sent at 11:55 PM if strict tasks incomplete', always: true },
                  { label: 'Streak milestone', desc: '3, 7, 14, 30, 60, 100 day achievements', always: true },
                  { label: 'Academic class reminder', desc: 'Sent 5 min before a new period starts', always: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      emailReminders ? 'bg-teal-400' : 'bg-gray-200'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    {item.always && (
                      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">always on</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Custom Tags ── */}
          {section === 'tags' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Your custom tags</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tags.length} custom tag{tags.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setShowNewTag(!showNewTag)} className="btn-primary flex items-center gap-1.5 text-sm">
                  <Plus className="w-3.5 h-3.5" /> New tag
                </button>
              </div>

              {/* New tag form */}
              {showNewTag && (
                <div className="border border-brand-200 dark:border-brand-800 rounded-xl p-4 space-y-3 bg-brand-50/50 dark:bg-brand-900/10">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">New tag</p>
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name..."
                    className="input"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Color</p>
                    <div className="flex gap-2 flex-wrap">
                      {TAG_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewTagColor(c)}
                          className={cn(
                            'w-7 h-7 rounded-full transition-transform',
                            newTagColor === c && 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Icon</p>
                    <div className="flex gap-2 flex-wrap">
                      {LUCIDE_TAG_ICONS.map((ic) => (
                        <button
                          key={ic}
                          onClick={() => setNewTagIcon(ic)}
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                            newTagIcon === ic
                              ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                          )}
                        >
                          <TagIcon name={ic} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span
                      className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: newTagColor + '22', color: newTagColor }}
                    >
                      <TagIcon name={newTagIcon} />
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {newTagName || 'Preview'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleAddTag} disabled={addingTag || !newTagName.trim()} className="btn-primary flex-1 text-sm">
                      {addingTag ? 'Creating...' : 'Create tag'}
                    </button>
                    <button onClick={() => setShowNewTag(false)} className="btn-secondary text-sm px-4">Cancel</button>
                  </div>
                </div>
              )}

              {/* Tags list */}
              {tags.length === 0 && !showNewTag && (
                <p className="text-sm text-gray-400 text-center py-6">No custom tags yet. Create one above.</p>
              )}
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: tag.color + '22', color: tag.color }}
                  >
                    <TagIcon name={tag.icon} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tag.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      {tag.defaultStrict && (
                        <span className="text-xs text-amber-500">Strict default</span>
                      )}
                      {tag.emailRemind && (
                        <span className="text-xs text-blue-500">Email</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="btn-ghost p-2 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Account / Danger zone ── */}
          {section === 'account' && (
            <div className="space-y-4">
              <div className="card p-6 space-y-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Account info</p>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>Email: <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span></p>
                  <p>Member since: <span className="font-medium text-gray-700 dark:text-gray-300">
                    {new Date(initialProfile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span></p>
                  <p>Streak count: <span className="font-medium text-amber-500">{initialProfile.streakCount} days</span></p>
                </div>
              </div>

              <div className="card p-6 space-y-4 border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm font-semibold">Danger zone</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-red-100 dark:border-red-900/30 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reset streak</p>
                      <p className="text-xs text-gray-400">Sets streak count back to 0</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm('Reset your streak to 0? This cannot be undone.')) return
                        await save({ streakCount: 0 } as any)
                        toast('Streak reset to 0', { icon: '🔄' })
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-red-100 dark:border-red-900/30 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sign out</p>
                      <p className="text-xs text-gray-400">Sign out of this device</p>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' })
                        window.location.href = '/auth/login'
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
