'use client'

import React from 'react'
import { PrinterStatus as StatusType } from '@/hooks/usePrinter'

interface Props {
  status: StatusType
  deviceName?: string | null
  onConnect: () => Promise<boolean>
  onDisconnect?: () => void
}

export function PrinterStatus({ status, deviceName, onConnect }: Props) {
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  return (
    <button
      type="button"
      onClick={onConnect}
      disabled={isConnecting}
      title={isConnected ? `Terhubung: ${deviceName || 'Thermal Printer'}` : 'Klik untuk hubungkan printer Bluetooth'}
      className={`h-10 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border select-none ${
        isConnected
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          : isConnecting
          ? 'bg-amber-50 text-amber-800 border-amber-300'
          : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
      }`}
    >
      {isConnecting ? (
        <>
          <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-600 border-t-transparent animate-spin inline-block" />
          <span>Printer ...</span>
        </>
      ) : isConnected ? (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-200" />
          <span>Printer ON</span>
        </>
      ) : (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ring-2 ring-rose-200" />
          <span>Printer OFF</span>
        </>
      )}
    </button>
  )
}
