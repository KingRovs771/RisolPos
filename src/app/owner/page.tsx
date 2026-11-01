'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Transaction,
  PurchaseExpense,
  Product,
  ReceiptData,
  StockAuditItem,
  Outlet,
  StockMoveType,
  OutletStockItem,
  StockMovement,
} from '@/types'
import { usePrinter } from '@/hooks/usePrinter'
import { TopBar } from '@/components/shared/TopBar'
import { useToast } from '@/components/shared/Toast'
import { MetricCard } from '@/components/owner/MetricCard'
import {
  DateFilter,
  DatePreset,
  calculateDateRange,
  getWIBDateString,
} from '@/components/owner/DateFilter'
import { StockTable } from '@/components/owner/StockTable'
import { HistoryList } from '@/components/owner/HistoryList'
import { StockAdjustForm } from '@/components/owner/StockAdjustForm'
import { ExpenseForm } from '@/components/owner/ExpenseForm'
import { NavDrawer } from '@/components/shared/NavDrawer'
import { UserManagement, AppUser } from '@/components/owner/UserManagement'
import { SalesAnalyticsChart } from '@/components/owner/SalesAnalyticsChart'
import { ProductManagement } from '@/components/owner/ProductManagement'
import { OutletManagement } from '@/components/owner/OutletManagement'
import { ReceiptModal } from '@/components/shared/ReceiptModal'
import { formatWIBDateTime, downloadReceiptPdf } from '@/lib/printer'
import { BarChart3, Package, ShoppingCart, Store, Building2, Users, Sparkles } from 'lucide-react'

import { useIsMounted, getClientSession } from '@/hooks/useMounted'

