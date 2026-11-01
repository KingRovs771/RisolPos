'use client'

import React from 'react'
import { Outlet } from '@/types'
import { MapPin, X, Check, Store } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  outlets: Outlet[]
  selectedOutletId: string
  onSelectOutlet: (outletId: string) => void
}

export function OutletSelectorModal({
  isOpen,
  onClose,
  outlets,
  selectedOutletId,
  onSelectOutlet,
}: Props) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-[scaleUp_0.15s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Pilih Gerobak / Outlet
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                Katalog dan stok akan menyesuaikan outlet yang dipilih
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 my-3">
          {outlets.map(outlet => {
            const isSelected = outlet.id === selectedOutletId
            return (
              <button
                key={outlet.id}
                type="button"
                onClick={() => {
                  onSelectOutlet(outlet.id)
                  onClose()
                }}
                className={`w-full p-4 rounded-2xl text-left border transition-all active:scale-95 flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-50/80 border-2 border-amber-500 shadow-sm ring-2 ring-amber-200/50'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-black leading-tight ${
                        isSelected ? 'text-amber-950' : 'text-slate-900'
                      }`}
                    >
                      {outlet.name}
                    </h4>
                    {outlet.address && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {outlet.address}
                      </p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
