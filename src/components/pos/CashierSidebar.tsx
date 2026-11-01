'use client'

import React from 'react'
import Image from 'next/image'
import { CartItem, Product } from '@/types'
import { formatRupiah } from '@/lib/printer'
import { Trash2, Plus, Minus, ShoppingBag, Printer, QrCode, Banknote } from 'lucide-react'
import { PrinterStatus as StatusType } from '@/hooks/usePrinter'

interface Props {
  cartItems: CartItem[]
  totalPcs: number
  totalAmount: number
  cashierName?: string
  invoiceNumberPreview: string
  printerStatus: StatusType
  printerDeviceName?: string | null
  onAddItem: (product: Product) => void
  onRemoveItem: (productId: number) => void
  onClearCart: () => void
  onPayCash: () => void
  onPayQris: () => void
  onConnectPrinter: () => Promise<boolean>
}

export function CashierSidebar({
  cartItems,
  totalPcs,
  totalAmount,
  cashierName = 'Kasir Gerobak',
  invoiceNumberPreview,
  printerStatus,
  printerDeviceName,
  onAddItem,
  onRemoveItem,
  onClearCart,
  onPayCash,
  onPayQris,
  onConnectPrinter,
}: Props) {
  const isEmpty = cartItems.length === 0

  return (
    <aside className="bg-white rounded-3xl border border-slate-100 shadow-soft flex flex-col h-[calc(100vh-5rem)] sticky top-20 overflow-hidden select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              Terminal Kasir
            </h2>
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-2">
            <span>Nota: <strong className="text-slate-700">{invoiceNumberPreview}</strong></span>
            <span>•</span>
            <span>{cashierName}</span>
          </div>
        </div>

        {!isEmpty && (
          <button
            type="button"
            onClick={onClearCart}
            title="Kosongkan Keranjang"
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-3xl mb-3 text-amber-500 shadow-inner">
              🧆
            </div>
            <h3 className="text-sm font-extrabold text-slate-700">Keranjang Masih Kosong</h3>
            <p className="text-xs text-slate-400 max-w-[200px] mt-1 font-medium">
              Pilih varian risoles dari daftar menu untuk memulai pesanan kasir
            </p>
          </div>
        ) : (
          cartItems.map((item) => {
            const subtotal = item.qty * item.product.price
            const imgSrc =
              item.product.image_url ||
              (item.product.id === 1
                ? '/images/products/risol-mayo.jpg'
                : item.product.id === 2
                ? '/images/products/risol-pedas.jpg'
                : item.product.id === 3
                ? '/images/products/risol-sayur.jpg'
                : '/images/products/risol-coklat.jpg')

            return (
              <div
                key={item.product.id}
                className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3 hover:bg-amber-50/40 hover:border-amber-200/60 transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-100 flex-shrink-0">
                    <Image
                      src={imgSrc}
                      alt={item.product.name}
                      width={60}
                      height={60}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                      Rp {formatRupiah(item.product.price)} / pcs
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Inline Stepper */}
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-900 tabular-nums w-5 text-center">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddItem(item.product)}
                      disabled={item.qty >= item.product.stock}
                      className="w-6 h-6 rounded-lg text-slate-900 hover:bg-amber-100 flex items-center justify-center font-bold text-xs disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs font-black text-orange-600 tabular-nums min-w-[62px] text-right">
                    Rp {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bill Breakdown & Actions Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
        {/* Bill Summary */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500 font-semibold">
            <span>Jumlah Risoles:</span>
            <span className="text-slate-800 font-bold">{totalPcs} Pcs</span>
          </div>
          <div className="flex justify-between text-slate-500 font-semibold">
            <span>Pajak & Layanan:</span>
            <span className="text-emerald-600 font-bold">Gratis (UMKM)</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-700">Total Tagihan:</span>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              Rp {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        {/* Payment Buttons (50-50 Split) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onPayCash}
            disabled={isEmpty}
            className={`h-12 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all ${
              isEmpty
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>BAYAR TUNAI</span>
          </button>

          <button
            type="button"
            onClick={onPayQris}
            disabled={isEmpty}
            className={`h-12 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all ${
              isEmpty
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QRIS MUAMALAT</span>
          </button>
        </div>

        {/* Printer Mini Status Bar */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Printer:{' '}
              <strong
                className={
                  printerStatus === 'connected' ? 'text-emerald-600' : 'text-slate-600'
                }
              >
                {printerStatus === 'connected'
                  ? printerDeviceName || 'Siap Cetak'
                  : 'Belum Terhubung'}
              </strong>
            </span>
          </div>

          {printerStatus !== 'connected' && (
            <button
              type="button"
              onClick={onConnectPrinter}
              className="text-amber-700 hover:text-amber-900 font-bold underline"
            >
              Hubungkan
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
