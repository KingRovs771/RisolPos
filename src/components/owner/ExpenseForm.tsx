'use client'

import React, { useState } from 'react'
import { ShoppingCart, Check, Loader2 } from 'lucide-react'

interface Props {
  onAddExpense?: (payload: {
    itemName: string
    qtyDescription?: string
    totalCost: number
  }) => Promise<void>
  onSubmit?: (payload: {
    itemName: string
    qtyDescription?: string
    totalCost: number
  }) => Promise<void>
}

export function ExpenseForm({ onAddExpense, onSubmit }: Props) {
  const handler = onSubmit || onAddExpense
  const [itemName, setItemName] = useState<string>('')
  const [qtyDesc, setQtyDesc] = useState<string>('')
  const [totalCostInput, setTotalCostInput] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cost = parseInt(totalCostInput, 10)
    if (!itemName.trim() || isNaN(cost) || cost <= 0 || isSubmitting || !handler) return

    setIsSubmitting(true)
    try {
      await handler({
        itemName: itemName.trim(),
        qtyDescription: qtyDesc.trim() || undefined,
        totalCost: cost,
      })
      setItemName('')
      setQtyDesc('')
      setTotalCostInput('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 select-none">
      {/* Form Input Card */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
            Catat Pembelian Bahan / Kulakan
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Bahan Baku: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="Contoh: Minyak Goreng Bimoli 2L, Tepung Terigu Cakra"
              required
              disabled={isSubmitting}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs sm:text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Banyaknya / Satuan:
              </label>
              <input
                type="text"
                value={qtyDesc}
                onChange={e => setQtyDesc(e.target.value)}
                placeholder="2 Pouch / 3 Kg"
                disabled={isSubmitting}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs sm:text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Total Biaya (Rp): <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={totalCostInput}
                onChange={e => setTotalCostInput(e.target.value)}
                placeholder="0"
                required
                disabled={isSubmitting}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs sm:text-sm font-black text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 tabular-nums"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !itemName || !totalCostInput}
            className={`w-full h-12 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${
              isSubmitting || !itemName || !totalCostInput
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Catatan Kulakan</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
