'use client'

import React from 'react'
import { PrinterStatus } from './PrinterStatus'
import { PrinterStatus as StatusType } from '@/hooks/usePrinter'
import { LogOut, Menu, Crown, MapPin } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  printerStatus: StatusType
  printerDeviceName?: string | null
  onConnectPrinter: () => Promise<boolean>
  onLogout?: () => void
  rightExtra?: React.ReactNode
  onOpenNavDrawer?: () => void
  currentOutletName?: string
  onOpenOutletSelector?: () => void
  isOwner?: boolean
  onOpenOwner?: () => void
}

export function TopBar({
  title,
  subtitle,
  printerStatus,
  printerDeviceName,
  onConnectPrinter,
  onLogout,
  rightExtra,
  onOpenNavDrawer,
  currentOutletName,
  onOpenOutletSelector,
  isOwner,
  onOpenOwner,
}: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-100 z-40 select-none">
      <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2.5">
        {/* Left: Hamburger Menu & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          {onOpenNavDrawer && (
            <button
              type="button"
              onClick={onOpenNavDrawer}
              title="Buka Menu Navigasi"
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-lg sm:text-xl shadow-md shadow-amber-500/20 flex-shrink-0">
              🧆
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-tight truncate">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center-Left: Current Outlet Pill */}
        {currentOutletName && onOpenOutletSelector && (
          <button
            type="button"
            onClick={onOpenOutletSelector}
            title="Ganti Gerobak / Outlet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs hover:bg-amber-100/80 active:scale-95 transition-all truncate max-w-[220px]"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate">{currentOutletName}</span>
          </button>
        )}

        {/* Right: Owner Hub (Owner Only!), Printer & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Prominent Owner Menu Button - ONLY VISIBLE IF IS OWNER */}
          {isOwner && onOpenOwner && (
            <button
              type="button"
              onClick={onOpenOwner}
              className="px-3 py-1.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              title="Buka Dashboard Owner"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Owner Hub</span>
            </button>
          )}

          {rightExtra}

          <PrinterStatus
            status={printerStatus}
            deviceName={printerDeviceName}
            onConnect={onConnectPrinter}
          />

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Keluar / Ganti Akun"
              className="w-9 h-9 rounded-2xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
