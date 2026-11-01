'use client'

import React, { useState } from 'react'
import { formatRupiah } from '@/lib/printer'
import { Banknote, X, Check, Loader2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  totalAmount: number
  onConfirm: (cashReceived: number) => Promise<void>
  onClose: () => void
}

export function CashModal({
  isOpen,
  totalAmount,
  onConfirm,
  onClose,
}: Props) {
  const [cashInput, setCashInput] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleClose = () => {
    setCashInput('')
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  const cashReceived = Number(cashInput) || 0
  const change = cashReceived - totalAmount
  const isSufficient = cashReceived >= totalAmount

  const handleQuickChip = (amount: number) => {
    setCashInput(amount.toString())
  }

  const handleConfirm = async () => {
    if (!isSufficient || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onConfirm(cashReceived)
    } catch {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-[fadeIn_0.15s_ease-out]"
      onClick={isSubmitting ? undefined : handleClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag handle */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Pembayaran Tunai
              </h2>
              <span className="text-[11px] text-slate-500 font-semibold">
                Kasir RisolPOS Berkah
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Total Bill display */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 mb-4 text-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
            Total Tagihan
          </span>
          <span className="text-3xl sm:text-4xl font-black tabular-nums text-slate-900">
            Rp {formatRupiah(totalAmount)}
          </span>
        </div>

        {/* Cash Input */}
        <div className="mb-3">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Uang Diterima dari Pembeli:
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-lg font-black text-slate-400 pointer-events-none">
              Rp
            </span>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              placeholder="0"
              disabled={isSubmitting}
              className="w-full pl-12 pr-4 py-3 text-right text-2xl font-black tabular-nums border-2 border-slate-200 rounded-2xl focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-100 text-slate-900 transition-all"
            />
          </div>
        </div>

        {/* Quick Amount Chips */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => handleQuickChip(totalAmount)}
            disabled={isSubmitting}
            className="bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl py-2 text-xs font-black border border-amber-300 active:scale-95 transition-all"
          >
            Uang Pas
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip(10000)}
            disabled={isSubmitting}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl py-2 text-xs font-bold active:scale-95 transition-all"
          >
            Rp 10.000
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip(20000)}
            disabled={isSubmitting}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl py-2 text-xs font-bold active:scale-95 transition-all"
          >
            Rp 20.000
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip(50000)}
            disabled={isSubmitting}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl py-2 text-xs font-bold active:scale-95 transition-all"
          >
            Rp 50.000
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip(100000)}
            disabled={isSubmitting}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl py-2 text-xs font-bold active:scale-95 transition-all"
          >
            Rp 100.000
          </button>
          <button
            type="button"
            onClick={() => setCashInput('')}
            disabled={isSubmitting}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl py-2 text-xs font-bold border border-rose-200 active:scale-95 transition-all"
          >
            Hapus
          </button>
        </div>

        {/* Change amount indicator */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-4 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600">
            {change < 0 ? 'Kekurangan Uang:' : 'Kembalian:'}
          </span>
          <span
            className={`text-xl font-black tabular-nums ${
              change < 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {change < 0
              ? `- Rp ${formatRupiah(Math.abs(change))}`
              : `Rp ${formatRupiah(change)}`}
          </span>
        </div>

        {/* Confirm and print button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isSufficient || isSubmitting}
          className={`w-full h-13 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
            !isSufficient || isSubmitting
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Memproses & Mencetak Struk...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Konfirmasi & Cetak Struk</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
