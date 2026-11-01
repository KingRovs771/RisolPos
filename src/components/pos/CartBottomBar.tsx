'use client'

import React from 'react'
import { formatRupiah } from '@/lib/printer'
import { ShoppingBag, Banknote, QrCode, RotateCcw } from 'lucide-react'

interface Props {
  totalPcs: number
  totalAmount: number
  onPayCash: () => void
  onPayQris: () => void
  onClearCart?: () => void
}

export function CartBottomBar({
  totalPcs,
  totalAmount,
  onPayCash,
  onPayQris,
  onClearCart,
}: Props) {
  const isEmpty = totalPcs === 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 select-none p-3 pb-4 max-w-md mx-auto pointer-events-none">
      {/* Soft gradient fade backdrop to give clean scroll separation */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-100 via-slate-100/80 to-transparent -z-10 pointer-events-none" />

      {isEmpty ? (
        /* Compact Pill when Cart is Empty - Doesn't block any product cards! */
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white rounded-2xl px-4 py-2.5 shadow-lg flex items-center justify-between pointer-events-auto transition-all duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-300">
              Keranjang Kosong
            </span>
          </div>
          <span className="text-[11px] font-semibold text-amber-400">
            Ketuk menu untuk memesan
          </span>
        </div>
      ) : (
        /* Full Checkout Card when Cart has items */
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white rounded-3xl p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] pointer-events-auto animate-[slideUp_0.2s_ease-out] transition-all duration-200">
          {/* Row 1: Item count and total rupiah */}
          <div className="flex justify-between items-center mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Total Pesanan</div>
                <div className="text-xs font-bold text-slate-200">
                  <strong className="text-amber-400 font-black">{totalPcs} Pcs</strong> Risol
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {onClearCart && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Reset Pesanan"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-medium">Total Bayar</div>
                <div className="text-lg font-black tabular-nums text-white">
                  Rp {formatRupiah(totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 50% - 50% Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPayCash}
              className="h-11 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-emerald-500/20"
            >
              <Banknote className="w-4 h-4" />
              <span>BAYAR TUNAI</span>
            </button>

            <button
              type="button"
              onClick={onPayQris}
              className="h-11 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm bg-indigo-500 hover:bg-indigo-600 text-white font-black shadow-indigo-500/20"
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS MUAMALAT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
