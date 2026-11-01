'use client'

import React from 'react'
import { formatRupiah } from '@/lib/printer'
import { TrendingUp, ShoppingBag, Banknote, QrCode, ShoppingCart, Wallet } from 'lucide-react'

interface Props {
  totalRevenue: number
  totalPcs: number
  cashRevenue: number
  qrisRevenue: number
  totalExpenses: number
  netCash: number
  isLoading?: boolean
}

export function MetricCard({
  totalRevenue,
  totalPcs,
  cashRevenue,
  qrisRevenue,
  totalExpenses,
  netCash,
  isLoading = false,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-3xl p-4 shadow-soft border border-slate-100 h-28">
            <div className="h-3 bg-slate-200 rounded-md w-16 mb-2" />
            <div className="h-7 bg-slate-200 rounded-lg w-24" />
          </div>
        ))}
      </div>
    )
  }

  const isNetNegative = netCash < 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
      {/* 1. Omzet Kotor */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-slate-100 hover:shadow-card-hover transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Omzet Kotor
          </span>
          <TrendingUp className="w-4 h-4 text-amber-500" />
        </div>
        <span className="text-lg sm:text-xl font-black tabular-nums text-slate-900 block truncate">
          Rp {formatRupiah(totalRevenue)}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
          Penjualan hari ini
        </span>
      </div>

      {/* 2. Total Pcs Terjual */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-slate-100 hover:shadow-card-hover transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Pcs Terjual
          </span>
          <ShoppingBag className="w-4 h-4 text-indigo-500" />
        </div>
        <span className="text-lg sm:text-xl font-black tabular-nums text-slate-900 block">
          {totalPcs} <span className="text-xs font-bold text-slate-400">pcs</span>
        </span>
        <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
          Volume transaksi
        </span>
      </div>

      {/* 3. Laci Tunai */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-emerald-100/80 hover:shadow-card-hover transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Laci Tunai
          </span>
          <Banknote className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-lg sm:text-xl font-black tabular-nums text-emerald-700 block truncate">
          Rp {formatRupiah(cashRevenue)}
        </span>
        <span className="text-[10px] text-emerald-600/70 font-semibold mt-0.5 block">
          Uang fisik di laci
        </span>
      </div>

      {/* 4. QRIS Muamalat */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-indigo-100/80 hover:shadow-card-hover transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
            QRIS Muamalat
          </span>
          <QrCode className="w-4 h-4 text-indigo-600" />
        </div>
        <span className="text-lg sm:text-xl font-black tabular-nums text-indigo-900 block truncate">
          Rp {formatRupiah(qrisRevenue)}
        </span>
        <span className="text-[10px] text-indigo-600/70 font-semibold mt-0.5 block">
          Rekening mutasi
        </span>
      </div>

      {/* 5. Total Kulakan */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-amber-100/80 hover:shadow-card-hover transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Kulakan Bahan
          </span>
          <ShoppingCart className="w-4 h-4 text-amber-600" />
        </div>
        <span className="text-lg sm:text-xl font-black tabular-nums text-amber-900 block truncate">
          Rp {formatRupiah(totalExpenses)}
        </span>
        <span className="text-[10px] text-amber-600/70 font-semibold mt-0.5 block">
          Bahan baku & gas
        </span>
      </div>

      {/* 6. Kas Bersih */}
      <div
        className={`rounded-3xl p-4 shadow-soft border transition-all hover:shadow-card-hover ${
          isNetNegative
            ? 'bg-rose-50/70 border-rose-200'
            : 'bg-emerald-50/70 border-emerald-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${
              isNetNegative ? 'text-rose-800' : 'text-emerald-900'
            }`}
          >
            Kas Bersih
          </span>
          <Wallet
            className={`w-4 h-4 ${
              isNetNegative ? 'text-rose-600' : 'text-emerald-600'
            }`}
          />
        </div>
        <span
          className={`text-lg sm:text-xl font-black tabular-nums block truncate ${
            isNetNegative ? 'text-rose-600' : 'text-emerald-700'
          }`}
        >
          {isNetNegative ? '- Rp ' : 'Rp '}
          {formatRupiah(Math.abs(netCash))}
        </span>
        <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
          Omzet - Pengeluaran
        </span>
      </div>
    </div>
  )
}
