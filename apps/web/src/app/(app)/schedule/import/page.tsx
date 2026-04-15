'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Upload, FileText, CheckCircle, Loader2,
  Pencil, Trash2, Plus, Save, GraduationCap, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface ParsedPeriod {
  subject: string
  room: string
  teacher: string
  dayOfWeek: number
  periodStart: string
  periodEnd: string
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState('')
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedPeriod[] | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Which interval to save to
  const [intervalId, setIntervalId] = useState('')

  async function handleParse() {
    if (inputMode === 'file' && !file) { toast.error('Select a file first'); return }
    if (inputMode === 'text' && !rawText.trim()) { toast.error('Paste timetable text first'); return }

    setParsing(true)
    try {
      const form = new FormData()
      if (inputMode === 'file' && file) {
        form.append('file', file)
      } else {
        form.append('text', rawText)
      }

      const res = await fetch('/api/academic/parse', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)
      if (data.periods.length === 0) {
        toast('No periods found — try a clearer image or text format', { icon: '⚠️' })
      } else {
        setParsed(data.periods)
        toast.success(`Found ${data.periods.length} class periods`)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setParsing(false)
    }
  }

  function updatePeriod(idx: number, key: keyof ParsedPeriod, value: any) {
    if (!parsed) return
    const updated = [...parsed]
    updated[idx] = { ...updated[idx], [key]: value }
    setParsed(updated)
  }

  function removePeriod(idx: number) {
    if (!parsed) return
    setParsed(parsed.filter((_, i) => i !== idx))
  }

  function addPeriod() {
    const blank: ParsedPeriod = {
      subject: '',
      room: '',
      teacher: '',
      dayOfWeek: 1,
      periodStart: '09:00',
      periodEnd: '10:00',
    }
    setParsed((prev) => [...(prev ?? []), blank])
    setEditingIdx((parsed?.length ?? 0))
  }

  async function handleSave() {
    if (!parsed?.length) { toast.error('No periods to save'); return }
    if (!intervalId) { toast.error('Enter an interval ID'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalId, periods: parsed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Saved ${data.count} periods to schedule`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Group parsed periods by day
  const byDay = parsed
    ? DAY_NAMES.map((name, idx) => ({
        name,
        idx,
        periods: parsed
          .map((p, i) => ({ ...p, originalIdx: i }))
          .filter((p) => p.dayOfWeek === idx)
          .sort((a, b) => a.periodStart.localeCompare(b.periodStart)),
      })).filter((d) => d.periods.length > 0)
    : []

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/schedule" className="btn-ghost p-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Import timetable</h1>
          <p className="text-sm text-gray-400 mt-0.5">AI-powered extraction from any format</p>
        </div>
      </div>

      {/* Input section */}
      {!parsed && (
        <div className="card p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            {(['file', 'text'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setInputMode(m)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                  inputMode === m
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500'
                )}
              >
                {m === 'file' ? 'Upload file' : 'Paste text'}
              </button>
            ))}
          </div>

          {inputMode === 'file' ? (
            <div
              className={cn(
                'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors',
                file
                  ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
              )}
              onClick={() => document.getElementById('file-inp')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) setFile(f)
              }}
            >
              <input
                id="file-inp"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-6 h-6 text-brand-500" />
                  <div className="text-left">
                    <p className="font-medium text-brand-700 dark:text-brand-300">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown type'}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drop file or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, CSV, XLSX, TXT</p>
                </>
              )}
            </div>
          ) : (
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your timetable here — any format works. Tables, plain text, schedule grids..."
              className="input resize-none h-48 font-mono text-xs"
            />
          )}

          <div className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <GraduationCap className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Powered by Claude AI — extracts subjects, times, rooms, and teachers automatically from any format.
            </p>
          </div>

          <button
            onClick={handleParse}
            disabled={parsing || (inputMode === 'file' ? !file : !rawText.trim())}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {parsing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Parsing with AI...</>
            ) : (
              <><GraduationCap className="w-4 h-4" /> Parse timetable</>
            )}
          </button>
        </div>
      )}

      {/* Parsed results */}
      {parsed && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {parsed.length} period{parsed.length !== 1 ? 's' : ''} extracted
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Review and edit before saving</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setParsed(null)} className="btn-secondary text-sm">Re-parse</button>
              <button onClick={addPeriod} className="btn-ghost text-sm flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Day-grouped periods */}
          {byDay.map((day) => (
            <div key={day.idx} className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{day.name}</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {day.periods.map((period) => {
                  const idx = period.originalIdx
                  const isEditing = editingIdx === idx

                  return (
                    <div key={idx} className="p-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Subject</label>
                              <input
                                value={period.subject}
                                onChange={(e) => updatePeriod(idx, 'subject', e.target.value)}
                                className="input text-sm py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Room</label>
                              <input
                                value={period.room}
                                onChange={(e) => updatePeriod(idx, 'room', e.target.value)}
                                className="input text-sm py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Start</label>
                              <input
                                type="time"
                                value={period.periodStart}
                                onChange={(e) => updatePeriod(idx, 'periodStart', e.target.value)}
                                className="input text-sm py-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">End</label>
                              <input
                                type="time"
                                value={period.periodEnd}
                                onChange={(e) => updatePeriod(idx, 'periodEnd', e.target.value)}
                                className="input text-sm py-1.5"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Day</label>
                            <select
                              value={period.dayOfWeek}
                              onChange={(e) => updatePeriod(idx, 'dayOfWeek', Number(e.target.value))}
                              className="input text-sm py-1.5"
                            >
                              {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                          </div>
                          <button onClick={() => setEditingIdx(null)} className="btn-primary text-sm py-1.5 w-full">
                            Done editing
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{period.subject}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {period.periodStart} – {period.periodEnd}
                              {period.room && ` · Room ${period.room}`}
                              {period.teacher && ` · ${period.teacher}`}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingIdx(idx)} className="btn-ghost p-1.5">
                              <Pencil className="w-3 h-3 text-gray-400" />
                            </button>
                            <button onClick={() => removePeriod(idx)} className="btn-ghost p-1.5">
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Save section */}
          <div className="card p-5 space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Link to a College/School interval
            </p>
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Go to Schedule → Edit your timetable → Copy the ID from the College/School interval URL, then paste it below.
              </p>
            </div>
            <input
              value={intervalId}
              onChange={(e) => setIntervalId(e.target.value)}
              placeholder="Interval ID (uuid)"
              className="input font-mono text-sm"
            />
            <button
              onClick={handleSave}
              disabled={saving || !intervalId || parsed.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Save className="w-4 h-4" /> Save {parsed.length} periods to schedule</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
