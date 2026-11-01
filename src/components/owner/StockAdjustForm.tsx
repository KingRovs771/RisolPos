'use client'

import React, { useState } from 'react'
import { Product, StockMoveType, Outlet, OutletStockItem } from '@/types'
import {
  PlusCircle,
  AlertOctagon,
  Scale,
  ArrowLeftRight,
  Check,
  Loader2,
  MapPin,
} from 'lucide-react'

interface Props {
  products: Product[]
  outlets?: Outlet[]
  outletStocks?: OutletStockItem[]
  initialOutletId?: string
  selectedOutletFilter?: string
  onAdjust?: (payload: {
    productId: number
    outletId: string
    movementType: StockMoveType
    qtyChange: number
    notes?: string
    targetOutletId?: string
  }) => Promise<void>
  onSubmit?: (payload: {
    productId: number
    outletId: string
    movementType: StockMoveType
    qtyChange: number
    notes?: string
    targetOutletId?: string
  }) => Promise<void>
  onCancel?: () => void
}

export function StockAdjustForm({
  products,
  outlets = [],
  outletStocks = [],
  initialOutletId = '',
  selectedOutletFilter = 'ALL',
  onAdjust,
  onSubmit,
  onCancel,
}: Props) {
  const handler = onSubmit || onAdjust

  const [activeSubTab, setActiveSubTab] = useState<'RESTOCK' | 'WASTE' | 'ADJUST' | 'TRANSFER'>('RESTOCK')
  const [selectedOutletId, setSelectedOutletId] = useState<string>(
    selectedOutletFilter !== 'ALL' && selectedOutletFilter
      ? selectedOutletFilter
      : initialOutletId || outlets[0]?.id || ''
  )
  const [targetOutletId, setTargetOutletId] = useState<string>(
    outlets.find(o => o.id !== selectedOutletId)?.id || ''
  )
  const [selectedProductId, setSelectedProductId] = useState<number>(
    products[0]?.id || 1
  )
  const [qtyInput, setQtyInput] = useState<string>('')
  const [notesInput, setNotesInput] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const getProductStockAtOutlet = (outletId: string, productId: number): number => {
    if (outletStocks.length > 0 && outletId) {
      const row = outletStocks.find(
        os => os.outlet_id === outletId && Number(os.product_id) === Number(productId)
      )
      if (row !== undefined) {
        return Number(row.stock) || 0
      }
    }
    const p = products.find(item => item.id === productId)
    return p?.stock ?? 0
  }

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0]
  const currentOutlet = outlets.find(o => o.id === selectedOutletId) || outlets[0]
  const destinationOutlet =
    outlets.find(o => o.id === targetOutletId && o.id !== selectedOutletId) ||
    outlets.find(o => o.id !== selectedOutletId)

  const currentOutletStock = selectedProduct
    ? getProductStockAtOutlet(currentOutlet?.id || selectedOutletId, selectedProduct.id)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !handler || isSubmitting) return

    const qty = parseInt(qtyInput, 10)
    if (isNaN(qty) || (activeSubTab === 'ADJUST' ? qty < 0 : qty <= 0)) return

    const effectiveOutletId = currentOutlet?.id || selectedOutletId
    const effectiveTargetId = destinationOutlet?.id || targetOutletId

    setIsSubmitting(true)

    try {
      if (activeSubTab === 'RESTOCK') {
        await handler({
          productId: selectedProduct.id,
          outletId: effectiveOutletId,
          movementType: 'IN_RESTOCK',
          qtyChange: qty,
          notes: notesInput || `Restock batch ke ${currentOutlet?.name}`,
        })
      } else if (activeSubTab === 'WASTE') {
        if (!notesInput.trim() || notesInput.trim().length < 5) {
          alert('Alasan risol rusak wajib diisi (minimal 5 karakter)')
          setIsSubmitting(false)
          return
        }
        await handler({
          productId: selectedProduct.id,
          outletId: effectiveOutletId,
          movementType: 'OUT_WASTE',
          qtyChange: -qty,
          notes: notesInput.trim(),
        })
      } else if (activeSubTab === 'ADJUST') {
        const diff = qty - currentOutletStock
        if (diff === 0) {
          alert('Stok fisik sama dengan stok sistem di gerobak ini, tidak ada penyesuaian.')
          setIsSubmitting(false)
          return
        }
        if (!notesInput.trim()) {
          alert('Alasan koreksi fisik wajib diisi.')
          setIsSubmitting(false)
          return
        }
        await handler({
          productId: selectedProduct.id,
          outletId: effectiveOutletId,
          movementType: 'ADJUSTMENT',
          qtyChange: diff,
          notes: notesInput.trim(),
        })
      } else if (activeSubTab === 'TRANSFER') {
        if (!effectiveTargetId || effectiveOutletId === effectiveTargetId) {
          alert('Outlet asal dan outlet tujuan tidak boleh sama.')
          setIsSubmitting(false)
          return
        }
        if (qty > currentOutletStock) {
          alert(`Stok di ${currentOutlet?.name} hanya tersisa ${currentOutletStock} pcs.`)
          setIsSubmitting(false)
          return
        }
        // Deduct from origin outlet
        await handler({
          productId: selectedProduct.id,
          outletId: effectiveOutletId,
          movementType: 'OUT_WASTE',
          qtyChange: -qty,
          notes: `Transfer ${qty} pcs ke ${destinationOutlet?.name}. ${notesInput}`.trim(),
          targetOutletId: effectiveTargetId,
        })
        // Add to destination outlet
        await handler({
          productId: selectedProduct.id,
          outletId: effectiveTargetId,
          movementType: 'IN_RESTOCK',
          qtyChange: qty,
          notes: `Diterima transfer ${qty} pcs dari ${currentOutlet?.name}. ${notesInput}`.trim(),
        })
      }

      setQtyInput('')
      setNotesInput('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden select-none">
      {/* Sub tabs: Restock / Waste / Adjustment / Transfer */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('RESTOCK')
            setQtyInput('')
            setNotesInput('')
          }}
          className={`flex-1 min-w-[120px] py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'RESTOCK'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>+ Restock</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('WASTE')
            setQtyInput('')
            setNotesInput('')
          }}
          className={`flex-1 min-w-[120px] py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'WASTE'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
          <span>− Catat Rusak</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('ADJUST')
            setQtyInput(currentOutletStock.toString())
            setNotesInput('')
          }}
          className={`flex-1 min-w-[120px] py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'ADJUST'
              ? 'bg-white text-amber-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-amber-500" />
          <span>= Opname Fisik</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('TRANSFER')
            setQtyInput('')
            setNotesInput('')
          }}
          className={`flex-1 min-w-[120px] py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'TRANSFER'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
          <span>🔄 Transfer Gerobak</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Outlet Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {activeSubTab === 'TRANSFER' ? 'Outlet / Gerobak Asal:' : 'Pilih Outlet / Gerobak:'}
              </span>
            </label>
            <select
              value={currentOutlet?.id || selectedOutletId}
              onChange={e => {
                const newOutletId = e.target.value
                setSelectedOutletId(newOutletId)
                if (activeSubTab === 'ADJUST' && selectedProduct) {
                  setQtyInput(getProductStockAtOutlet(newOutletId, selectedProduct.id).toString())
                }
                if (targetOutletId === newOutletId) {
                  const other = outlets.find(o => o.id !== newOutletId)
                  if (other) setTargetOutletId(other.id)
                }
              }}
              disabled={isSubmitting}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs sm:text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              {outlets.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {activeSubTab === 'TRANSFER' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>Outlet / Gerobak Tujuan:</span>
              </label>
              <select
                value={destinationOutlet?.id || targetOutletId}
                onChange={e => setTargetOutletId(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs sm:text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {outlets
                  .filter(o => o.id !== (currentOutlet?.id || selectedOutletId))
                  .map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Product Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Pilih Varian Risol:
          </label>
          <select
            value={selectedProduct?.id || selectedProductId}
            onChange={e => {
              const id = Number(e.target.value)
              setSelectedProductId(id)
              if (activeSubTab === 'ADJUST') {
                const st = getProductStockAtOutlet(currentOutlet?.id || selectedOutletId, id)
                setQtyInput(st.toString())
              }
            }}
            disabled={isSubmitting}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs sm:text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            {products.map(p => {
              const st = getProductStockAtOutlet(currentOutlet?.id || selectedOutletId, p.id)
              return (
                <option key={p.id} value={p.id}>
                  {p.name} (Sisa di gerobak ini: {st} pcs • Total semua: {p.stock} pcs)
                </option>
              )
            })}
          </select>
        </div>

        {/* Current stock status */}
        <div className="bg-slate-50 rounded-2xl p-3.5 flex justify-between items-center text-xs border border-slate-100">
          <span className="font-semibold text-slate-600">
            Stok Terdata di {currentOutlet?.name?.split('-')[0]?.trim() || 'Gerobak'}:
          </span>
          <span className="font-black text-slate-900 tabular-nums text-sm">
            {currentOutletStock} pcs
          </span>
        </div>

        {/* Qty Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {activeSubTab === 'RESTOCK'
              ? 'Jumlah Tambah Stok (pcs):'
              : activeSubTab === 'WASTE'
              ? 'Jumlah Risol Rusak/Basi (pcs):'
              : activeSubTab === 'ADJUST'
              ? 'Stok Hasil Hitung Fisik Sebenarnya di Gerobak Ini (pcs):'
              : 'Jumlah Risol yang Ditransfer (pcs):'}
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={activeSubTab === 'ADJUST' ? '0' : '1'}
            value={qtyInput}
            onChange={e => setQtyInput(e.target.value)}
            placeholder="0"
            required
            disabled={isSubmitting}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-lg font-black text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 tabular-nums"
          />
        </div>

        {/* Notes Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Catatan / Alasan {activeSubTab !== 'RESTOCK' && <span className="text-rose-500">*</span>}:
          </label>
          <textarea
            value={notesInput}
            onChange={e => setNotesInput(e.target.value)}
            placeholder={
              activeSubTab === 'RESTOCK'
                ? 'Opsional: Restock kloter 1 dari dapur pusat, dll.'
                : activeSubTab === 'WASTE'
                ? 'Wajib: Kulit robek saat digoreng, basi, dll. (min 5 karakter)'
                : activeSubTab === 'ADJUST'
                ? 'Wajib: Selisih hitungan fisik sebelum tutup toko'
                : 'Wajib: Kurir pemindahan antar cabang gerobak'
            }
            rows={2}
            required={activeSubTab !== 'RESTOCK'}
            disabled={isSubmitting}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 h-12 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Batal
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || qtyInput === ''}
            className={`flex-1 h-12 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${
              isSubmitting || qtyInput === ''
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : activeSubTab === 'RESTOCK'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : activeSubTab === 'WASTE'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                : activeSubTab === 'ADJUST'
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Database...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {activeSubTab === 'RESTOCK'
                    ? `Simpan Restock ke ${currentOutlet?.name?.split('-')[0]?.trim() || 'Gerobak'}`
                    : activeSubTab === 'WASTE'
                    ? 'Simpan Kurangi Stok Rusak'
                    : activeSubTab === 'ADJUST'
                    ? 'Simpan Koreksi Fisik Opname'
                    : `Kirim Transfer ke ${destinationOutlet?.name?.split('-')[0]?.trim() || 'Tujuan'}`}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
