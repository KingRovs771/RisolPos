'use client'

import React from 'react'
import { Product } from '@/types'
import { formatRupiah } from '@/lib/printer'
import { Plus, Minus, Flame } from 'lucide-react'

interface Props {
  product: Product
  qty: number
  onAdd: (product: Product) => void
  onRemove: (productId: number) => void
  isLoading?: boolean
}

export function ProductCard({
  product,
  qty,
  onAdd,
  onRemove,
  isLoading = false,
}: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-soft animate-pulse flex flex-col justify-between h-72">
        <div className="w-full h-36 bg-slate-100 rounded-2xl mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded-md w-3/4" />
          <div className="h-3 bg-slate-100 rounded-md w-1/2" />
        </div>
        <div className="h-8 bg-slate-100 rounded-xl w-full mt-3" />
      </div>
    )
  }

  const isOutOfStock = product.stock <= 0
  const isSelected = qty > 0
  const imgSrc = product.image_url || ''

  const handleCardClick = () => {
    if (isOutOfStock) return
    onAdd(product)
  }

  return (
    <div
      onClick={isSelected ? undefined : handleCardClick}
      className={`group relative rounded-3xl p-3.5 bg-white border select-none transition-all duration-200 flex flex-col justify-between shadow-soft hover:shadow-card-hover ${
        isOutOfStock
          ? 'opacity-65 cursor-not-allowed border-slate-200 bg-slate-50/70'
          : isSelected
          ? 'border-amber-400 ring-2 ring-amber-300/60 bg-amber-50/20'
          : 'border-slate-100 hover:border-amber-200 hover:-translate-y-1 cursor-pointer'
      }`}
    >
      {/* Top Image Showcase */}
      <div className="relative w-full aspect-square max-h-40 sm:max-h-48 rounded-2xl overflow-hidden bg-slate-50 mb-3 flex items-center justify-center">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={product.name}
            className={`object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? 'grayscale contrast-75' : ''}`}
          />
        ) : (
          <span className="text-4xl">🧆</span>
        )}

        {/* Floating Category/Highlight Badge */}
        {product.badge && (
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-black text-amber-300 shadow-sm flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>{product.badge}</span>
          </div>
        )}

        {/* Stock Status Pill */}
        <div className="absolute top-2 right-2">
          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs flex items-center gap-1.5 ${
              isOutOfStock
                ? 'bg-rose-500/90 text-white'
                : product.stock <= 5
                ? 'bg-amber-500/90 text-white'
                : 'bg-emerald-600/90 text-white'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOutOfStock
                  ? 'bg-white'
                  : product.stock <= 5
                  ? 'bg-white animate-ping'
                  : 'bg-emerald-200'
              }`}
            />
            {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">
            {product.category || 'Gorengan Hangat'}
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug line-clamp-1 group-hover:text-amber-950">
            {product.name}
          </h3>
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
            {product.description || 'Kulit renyah lembut isian melimpah'}
          </p>
        </div>

        {/* Bottom row: Price & Action */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-slate-400 font-medium block -mb-0.5">Harga</span>
            <span className="text-base sm:text-lg font-black tabular-nums text-orange-600">
              Rp {formatRupiah(product.price)}
            </span>
          </div>

          {/* Stepper or Add button */}
          {isSelected ? (
            <div
              className="flex items-center gap-1.5 bg-amber-500/10 p-1 rounded-2xl border border-amber-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onRemove(product.id)}
                aria-label="Kurangi 1"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white text-amber-950 font-black flex items-center justify-center active:scale-90 shadow-xs hover:bg-amber-50 transition-transform"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="text-xs sm:text-sm font-black text-amber-950 tabular-nums px-1.5">
                {qty}
              </span>

              <button
                type="button"
                onClick={() => onAdd(product)}
                disabled={qty >= product.stock}
                aria-label="Tambah 1"
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-black flex items-center justify-center active:scale-90 shadow-xs transition-transform ${
                  qty >= product.stock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 text-amber-950 hover:bg-amber-400'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleCardClick}
              aria-label="Tambah ke keranjang"
              className={`h-9 px-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white group-hover:bg-amber-500 group-hover:text-amber-950'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pesan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
