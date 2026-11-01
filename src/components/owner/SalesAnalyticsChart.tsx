'use client'

import React, { useState, useMemo } from 'react'
import { Transaction, Outlet } from '@/types'
import { Clock, Store, Trophy, Sparkles, Filter } from 'lucide-react'

interface Props {
  transactions: Transaction[]
  outlets: Outlet[]
}

export function SalesAnalyticsChart({ transactions, outlets }: Props) {
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('ALL')
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)

  // Filter transactions based on selected outlet
  const filteredTransactions = useMemo(() => {
    if (selectedOutletFilter === 'ALL') return transactions
    return transactions.filter(t => t.outlet_id === selectedOutletFilter)
  }, [transactions, selectedOutletFilter])

  // 1. Calculate Hourly Sales (07:00 to 22:00 WIB)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 7..21

    const map = new Map<number, { revenue: number; txCount: number; pcsCount: number }>()
    for (const h of hours) {
      map.set(h, { revenue: 0, txCount: 0, pcsCount: 0 })
    }

    for (const tx of filteredTransactions) {
      const date = new Date(tx.created_at)
      // Extract hour in local WIB (UTC+7)
      const hour = date.getHours()
      if (map.has(hour)) {
        const cur = map.get(hour)!
        cur.revenue += tx.total_amount
        cur.txCount += 1
        if (Array.isArray(tx.items)) {
          for (const it of tx.items) {
            cur.pcsCount += it.qty
          }
        }
      }
    }

    let maxRev = 0
    let peakH = 7
    for (const [h, val] of map.entries()) {
      if (val.revenue > maxRev) {
        maxRev = val.revenue
        peakH = h
      }
    }

    return {
      hours: hours.map(h => ({
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        revenue: map.get(h)!.revenue,
        txCount: map.get(h)!.txCount,
        pcsCount: map.get(h)!.pcsCount,
        isPeak: maxRev > 0 && h === peakH,
      })),
      maxRevenue: Math.max(maxRev, 10000), // avoid divide by 0
      peakHour: maxRev > 0 ? peakH : null,
      totalRevenue: filteredTransactions.reduce((acc, t) => acc + t.total_amount, 0),
    }
  }, [filteredTransactions])

  // 2. Calculate Sales per Outlet
  const outletComparison = useMemo(() => {
    const totalAllRevenue = transactions.reduce((acc, t) => acc + t.total_amount, 0)

    return outlets.map(out => {
      const outTxs = transactions.filter(t => t.outlet_id === out.id)
      const outRev = outTxs.reduce((acc, t) => acc + t.total_amount, 0)
      let outPcs = 0
      for (const t of outTxs) {
        if (Array.isArray(t.items)) {
          for (const it of t.items) {
            outPcs += it.qty
          }
        }
      }

      const pct = totalAllRevenue > 0 ? Math.round((outRev / totalAllRevenue) * 100) : 0

      return {
        id: out.id,
        name: out.name,
        revenue: outRev,
        txCount: outTxs.length,
        pcsCount: outPcs,
        percentage: pct,
      }
    }).sort((a, b) => b.revenue - a.revenue)
  }, [transactions, outlets])

  // 3. Calculate Product Ranking
  const productRanking = useMemo(() => {
    const pMap = new Map<string, { name: string; qty: number; revenue: number }>()

    for (const tx of filteredTransactions) {
      if (Array.isArray(tx.items)) {
        for (const it of tx.items) {
          const key = it.product_name
          const current = pMap.get(key) || { name: key, qty: 0, revenue: 0 }
          current.qty += it.qty
          current.revenue += it.subtotal
          pMap.set(key, current)
        }
      }
    }

    const totalQty = Array.from(pMap.values()).reduce((acc, item) => acc + item.qty, 0)

    return Array.from(pMap.values())
      .map(item => ({
        ...item,
        pct: totalQty > 0 ? Math.round((item.qty / totalQty) * 100) : 0,
      }))
      .sort((a, b) => b.qty - a.qty)
  }, [filteredTransactions])

  return (
    <div className="space-y-6">
      {/* Top Filter Bar: Outlet Selector for Real-Time Analysis */}
      <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-900 block leading-tight">
              Filter Visual Gerobak Real-Time
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              Lihat performa outlet secara terisolasi atau keseluruhan
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedOutletFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              selectedOutletFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Gerobak ({transactions.length})
          </button>

          {outlets.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelectedOutletFilter(o.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedOutletFilter === o.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {o.name.split('-')[0]?.trim() || o.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Sales Bar Chart (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Grafik Penjualan per Jam (07:00 - 21:00)
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">
                  Pantau jam puncak pembeli (*peak sales hours*)
                </span>
              </div>
            </div>

            {hourlyData.peakHour && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Puncak: {hourlyData.peakHour}:00
              </span>
            )}
          </div>

          {/* SVG Bar Chart */}
          <div className="pt-2">
            <div className="h-48 w-full flex items-end gap-1.5 sm:gap-2 border-b border-slate-100 pb-2">
              {hourlyData.hours.map(item => {
                const heightPct = Math.max(6, Math.round((item.revenue / hourlyData.maxRevenue) * 100))
                const isHovered = hoveredHour === item.hour

                return (
                  <div
                    key={item.hour}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    onMouseEnter={() => setHoveredHour(item.hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-16 z-20 bg-slate-950 text-white p-2 rounded-xl text-[10px] font-bold shadow-xl whitespace-nowrap pointer-events-none animate-[fadeIn_0.1s_ease-out]">
                        <div className="text-amber-400 font-black">Pukul {item.label}</div>
                        <div>Rp {item.revenue.toLocaleString('id-ID')}</div>
                        <div className="text-slate-300 font-medium">{item.txCount} nota • {item.pcsCount} pcs</div>
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        item.isPeak
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-md shadow-amber-500/30 ring-2 ring-amber-300'
                          : item.revenue > 0
                          ? 'bg-gradient-to-t from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    />

                    {/* X-Axis Label */}
                    <span className="text-[9px] font-bold text-slate-400 mt-2 truncate">
                      {item.hour}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="pt-3 flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>07:00 WIB</span>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Jam Teramai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Ada Penjualan</span>
                </div>
              </div>
              <span>21:00 WIB</span>
            </div>
          </div>
        </div>

        {/* Per-Outlet Comparison & Share (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Perbandingan Omzet Antar Gerobak
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">
                Kontribusi penjualan real-time hari ini
              </span>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {outletComparison.map((item, idx) => (
              <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border text-[10px] font-black flex items-center justify-center text-slate-700">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-black text-slate-900 truncate max-w-[150px]">
                      {item.name}
                    </span>
                  </div>

                  <span className="text-xs font-black text-amber-950">
                    Rp {item.revenue.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Progress bar percentage */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>{item.txCount} Transaksi • {item.pcsCount} Pcs</span>
                  <span className="text-emerald-700 font-black">{item.percentage}% dari Total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Ranking Breakdown */}
      <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Ranking Varian Risol Terlaris
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">
              Distribusi menu paling diminati konsumen pada filter terpilih
            </span>
          </div>
        </div>

        {productRanking.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="text-xs font-bold text-slate-400">
              Belum ada transaksi penjualan pada filter ini.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {productRanking.map((p, idx) => (
              <div
                key={p.name}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-black text-slate-900 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {p.qty} Pcs Terjual ({p.pct}%)
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-700 block">
                    Rp {p.revenue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
