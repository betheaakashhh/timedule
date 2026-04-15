'use client'
import { useState } from 'react'
import { Search, Plus, X, Check } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IntervalTag } from '@timeflow/types'

interface TagPickerProps {
  tags: IntervalTag[]
  selected: IntervalTag | null
  onSelect: (tag: IntervalTag) => void
  onCreateTag?: (name: string) => Promise<IntervalTag>
}

function TagIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.Circle
  return <Icon className={className ?? 'w-4 h-4'} />
}

export function TagPicker({ tags, selected, onSelect, onCreateTag }: TagPickerProps) {
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  const systemTags = filtered.filter((t) => t.isSystem)
  const customTags  = filtered.filter((t) => !t.isSystem)

  async function handleCreate() {
    if (!newName.trim() || !onCreateTag) return
    setCreating(true)
    try {
      const tag = await onCreateTag(newName.trim())
      onSelect(tag)
      setNewName('')
      setShowCreate(false)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tags..."
          className="input pl-8 py-2 text-sm"
        />
      </div>

      {/* Tag grid */}
      <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
        {systemTags.length > 0 && (
          <p className="text-xs text-gray-400 uppercase tracking-wide px-1 mb-1">System</p>
        )}
        {systemTags.map((tag) => (
          <TagRow key={tag.id} tag={tag} selected={selected?.id === tag.id} onSelect={onSelect} />
        ))}

        {customTags.length > 0 && (
          <p className="text-xs text-gray-400 uppercase tracking-wide px-1 mt-2 mb-1">Custom</p>
        )}
        {customTags.map((tag) => (
          <TagRow key={tag.id} tag={tag} selected={selected?.id === tag.id} onSelect={onSelect} />
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No tags found</p>
        )}
      </div>

      {/* Create custom tag */}
      {onCreateTag && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
          {showCreate ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Tag name..."
                className="input py-1.5 text-sm flex-1"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="btn-primary py-1.5 px-3 text-sm"
              >
                {creating ? '...' : 'Add'}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create custom tag
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TagRow({ tag, selected, onSelect }: { tag: IntervalTag; selected: boolean; onSelect: (t: IntervalTag) => void }) {
  return (
    <button
      onClick={() => onSelect(tag)}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
        selected
          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      )}
    >
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: tag.color + '22', color: tag.color }}
      >
        <TagIcon name={tag.icon} className="w-3.5 h-3.5" />
      </span>
      <span className="flex-1 font-medium truncate">{tag.name}</span>
      {tag.defaultStrict && (
        <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
          Strict
        </span>
      )}
      {selected && <Check className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
    </button>
  )
}
