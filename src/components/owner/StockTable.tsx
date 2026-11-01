'use client'

import React from 'react'
import { StockAuditItem, Product, StockMovement } from '@/types'
import { formatWIBDateTime } from '@/lib/printer'
import {
  Package,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Activity,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
} from 'lucide-react'

interface Props {
  stockAudit?: StockAuditItem[]
  items?: StockAuditItem[]
  products?: Product[]
  stockMovements?: StockMovement[]
  outletName?: string
  lastUpdated?: string | null
  isSyncing?: boolean
  onRefresh?: () => void
  isLoading?: boolean
}

export function StockTable({
  stockAudit,
  items,
  products = [],
  stockMovements = [],
  outletName = 'Semua Gerobak',
  lastUpdated = null,
  isSyncing = false,
  onRefresh,
  isLoading = false,
}: Props) {
  const auditList = stockAudit || items || []

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 animate-pulse">
        <div className="h-4 bg-slate-200 rounded-md w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // If auditList is empty, generate from products
  const displayItems: StockAuditItem[] =
    auditList.length > 0
      ? auditList
      : products.map(p => ({
          productId: p.id,
          name: p.name,
          currentStock: p.stock,
          inRestock: 0,
          outSale: 0,
          outWaste: 0,
          adjustment: 0,
          expectedStock: p.stock,
          hasDiscrepancy: false,
        }))

  const totalCurrentStock = displayItems.reduce((sum, i) => sum + i.currentStock, 0)
  const totalInRestock = displayItems.reduce((sum, i) => sum + i.inRestock, 0)
  const totalOutSale = displayItems.reduce((sum, i) => sum + i.outSale, 0)
  const totalOutWaste = displayItems.reduce((sum, i) => sum + i.outWaste, 0)

  return (
    <div className="space-y-4 select-none">
      {/* Main Audit Stock Table Card */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                  Audit Stok Fisik Risol ({outletName})
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>REALTIME</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                {lastUpdated
                  ? `Sinkronisasi otomatis • Update terakhir: ${lastUpdated} WIB`
                  : 'Rumus: Seharusnya = Stok Sistem (Masuk − Terjual − Rusak) vs Opname Fisik'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
                <span>{isSyncing ? 'Sinkron...' : 'Refresh'}</span>
              </button>
            )}
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {displayItems.length} Varian
            </span>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50/70 border-b border-slate-100 text-xs">
          <div className="bg-white rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Total Sisa Stok</span>
            <span className="font-black text-slate-900 tabular-nums">{totalCurrentStock} pcs</span>
          </div>
          <div className="bg-white rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between">
            <span className="text-emerald-700 font-semibold">Total Masuk</span>
            <span className="font-black text-emerald-600 tabular-nums">+{totalInRestock} pcs</span>
          </div>
          <div className="bg-white rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between">
            <span className="text-amber-700 font-semibold">Total Terjual</span>
            <span className="font-black text-amber-600 tabular-nums">{totalOutSale} pcs</span>
          </div>
          <div className="bg-white rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between">
            <span className="text-rose-700 font-semibold">Total Rusak/Keluar</span>
            <span className="font-black text-rose-600 tabular-nums">
              {totalOutWaste > 0 ? `-${totalOutWaste}` : '0'} pcs
            </span>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Varian Risol</th>
                <th className="py-3 px-3 text-center">Stok Fisik</th>
                <th className="py-3 px-3 text-center text-emerald-700">Masuk</th>
                <th className="py-3 px-3 text-center text-amber-700">Terjual</th>
                <th className="py-3 px-3 text-center text-rose-700">Rusak</th>
                <th className="py-3 px-3 text-center text-indigo-700">Opname</th>
                <th className="py-3 px-4 text-right">Seharusnya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                    Belum ada menu produk terdaftar. Tambahkan menu terlebih dahulu di Katalog Menu.
                  </td>
                </tr>
              ) : (
                displayItems.map(item => {
                  const isLowStock = item.currentStock < 10
                  return (
                    <tr key={item.productId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-black tabular-nums text-xs ${
                            item.currentStock <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.currentStock}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-emerald-600 tabular-nums">
                        +{item.inRestock}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-amber-600 tabular-nums">
                        {item.outSale > 0 ? `-${item.outSale}` : '0'}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-rose-600 tabular-nums">
                        {item.outWaste > 0 ? `-${item.outWaste}` : '0'}
                      </td>

                      <td className="py-3 px-3 text-center font-bold tabular-nums">
                        {item.adjustment === 0 ? (
                          <span className="text-slate-400">0</span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-black ${
                              item.adjustment > 0
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {item.adjustment > 0 ? `+${item.adjustment}` : item.adjustment}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums">
                        <div className="inline-flex items-center gap-1.5 font-black text-slate-900">
                          <span>{item.expectedStock}</span>
                          {item.hasDiscrepancy ? (
                            <span
                              title={`Ada selisih opname fisik (${
                                item.adjustment > 0 ? `+${item.adjustment}` : item.adjustment
                              } pcs) dibanding hitungan sistem (${item.expectedStock} pcs)!`}
                              className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md text-[10px] cursor-help"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>
                                Selisih {item.adjustment > 0 ? `+${item.adjustment}` : item.adjustment}
                              </span>
                            </span>
                          ) : (
                            <span
                              title="Stok fisik sesuai dengan transaksi sistem"
                              className="inline-flex items-center text-emerald-500"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Stock Movement Log (Audit Trail) */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                Log Pergerakan Stok Realtime ({outletName})
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Rekam jejak otomatis setiap Restock, Penjualan Kasir POS, Risol Rusak, & Opname Fisik
              </span>
            </div>
          </div>

          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>{stockMovements.length} Aktivitas</span>
          </span>
        </div>

        {stockMovements.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            Belum ada riwayat pergerakan stok pada periode & gerobak ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto no-scrollbar">
            {stockMovements.slice(0, 50).map(sm => {
              const isPositive = sm.qty_change > 0
              const typeBadge =
                sm.movement_type === 'IN_RESTOCK'
                  ? {
                      label: 'Restock Masuk',
                      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />,
                    }
                  : sm.movement_type === 'OUT_SALE'
                  ? {
                      label: 'Terjual POS',
                      cls: 'bg-amber-50 text-amber-800 border-amber-200',
                      icon: <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />,
                    }
                  : sm.movement_type === 'OUT_WASTE'
                  ? {
                      label: 'Rusak / Transfer',
                      cls: 'bg-rose-50 text-rose-700 border-rose-200',
                      icon: <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />,
                    }
                  : {
                      label: 'Opname Fisik',
                      cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                      icon: <Scale className="w-3.5 h-3.5 text-indigo-600" />,
                    }

              return (
                <div
                  key={sm.id}
                  className="p-3.5 px-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {typeBadge.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900">
                          {sm.product_name || `Produk #${sm.product_id}`}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${typeBadge.cls}`}
                        >
                          {typeBadge.label}
                        </span>
                        {sm.outlet_name && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {sm.outlet_name}
                          </span>
                        )}
                      </div>
                      {sm.notes && (
                        <div className="text-[11px] text-slate-600 font-medium mt-0.5 truncate">
                          {sm.notes}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {sm.created_at ? formatWIBDateTime(new Date(sm.created_at)) : '-'} WIB
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-black tabular-nums ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isPositive ? `+${sm.qty_change}` : sm.qty_change} pcs
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 tabular-nums mt-0.5">
                      Stok: {sm.stock_before} →{' '}
                      <span className="text-slate-700 font-black">{sm.stock_after}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
