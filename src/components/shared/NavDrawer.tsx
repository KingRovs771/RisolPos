'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { SessionUser, Outlet } from '@/types'
import {
  X,
  Store,
  Crown,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Printer,
  LogOut,
  MapPin,
  ChevronRight,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  session: SessionUser
  outlets: Outlet[]
  selectedOutletId: string
  onSelectOutlet: (outletId: string) => void
  printerStatus: string
  onConnectPrinter: () => Promise<boolean>
  onLogout: () => void
}

export function NavDrawer({
  isOpen,
  onClose,
  session,
  outlets,
  selectedOutletId,
  onSelectOutlet,
  printerStatus,
  onConnectPrinter,
  onLogout,
}: Props) {
  const router = useRouter()
  if (!isOpen) return null

  const isOwner = session.role === 'OWNER'

  const handleGoToPos = () => {
    onClose()
    router.push('/pos')
  }

  const handleGoToOwnerTab = (tab?: string) => {
    onClose()
    if (!isOwner) return
    router.push(tab ? `/owner?tab=${tab}` : '/owner')
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm select-none animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto no-scrollbar animate-[slideRight_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
                🧆
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">RisolPOS</h2>
                <span className="text-[11px] font-bold text-amber-700">Berkah Ummat UMKM</span>
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

          {/* User & Role Badge Card */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  isOwner ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isOwner ? <Crown className="w-5 h-5" /> : <Store className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 leading-tight">{session.name}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  {isOwner ? '👑 Pemilik Usaha (Owner)' : '🧑‍🍳 Kasir Gerobak'}
                </div>
              </div>
            </div>

            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isOwner ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {session.role}
            </span>
          </div>

          {/* Active Outlet Selection */}
          <div className="mt-4">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              🏬 Gerobak Bertugas:
            </label>
            <div className="space-y-1.5">
              {outlets.map(o => {
                const isSelected = o.id === selectedOutletId
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onSelectOutlet(o.id)}
                    className={`w-full p-2.5 rounded-2xl text-left border transition-all active:scale-95 flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-200/50'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MapPin
                        className={`w-4 h-4 flex-shrink-0 ${
                          isSelected ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      />
                      <div className="truncate">
                        <div
                          className={`text-xs font-black truncate ${
                            isSelected ? 'text-amber-950' : 'text-slate-800'
                          }`}
                        >
                          {o.name}
                        </div>
                        {o.address && (
                          <div className="text-[10px] text-slate-400 truncate font-medium">
                            {o.address}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation Menu Links */}
          <div className="mt-5 space-y-1">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-2 mb-1">
              Menu Navigasi
            </div>

            {/* POS Cashier - Available to all */}
            <button
              type="button"
              onClick={handleGoToPos}
              className="w-full p-3 rounded-2xl hover:bg-slate-100 text-left flex items-center justify-between font-bold text-xs text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Kasir POS (Layar Jual)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* OWNER ONLY MENUS - COMPLETELY HIDDEN FROM CASHIERS */}
            {isOwner && (
              <>
                <div className="pt-2 text-[10px] font-black text-amber-800 uppercase tracking-wider px-2">
                  Akses Khusus Owner
                </div>

                {/* Owner Dashboard */}
                <button
                  type="button"
                  onClick={() => handleGoToOwnerTab()}
                  className="w-full p-3 rounded-2xl bg-amber-50/50 hover:bg-amber-100/70 text-left flex items-center justify-between font-black text-xs text-amber-950 transition-colors border border-amber-200/60"
                >
                  <div className="flex items-center gap-3">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>Dashboard Metrik Bisnis</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-700" />
                </button>

                {/* Stock Management */}
                <button
                  type="button"
                  onClick={() => handleGoToOwnerTab('stock')}
                  className="w-full p-3 rounded-2xl hover:bg-slate-100 text-left flex items-center justify-between font-bold text-xs text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Kelola Stok Per Outlet</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Expenses */}
                <button
                  type="button"
                  onClick={() => handleGoToOwnerTab('expenses')}
                  className="w-full p-3 rounded-2xl hover:bg-slate-100 text-left flex items-center justify-between font-bold text-xs text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 text-amber-600" />
                    <span>Catat Pengeluaran Bahan</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Reports */}
                <button
                  type="button"
                  onClick={() => handleGoToOwnerTab('summary')}
                  className="w-full p-3 rounded-2xl hover:bg-slate-100 text-left flex items-center justify-between font-bold text-xs text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>Laporan Omzet & Keuntungan</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* User & Staff Management */}
                <button
                  type="button"
                  onClick={() => handleGoToOwnerTab('users')}
                  className="w-full p-3 rounded-2xl hover:bg-slate-100 text-left flex items-center justify-between font-bold text-xs text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Kelola Karyawan & User</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </>
            )}

            {/* Printer connection */}
            <button
              type="button"
              onClick={() => {
                onConnectPrinter()
              }}
              className="w-full p-3 rounded-2xl hover:bg-slate-100 text-left flex items-center justify-between font-bold text-xs text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Printer className="w-4 h-4 text-slate-600" />
                <span>
                  Printer Thermal (
                  <strong
                    className={
                      printerStatus === 'connected' ? 'text-emerald-600' : 'text-slate-500'
                    }
                  >
                    {printerStatus === 'connected' ? 'Terhubung' : 'Terputus'}
                  </strong>
                  )
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Footer: Logout */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onLogout}
            className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>
      </div>
    </div>
  )
}
