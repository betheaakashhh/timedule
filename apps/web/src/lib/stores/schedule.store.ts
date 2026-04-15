import { create } from 'zustand'
import type { DailyLog, Interval, IntervalStatus, SocketIntervalTick } from '@timeflow/types'

interface ScheduleStore {
  todayLogs: DailyLog[]
  activeLogId: string | null
  ticks: Record<string, SocketIntervalTick>
  setTodayLogs: (logs: DailyLog[]) => void
  updateLogStatus: (logId: string, status: IntervalStatus) => void
  applyTick: (tick: SocketIntervalTick) => void
  setActiveLog: (logId: string | null) => void
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  todayLogs: [],
  activeLogId: null,
  ticks: {},

  setTodayLogs: (logs) => {
    set({ todayLogs: logs })
    const active = logs.find((l) => l.status === 'active')
    set({ activeLogId: active?.id ?? null })
  },

  updateLogStatus: (logId, status) =>
    set((s) => ({
      todayLogs: s.todayLogs.map((l) =>
        l.id === logId ? { ...l, status } : l
      ),
    })),

  applyTick: (tick) =>
    set((s) => ({
      ticks: { ...s.ticks, [tick.intervalId]: tick },
    })),

  setActiveLog: (logId) => set({ activeLogId: logId }),
}))
