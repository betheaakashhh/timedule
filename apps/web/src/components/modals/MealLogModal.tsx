'use client'

import { useState } from 'react'
import { X, Plus, Utensils, Coffee, UtensilsCrossed, Apple } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealType } from '@timeflow/types'
import toast from 'react-hot-toast'

const MEAL_TYPES: { value: MealType; label: string; icon: React.ReactNode }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: <Coffee className="w-4 h-4" /> },
  { value: 'lunch',     label: 'Lunch',     icon: <UtensilsCrossed className="w-4 h-4" /> },
  { value: 'dinner',    label: 'Dinner',    icon: <Utensils className="w-4 h-4" /> },
  { value: 'snack',     label: 'Snack',     icon: <Apple className="w-4 h-4" /> },
]

const QUICK_FOODS = [
  'Rice', 'Dal', 'Roti', 'Sabzi', 'Poha', 'Upma', 'Idli', 'Dosa',
  'Eggs', 'Toast', 'Oats', 'Milk', 'Tea', 'Coffee', 'Fruits', 'Curd',
  'Salad', 'Sandwich', 'Pasta', 'Noodles', 'Paneer', 'Chicken',
]

interface MealLogModalProps {
  open: boolean
  onClose: () => void
  logId: string
  defaultMealType: MealType
  onSubmit: (logId: string, items: string[], mealType: MealType) => Promise<void>
}

export function MealLogModal({ open, onClose, logId, defaultMealType, onSubmit }: MealLogModalProps) {
  const [mealType, setMealType] = useState<MealType>(defaultMealType)
  const [items, setItems] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  function addItem(name: string) {
    const trimmed = name.trim()
    if (!trimmed || items.includes(trimmed)) return
    setItems((prev) => [...prev, trimmed])
    setInput('')
  }

  function removeItem(item: string) {
    setItems((prev) => prev.filter((i) => i !== item))
  }

  async function handleSubmit() {
    if (items.length === 0) {
      toast.error('Add at least one food item')
      return
    }
    setSaving(true)
    try {
      await onSubmit(logId, items, mealType)
      setItems([])
      setInput('')
      onClose()
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to log meal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      {/* Note: no click-outside dismiss — meal log is blocking */}
      <div className="relative w-full md:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Log your meal</h2>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Required to mark this interval complete</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Meal type */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Meal type</p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map((mt) => (
                <button
                  key={mt.value}
                  onClick={() => setMealType(mt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all',
                    mealType === mt.value
                      ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                  )}
                >
                  {mt.icon}
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items added */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-sm px-3 py-1 rounded-full"
                >
                  {item}
                  <button onClick={() => removeItem(item)} className="hover:text-brand-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              What did you eat?
            </p>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem(input)}
                placeholder="Type food name..."
                className="input flex-1"
              />
              <button
                onClick={() => addItem(input)}
                disabled={!input.trim()}
                className="btn-primary px-3"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick picks */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FOODS.filter((f) => !items.includes(f)).slice(0, 16).map((food) => (
                <button
                  key={food}
                  onClick={() => addItem(food)}
                  className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 text-gray-600 dark:text-gray-400 rounded-full transition-colors"
                >
                  {food}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 sticky bottom-0 bg-white dark:bg-gray-900 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleSubmit}
            disabled={saving || items.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Utensils className="w-4 h-4" />
            {saving ? 'Logging...' : `Log meal (${items.length} item${items.length !== 1 ? 's' : ''}) & complete`}
          </button>
          {items.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-2">Add at least one food item to continue</p>
          )}
        </div>
      </div>
    </div>
  )
}
