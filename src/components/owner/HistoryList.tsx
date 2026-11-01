'use client'

import React, { useState } from 'react'
import { Transaction, ReceiptData } from '@/types'
import { formatRupiah, formatWIBDateTime, downloadReceiptPdf } from '@/lib/printer'
import { Receipt, Printer, CheckCircle2, Circle, Download } from 'lucide-react'

interface Props {
  transactions: Transaction[]
  onReprint: (tx: Transaction) => void
  onToggleReconcile: (transactionId: string, newState: boolean) => Promise<void>
  isLoading?: boolean
}

export function HistoryList({
  transactions,
  onReprint,
  onToggleReconcile,
  isLoading = false,
}: Props) {
  const [filterMethod, setFilterMethod] = useState<'ALL' | 'CASH' | 'QRIS'>('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = transactions.filter(t => {
    if (filterMethod === 'CASH') return t.payment_method === 'CASH'
    if (filterMethod === 'QRIS') return t.payment_method === 'QRIS_MUAMALAT'
    return true
  })

  const handleCheckbox = async (tx: Transaction) => {
    setUpdatingId(tx.id)
    try {
      await onToggleReconcile(tx.id, !tx.is_reconciled)
    } finally {
      setUpdatingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 animate-pulse">
        <div className="h-4 bg-slate-200 rounded-md w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden select-none">
      {/* Header and filter */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
            Riwayat Nota ({filtered.length})
          </h3>
        </div>

        <select
          value={filterMethod}
          onChange={e => setFilterMethod(e.target.value as 'ALL' | 'CASH' | 'QRIS')}
          className="text-xs font-bold bg-slate-100/80 border border-slate-200/60 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-200"
        >
          <option value="ALL">Semua Pembayaran</option>
          <option value="CASH">💵 TUNAI</option>
          <option value="QRIS">📱 QRIS MUAMALAT</option>
        </select>
      </div>

      {/* List items */}
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-xs font-medium text-slate-400">
            Tidak ada riwayat transaksi pada filter ini
          </div>
        ) : (
          filtered.map(tx => {
            const isQris = tx.payment_method === 'QRIS_MUAMALAT'
            const timeStr = tx.created_at
              ? new Intl.DateTimeFormat('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }).format(new Date(tx.created_at))
              : '-'

            return (
              <div
                key={tx.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col gap-2.5"
              >
                {/* Top line: Invoice number + Total Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 tracking-tight">
                      {tx.invoice_number}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        isQris
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isQris ? 'QRIS' : 'TUNAI'}
                    </span>
                  </div>

                  <span className="text-sm sm:text-base font-black tabular-nums text-slate-900">
                    Rp {formatRupiah(tx.total_amount)}
                  </span>
                </div>

                {/* Sub details: time, issuer, items */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>{timeStr} WIB</span>
                    {isQris && tx.qris_issuer && (
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {tx.qris_issuer}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* QRIS Reconcile Button/Checkbox */}
                    {isQris && (
                      <button
                        type="button"
                        onClick={() => handleCheckbox(tx)}
                        disabled={updatingId === tx.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                          tx.is_reconciled
                            ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tx.is_reconciled ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{tx.is_reconciled ? 'Sudah Mutasi' : 'Cek Mutasi'}</span>
                      </button>
                    )}

                    {/* Direct PDF Download Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const txItems = tx.items || []
                        const receiptData: ReceiptData = {
                          invoiceNumber: tx.invoice_number,
                          datetime: tx.created_at
                            ? formatWIBDateTime(new Date(tx.created_at))
                            : '-',
                          cashierName: tx.cashier_name || 'Kasir',
                          items: txItems.map(item => ({
                            name: item.product_name,
                            qty: item.qty,
                            price: item.price_at_sale,
                            subtotal: item.subtotal,
                          })),
                          totalPcs: txItems.reduce((acc, i) => acc + i.qty, 0),
                          totalAmount: tx.total_amount,
                          paymentMethod: tx.payment_method,
                          cashReceived: tx.cash_received || undefined,
                          changeAmount: tx.change_amount || undefined,
                          qrisIssuer: tx.qris_issuer || undefined,
                        }
                        downloadReceiptPdf(receiptData)
                      }}
                      className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title="Download Struk PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-600" />
                      <span>PDF</span>
                    </button>

                    {/* Reprint / Preview Modal Button */}
                    <button
                      type="button"
                      onClick={() => onReprint(tx)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Struk / Cetak</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
