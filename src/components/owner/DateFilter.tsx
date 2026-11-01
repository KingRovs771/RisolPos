'use client'

import React, { useState } from 'react'
import { Calendar, ChevronRight } from 'lucide-react'

export type DatePreset = 'today' | 'yesterday' | '7days' | 'custom' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'CUSTOM'

export interface DateRange {
  start: string
  end: string
  startDate?: string
  endDate?: string
}

export function getWIBDateString(date?: Date): string {
  if (typeof window === 'undefined' && !date) {
    return '2026-10-24'
  }
  const d = date || new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  return parts
}

export function calculateDateRange(preset: string): { start: string; end: string } {
  if (typeof window === 'undefined') {
    return { start: '2026-10-24', end: '2026-10-24' }
  }
  const now = new Date()
  const todayWIB = getWIBDateString(now)
  const norm = preset.toLowerCase()

  if (norm === 'today') {
    return { start: todayWIB, end: todayWIB }
  }

  if (norm === 'yesterday') {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const yesterdayWIB = getWIBDateString(yesterday)
    return { start: yesterdayWIB, end: yesterdayWIB }
  }

  if (norm === '7days' || norm === 'last_7_days') {
    const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    const startWIB = getWIBDateString(sevenDaysAgo)
    return { start: startWIB, end: todayWIB }
  }

  return { start: todayWIB, end: todayWIB }
}

interface Props {
  selectedPreset: DatePreset
  dateRange: { start: string; end: string }
  onSelectPreset: (preset: DatePreset, range: { start: string; end: string }) => void
}

export function DateFilter({
  selectedPreset,
  dateRange,
  onSelectPreset,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false)
  const normPreset = selectedPreset.toLowerCase()

  const handlePresetClick = (preset: DatePreset) => {
    const norm = preset.toLowerCase()
    if (norm === 'custom') {
      setShowDatePicker(true)
    } else {
      setShowDatePicker(false)
      const range = calculateDateRange(norm)
      onSelectPreset(preset, range)
    }
  }

  const handleDateChange = (start: string, end: string) => {
    onSelectPreset('custom', { start, end })
  }

  return (
    <div className="select-none bg-white rounded-3xl p-3 border border-slate-100 shadow-soft">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 text-slate-400 pl-1 pr-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-700">Periode:</span>
        </div>

        <button
          type="button"
          onClick={() => handlePresetClick('today')}
          className={`h-8 px-3.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
            normPreset === 'today'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          Hari Ini
        </button>

        <button
          type="button"
          onClick={() => handlePresetClick('yesterday')}
          className={`h-8 px-3.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
            normPreset === 'yesterday'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          Kemarin
        </button>

        <button
          type="button"
          onClick={() => handlePresetClick('7days')}
          className={`h-8 px-3.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
            normPreset === '7days' || normPreset === 'last_7_days'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          7 Hari Terakhir
        </button>

        <button
          type="button"
          onClick={() => handlePresetClick('custom')}
          className={`h-8 px-3.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
            normPreset === 'custom'
              ? 'bg-amber-500 text-amber-950 font-black shadow-xs ring-2 ring-amber-300'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          Pilih Rentang Tanggal
        </button>
      </div>

      {/* Custom Date Pickers */}
      {showDatePicker && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">
              Tanggal Awal (WIB):
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => handleDateChange(e.target.value, dateRange.end)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <ChevronRight className="hidden sm:block w-4 h-4 text-slate-400 self-end mb-2.5" />
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">
              Tanggal Akhir (WIB):
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => handleDateChange(dateRange.start, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>
      )}
    </div>
  )
}
