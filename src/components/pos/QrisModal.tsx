'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { formatRupiah } from '@/lib/printer'
import { QrCode, X, Check, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  isOpen: boolean
  totalAmount: number
  onConfirm: (issuer: string) => Promise<void>
  onClose: () => void
}

const QRIS_ISSUERS = [
  'Umum',
  'GoPay',
  'DANA',
  'ShopeePay',
  'BCA',
  'BRI',
  'Mandiri',
  'Muamalat',
]

export function QrisModal({
  isOpen,
  totalAmount,
  onConfirm,
  onClose,
}: Props) {
  const [showQR, setShowQR] = useState<boolean>(false)
  const [selectedIssuer, setSelectedIssuer] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleClose = () => {
    setShowQR(false)
    setSelectedIssuer('')
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (!selectedIssuer || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onConfirm(selectedIssuer)
    } catch {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-[fadeIn_0.15s_ease-out]"
      onClick={isSubmitting ? undefined : handleClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag handle */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                QRIS Bank Muamalat
              </h2>
              <span className="text-[11px] text-slate-500 font-semibold">
                NMID: ID1020038291024
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Total Bill Display */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 mb-3.5 text-center">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-0.5">
            Total Tagihan
          </span>
          <span className="text-3xl sm:text-4xl font-black tabular-nums text-indigo-950">
            Rp {formatRupiah(totalAmount)}
          </span>
        </div>

        {/* Toggle QR Code View */}
        <div className="mb-4 text-center">
          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
              showQR
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{showQR ? 'Sembunyikan QR Code' : 'Tampilkan QR Code Muamalat'}</span>
          </button>

          {showQR && (
            <div className="mt-3 p-4 bg-white border border-indigo-100 rounded-3xl inline-block shadow-soft animate-[fadeIn_0.2s_ease-out]">
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden p-2">
                <Image
                  src="/qris-muamalat.svg"
                  alt="QRIS Muamalat Risol Berkah"
                  width={180}
                  height={180}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-2">
                A/N: Risol Berkah Ummat
              </p>
            </div>
          )}
        </div>

        {/* Issuer Selection */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-2">
            Pilih Aplikasi Pembayaran Customer:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {QRIS_ISSUERS.map((issuer) => {
              const isSelected = selectedIssuer === issuer
              return (
                <button
                  key={issuer}
                  type="button"
                  onClick={() => setSelectedIssuer(issuer)}
                  disabled={isSubmitting}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-extrabold ring-2 ring-indigo-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {issuer}
                </button>
              )
            })}
          </div>
        </div>

        {/* Verification Warning Box */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 mb-4 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-900 leading-snug font-medium">
            <strong>Wajib Verifikasi:</strong> Pastikan notifikasi dana masuk di aplikasi Muamalat / SMS banking sebelum konfirmasi selesai.
          </div>
        </div>

        {/* Confirm and print button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedIssuer || isSubmitting}
          className={`w-full h-13 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
            !selectedIssuer || isSubmitting
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-700/20'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Memproses & Mencetak Struk...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Konfirmasi QRIS Lunas & Cetak</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