export default function OwnerPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { status: printerStatus, deviceName: printerName, connect: connectPrinter, print: printReceipt } = usePrinter()

  const isMounted = useIsMounted()
  const session = isMounted ? getClientSession() : null

  const [activeTab, setActiveTab] = useState<'summary' | 'products' | 'stock' | 'expenses' | 'users' | 'outlets'>(() => {
    if (typeof window === 'undefined') return 'summary'
    const tabParam = new URLSearchParams(window.location.search).get('tab')
    return tabParam === 'outlets' || tabParam === 'products' || tabParam === 'stock' || tabParam === 'expenses' || tabParam === 'users' ? tabParam : 'summary'
  })
  const [showNavDrawer, setShowNavDrawer] = useState<boolean>(false)
  const [datePreset, setDatePreset] = useState<DatePreset>('today')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => calculateDateRange('today'))

  // Outlets state
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('ALL')

  // Clean real-time states (No Dummy Data)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expenses, setExpenses] = useState<PurchaseExpense[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [outletStocks, setOutletStocks] = useState<OutletStockItem[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [stockAudit, setStockAudit] = useState<StockAuditItem[]>([])
  const [usersList, setUsersList] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null)

  // STRICT AUTHORIZATION GUARD ON MOUNT
  useEffect(() => {
    if (!isMounted) return
    const currentSession = getClientSession()
    if (!currentSession) {
      router.replace('/login')
      return
    }

    if (currentSession.role !== 'OWNER') {
      showToast('error', 'Akses Ditolak: Halaman khusus Pemilik Usaha (Owner).')
      router.replace('/pos')
    }
  }, [isMounted, router, showToast])

  // Load Outlets from API
  useEffect(() => {
    let active = true
    async function loadOutlets() {
      try {
        const res = await fetch('/api/outlets')
        if (res.ok) {
          const json = await res.json()
          if (active && Array.isArray(json.data)) {
            setOutlets(json.data)
          }
        }
      } catch {
        // fallback
      }
    }
    loadOutlets()
    return () => {
      active = false
    }
  }, [refreshKey])

  // Load Users from API
  useEffect(() => {
    let active = true
    async function fetchUsers() {
      try {
        const res = await fetch('/api/owner/users')
        if (res.ok) {
          const json = await res.json()
          if (active && Array.isArray(json.data)) {
            setUsersList(json.data)
          }
        }
      } catch {
        // ignore
      }
    }
    fetchUsers()
    return () => {
      active = false
    }
  }, [refreshKey])

  // Load Monitoring Data from API + Real-time Auto-Polling
  useEffect(() => {
    let active = true

    async function loadData(silent = false) {
      if (!silent && active) {
        setIsSyncing(true)
      }
      try {
        const res = await fetch(
          `/api/owner/monitoring?startDate=${encodeURIComponent(dateRange.start)}&endDate=${encodeURIComponent(dateRange.end)}&outletId=${encodeURIComponent(selectedOutletFilter)}`,
          { cache: 'no-store' }
        )
        if (res.ok) {
          const json = await res.json()
          if (active && json.data) {
            if (Array.isArray(json.data.transactions)) {
              setTransactions(json.data.transactions)
            }
            if (Array.isArray(json.data.expenses)) {
              setExpenses(json.data.expenses)
            }
            if (Array.isArray(json.data.products)) {
              setProducts(json.data.products)
            }
            if (Array.isArray(json.data.outletStocks)) {
              setOutletStocks(json.data.outletStocks)
            }
            if (Array.isArray(json.data.stockMovements)) {
              setStockMovements(json.data.stockMovements)
            }
            if (Array.isArray(json.data.stockAudit)) {
              setStockAudit(json.data.stockAudit)
            }
            const now = new Date()
            setLastUpdated(
              now.toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            )
          }
        }
      } catch {
        // Fallback
      } finally {
        if (active) {
          setIsLoading(false)
          setIsSyncing(false)
        }
      }
    }

    loadData(false)

    // Real-time background polling every 4 seconds
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData(true)
      }
    }, 4000)

    const handleFocus = () => loadData(true)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(true)
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      active = false
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [dateRange, refreshKey, selectedOutletFilter])

  // Filter transactions by selected outlet
  const filteredTransactions = transactions.filter(t => {
    if (selectedOutletFilter === 'ALL') return true
    return t.outlet_id === selectedOutletFilter
  })

  // Filter stock movements by selected outlet
  const filteredStockMovements = stockMovements.filter(sm => {
    if (selectedOutletFilter === 'ALL') return true
    return sm.outlet_id === selectedOutletFilter
  })

  const selectedOutletName =
    selectedOutletFilter === 'ALL'
      ? 'Semua Gerobak'
      : outlets.find(o => o.id === selectedOutletFilter)?.name || 'Gerobak'

  // Aggregate Metrics based on outlet filter
  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + (t.total_amount || 0), 0)
  const cashRevenue = filteredTransactions
    .filter(t => t.payment_method === 'CASH')
    .reduce((acc, t) => acc + (t.total_amount || 0), 0)
  const qrisRevenue = filteredTransactions
    .filter(t => t.payment_method === 'QRIS_MUAMALAT')
    .reduce((acc, t) => acc + (t.total_amount || 0), 0)

  // Total Pcs Sold
  const totalPcs = filteredTransactions.reduce((acc, t) => {
    const pcsInTx = (t.items || []).reduce((iAcc, item) => iAcc + item.qty, 0)
    return acc + pcsInTx
  }, 0)

  const totalExpenseCost = expenses.reduce((acc, e) => acc + (e.total_cost || 0), 0)
  const netCash = totalRevenue - totalExpenseCost

  // Stock Adjustment Action
  const handleStockAdjust = async (payload: {
    productId: number
    outletId: string
    movementType: StockMoveType
    qtyChange: number
    notes?: string
    targetOutletId?: string
  }) => {
    try {
      const res = await fetch('/api/owner/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          userId: session?.id || null,
        }),
      })
      if (!res.ok) {
        showToast('error', 'Gagal menyimpan perubahan stok ke server')
        return
      }
    } catch {
      showToast('error', 'Gagal terhubung ke server')
      return
    }

    const outletName = outlets.find(o => o.id === payload.outletId)?.name || 'Outlet'
    showToast('success', `Stok ${outletName} berhasil diperbarui secara realtime!`)
    setRefreshKey(prev => prev + 1)
  }

  // Add Expense Action
  const handleAddExpense = async (payload: {
    itemName: string
    qtyDescription?: string
    totalCost: number
  }) => {
    const newExpense: PurchaseExpense = {
      id: `exp-${Date.now()}`,
      user_id: session?.id || 'owner-1',
      item_name: payload.itemName,
      qty_description: payload.qtyDescription || null,
      total_cost: payload.totalCost,
      purchase_date: getWIBDateString(),
      created_at: new Date().toISOString(),
    }

    try {
      const res = await fetch('/api/owner/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      })
      if (!res.ok) {
        console.warn('API /api/owner/expenses unavailable, saving locally')
      }
    } catch {
      console.warn('Network issue, saved locally')
    }

    setExpenses(prev => [newExpense, ...prev])
    showToast('success', 'Catatan kulakan berhasil ditambahkan!')
  }

  // Thermal Reprint & Preview Handler
  const handleReprint = async (transaction: Transaction) => {
    const txItems = transaction.items || []
    const receiptData: ReceiptData = {
      invoiceNumber: transaction.invoice_number,
      datetime: transaction.created_at
        ? formatWIBDateTime(new Date(transaction.created_at))
        : '-',
      cashierName: `${transaction.cashier_name || 'Kasir'} (Copy)`,
      items: txItems.map(item => ({
        name: item.product_name,
        qty: item.qty,
        price: item.price_at_sale,
        subtotal: item.subtotal,
      })),
      totalPcs: txItems.reduce((acc, i) => acc + i.qty, 0),
      totalAmount: transaction.total_amount,
      paymentMethod: transaction.payment_method,
      cashReceived: transaction.cash_received || undefined,
      changeAmount: transaction.change_amount || undefined,
      qrisIssuer: transaction.qris_issuer || undefined,
    }

    setActiveReceipt(receiptData)

    if (printerStatus === 'connected') {
      const success = await printReceipt(receiptData)
      if (success) {
        showToast('success', 'Struk salinan berhasil dicetak via Bluetooth!')
      }
    } else {
      downloadReceiptPdf(receiptData)
      showToast('info', 'Printer Off: Struk otomatis disimpan sebagai PDF!')
    }
  }

  // Toggle Reconciled Status
  const handleToggleReconcile = async (id: string, current: boolean) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, is_reconciled: !current } : t))
    )

    try {
      await fetch('/api/owner/reconcile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: id,
          isReconciled: !current,
        }),
      })
    } catch {
      // offline fallback
    }

    showToast(
      'info',
      !current
        ? 'Transaksi ditandai Rekonsiliasi (Sudah Masuk Mutasi)'
        : 'Status rekonsiliasi dibatalkan'
    )
  }

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('risolpos_session')
    router.replace('/login')
  }

  // Guard return: consistent on SSR and client hydration
  if (!isMounted || !session || session.role !== 'OWNER') {
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 animate-bounce">
            🧆
          </div>
          <div className="text-xs font-black text-slate-600">Memuat Dashboard Owner...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/70 relative select-none pb-24 pt-20">
      {/* Top Bar with Nav Menu */}
      <TopBar
        title="Dashboard Owner"
        subtitle={`${session.name} • Manajemen Gerobak Risol`}
        printerStatus={printerStatus}
        printerDeviceName={printerName}
        onConnectPrinter={connectPrinter}
        onLogout={handleLogout}
        onOpenNavDrawer={() => setShowNavDrawer(true)}
        isOwner={true}
        rightExtra={
          <button
            type="button"
            onClick={() => router.push('/pos')}
            title="Ke Layar Kasir"
            className="px-3 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Kasir</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-3xl p-1.5 border border-slate-100 shadow-soft mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'summary'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Grafik & Ringkasan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'products'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Katalog Menu Risol</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'stock'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <Package className="w-4 h-4 text-indigo-400" />
            <span>Stok Gerobak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'expenses'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span>Catat Kulakan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outlets')}
            className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'outlets'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <Store className="w-4 h-4 text-rose-400" />
            <span>Outlet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Kasir & PIN Outlet</span>
          </button>
        </div>

        {/* Outlet Filter Bar (Available for Summary & Stock) */}
        {activeTab !== 'users' && activeTab !== 'products' && activeTab !== 'outlets' && (
          <div className="bg-white rounded-2xl p-2.5 px-3.5 border border-slate-100 shadow-soft mb-4 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 flex-shrink-0">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Filter Gerobak:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedOutletFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  selectedOutletFilter === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Semua Gerobak
              </button>

              {outlets.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOutletFilter(o.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                    selectedOutletFilter === o.id
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {o.name.split(' - ')[1] || o.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 1: Ringkasan & Transaksi */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Date Filter Bar */}
            <DateFilter
              selectedPreset={datePreset}
              dateRange={dateRange}
              onSelectPreset={(preset, range) => {
                setDatePreset(preset)
                setDateRange(range)
              }}
            />

            {/* Financial Metrics Cards Grid */}
            <MetricCard
              totalRevenue={totalRevenue}
              totalPcs={totalPcs}
              cashRevenue={cashRevenue}
              qrisRevenue={qrisRevenue}
              totalExpenses={totalExpenseCost}
              netCash={netCash}
              isLoading={isLoading}
            />

            {/* Visual Real-time Sales Analytics Chart */}
            <SalesAnalyticsChart
              transactions={transactions}
              outlets={outlets}
            />

            {/* Transaction History & Reprint */}
            <HistoryList
              transactions={filteredTransactions}
              onReprint={handleReprint}
              onToggleReconcile={handleToggleReconcile}
            />
          </div>
        )}

        {/* Tab 2: Katalog Menu Risol Baru & Harga */}
        {activeTab === 'products' && (
          <ProductManagement
            products={products}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        )}

        {activeTab === 'outlets' && (
          <OutletManagement outlets={outlets} onRefresh={() => setRefreshKey(prev => prev + 1)} />
        )}

        {/* Tab 3: Kelola Stok Per Outlet & Restock */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <DateFilter
              selectedPreset={datePreset}
              dateRange={dateRange}
              onSelectPreset={(preset, range) => {
                setDatePreset(preset)
                setDateRange(range)
              }}
            />

            {outlets.length === 0 || products.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                Tambahkan minimal satu outlet dan satu menu terlebih dahulu untuk mengelola stok.
              </div>
            ) : (
              <StockAdjustForm
                key={`${outlets.map(o => o.id).join('|')}-${products.length}-${selectedOutletFilter}`}
                products={products}
                outlets={outlets}
                outletStocks={outletStocks}
                initialOutletId={outlets[0]!.id}
                selectedOutletFilter={selectedOutletFilter}
                onAdjust={handleStockAdjust}
              />
            )}

            <StockTable
              stockAudit={stockAudit}
              products={products}
              stockMovements={filteredStockMovements}
              outletName={selectedOutletName}
              lastUpdated={lastUpdated}
              isSyncing={isSyncing}
              onRefresh={() => setRefreshKey(prev => prev + 1)}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Tab 4: Catat Pengeluaran Bahan */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <ExpenseForm
              onAddExpense={handleAddExpense}
            />

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft">
              <h3 className="text-sm font-black text-slate-900 mb-3">
                Daftar Belanja Bahan Baku ({expenses.length})
              </h3>
              {expenses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-bold">
                  Belum ada catatan belanja bahan pada periode ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map(exp => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-black text-slate-900">{exp.item_name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {exp.qty_description ? `${exp.qty_description} • ` : ''}
                          {exp.purchase_date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-rose-600">
                          -Rp {exp.total_cost.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Kelola Karyawan & User */}
        {activeTab === 'users' && (
          <UserManagement
            users={usersList}
            outlets={outlets}
            currentUserId={session.id}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        )}
      </div>

      {/* Nav Drawer */}
      <NavDrawer
        isOpen={showNavDrawer}
        onClose={() => setShowNavDrawer(false)}
        session={session}
        outlets={outlets}
        selectedOutletId={outlets[0]?.id || ''}
        onSelectOutlet={() => {}}
        printerStatus={printerStatus}
        onConnectPrinter={connectPrinter}
        onLogout={handleLogout}
      />

      {/* Receipt Preview, Print & PDF Download Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        printerStatus={printerStatus}
        printerDeviceName={printerName}
        onConnectPrinter={connectPrinter}
        onPrintBluetooth={printReceipt}
        onToast={showToast}
      />
    </div>
  )
}
