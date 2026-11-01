'use client'

import React, { useState } from 'react'
import { ReceiptData } from '@/types'
import { PrinterStatus } from '@/hooks/usePrinter'
import {
  formatRupiah,
  downloadReceiptPdf,
  printReceiptWindow,
} from '@/lib/printer'
import {
  X,
  Download,
  Printer,
  Bluetooth,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react'

interface Props {
  receipt: ReceiptData | null
  onClose: () => void
  printerStatus: PrinterStatus
  printerDeviceName?: string | null
  onConnectPrinter: () => Promise<boolean>
  onPrintBluetooth: (receipt: ReceiptData) => Promise<boolean>
  onToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function ReceiptModal({
  receipt,
  onClose,
  printerStatus,
  printerDeviceName,
  onConnectPrinter,
  onPrintBluetooth,
  onToast,
}: Props) {
  const [isPrintingBt, setIsPrintingBt] = useState(false)

  if (!receipt) return null

  const isPrinterOn = printerStatus === 'connected'

  const handleDownloadPdf = () => {
    downloadReceiptPdf(receipt)
    onToast?.('success', `Struk ${receipt.invoiceNumber}.pdf berhasil diunduh!`)
  }

  const handleBluetoothPrint = async () => {
    setIsPrintingBt(true)
    try {
      if (!isPrinterOn) {
        const connected = await onConnectPrinter()
        if (!connected) {
          onToast?.(
            'error',
            'Printer Bluetooth belum terhubung. Gunakan tombol Download PDF untuk menyimpan struk.'
          )
          return
        }
      }
      const ok = await onPrintBluetooth(receipt)
      if (ok) {
        onToast?.('success', 'Struk berhasil dicetak ke printer thermal!')
      } else {
        onToast?.('error', 'Gagal mencetak ke printer Bluetooth. Silakan unduh PDF.')
      }
    } finally {
      setIsPrintingBt(false)
    }
  }

  const handleBrowserPrint = () => {
    printReceiptWindow(receipt)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar animate-[fadeIn_0.15s_ease-out]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Cetak & Simpan Struk
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">
                Nota #{receipt.invoiceNumber}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printer Status Banner */}
        <div
          className={`mt-3 p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
            isPrinterOn
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {isPrinterOn ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="font-black">
                {isPrinterOn
                  ? `Printer Aktif (${printerDeviceName || 'Bluetooth'})`
                  : 'Printer Off / Tidak Terhubung'}
              </div>
              <div className="text-[11px] opacity-80 font-medium">
                {isPrinterOn
                  ? 'Siap cetak langsung ke kertas thermal 58mm'
                  : 'Struk dapat diunduh sebagai file PDF atau dicetak via browser'}
              </div>
            </div>
          </div>
        </div>

        {/* 58mm Thermal Paper Visual Preview */}
        <div className="my-4 mx-auto max-w-[300px] bg-amber-50/30 border border-dashed border-slate-300 rounded-2xl p-4 font-mono text-xs text-slate-900 shadow-inner">
          <div className="text-center font-black text-sm tracking-tight">
            RISOL UMKM BERKAH
          </div>
          <div className="text-center text-[11px] text-slate-500">
            Struk Pembayaran Resmi
          </div>

          <div className="border-t border-dashed border-slate-300 my-2.5" />

          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Nota:</span>
              <span className="font-bold">{receipt.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu:</span>
              <span>{receipt.datetime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kasir:</span>
              <span className="truncate max-w-[170px] text-right">
                {receipt.cashierName}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2.5" />

          {/* Items */}
          <div className="space-y-2">
            {receipt.items.map((item, idx) => (
              <div key={idx}>
                <div className="font-bold text-slate-900 leading-tight">
                  {item.name}
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>
                    {item.qty} x Rp {formatRupiah(item.price)}
                  </span>
                  <span className="font-bold text-slate-900">
                    Rp {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 my-2.5" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Total Item</span>
              <span>{receipt.totalPcs} Pcs</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-0.5">
              <span>TOTAL BAYAR</span>
              <span>Rp {formatRupiah(receipt.totalAmount)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2.5" />

          {/* Payment Info */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Metode</span>
              <span className="font-bold">
                {receipt.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS MUAMALAT'}
              </span>
            </div>
            {receipt.paymentMethod === 'CASH' ? (
              <>
                {receipt.cashReceived !== undefined && (
                  <div className="flex justify-between">
                    <span>Tunai Diterima</span>
                    <span>Rp {formatRupiah(receipt.cashReceived)}</span>
                  </div>
                )}
                {receipt.changeAmount !== undefined && (
                  <div className="flex justify-between font-bold">
                    <span>Kembalian</span>
                    <span>Rp {formatRupiah(receipt.changeAmount)}</span>
                  </div>
                )}
              </>
            ) : (
              receipt.qrisIssuer && (
                <div className="flex justify-between">
                  <span>Aplikasi QRIS</span>
                  <span className="font-bold">{receipt.qrisIssuer}</span>
                </div>
              )
            )}
          </div>

          <div className="border-t border-dashed border-slate-300 my-2.5" />

          <div className="text-center font-black text-emerald-700 tracking-wider py-0.5">
            STATUS : LUNAS
          </div>

          <div className="border-t border-dashed border-slate-300 my-2.5" />

          <div className="text-center text-[10px] text-slate-500 leading-relaxed">
            Terima Kasih Atas Pembelian
            <br />
            Risol Hangat Kami!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Primary PDF Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Simpan / Download PDF ({receipt.invoiceNumber}.pdf)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* Bluetooth Thermal Print Button */}
            <button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isPrintingBt}
              className="py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <Bluetooth className="w-4 h-4 text-amber-400" />
              <span>
                {isPrintingBt
                  ? 'Mencetak...'
                  : isPrinterOn
                  ? 'Cetak Thermal'
                  : 'Hubungkan & Cetak'}
              </span>
            </button>

            {/* Browser Print Dialog Button */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Browser</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

