'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Product, ReceiptData, Outlet, CartItem } from '@/types'
import { useCart } from '@/hooks/useCart'
import { usePrinter } from '@/hooks/usePrinter'
import { TopBar } from '@/components/shared/TopBar'
import { useToast } from '@/components/shared/Toast'
import { ProductCard } from '@/components/pos/ProductCard'
import { CartBottomBar } from '@/components/pos/CartBottomBar'
import { CashierSidebar } from '@/components/pos/CashierSidebar'
import { CashModal } from '@/components/pos/CashModal'
import { QrisModal } from '@/components/pos/QrisModal'
import { NavDrawer } from '@/components/shared/NavDrawer'
import { OutletSelectorModal } from '@/components/pos/OutletSelectorModal'
import { ReceiptModal } from '@/components/shared/ReceiptModal'
import { generateInvoiceNumber, formatWIBDateTime, downloadReceiptPdf } from '@/lib/printer'
import { Search, X, Sparkles, AlertCircle, MapPin, FileText } from 'lucide-react'
import { useIsMounted, getClientSession } from '@/hooks/useMounted'

const CATEGORIES = [
  { id: 'ALL', label: 'Semua Menu', icon: '✨' },
  { id: 'Best Seller', label: 'Best Seller', icon: '⭐' },
  { id: 'Pedas', label: 'Gurih & Pedas', icon: '🌶️' },
  { id: 'Original', label: 'Sayur Original', icon: '🥬' },
  { id: 'Manis', label: 'Manis Lumer', icon: '🍫' },
]

export default function PosPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const {
    status: printerStatus,
    deviceName: printerName,
    connect: connectPrinter,
    print: printReceipt,
  } = usePrinter()

  const isMounted = useIsMounted()
  const session = isMounted ? getClientSession() : null

  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    try {
      const stored = localStorage.getItem('risolpos_session')
      if (stored) {
        const u = JSON.parse(stored)
        if (u.role === 'CASHIER' && u.outlet_id) {
          return u.outlet_id
        }
      }
      return localStorage.getItem('risolpos_outlet_id') || ''
    } catch {
      return ''
    }
  })
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [currentInvoice, setCurrentInvoice] = useState<string>(() => {
    if (typeof window === 'undefined') return 'RSL-2410-001'
    return generateInvoiceNumber()
  })

  // Navigation and Modals
  const [showNavDrawer, setShowNavDrawer] = useState<boolean>(false)
  const [showOutletModal, setShowOutletModal] = useState<boolean>(false)
  const [showCashModal, setShowCashModal] = useState<boolean>(false)
  const [showQrisModal, setShowQrisModal] = useState<boolean>(false)
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null)
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null)

  // Check authentication on client mount
  useEffect(() => {
    if (!isMounted) return
    const currentSession = getClientSession()
    if (!currentSession || !currentSession.role) {
      router.replace('/login')
    }
  }, [isMounted, router])

  // Fetch Outlets
  useEffect(() => {
    let active = true
    async function loadOutlets() {
      try {
        const res = await fetch('/api/outlets')
        if (res.ok) {
          const json = await res.json()
          if (active && Array.isArray(json.data)) {
            const activeOutlets: Outlet[] = json.data.filter((o: Outlet) => o.is_active)
            setOutlets(activeOutlets)
            setSelectedOutletId(prev =>
              activeOutlets.some(o => o.id === prev) ? prev : activeOutlets[0]?.id || ''
            )
          }
        }
      } catch {
        // keep empty
      }
    }
    loadOutlets()
    return () => {
      active = false
    }
  }, [])

  // Fetch products for selected outlet (with real-time background sync)
  useEffect(() => {
    let active = true
    async function load() {
      if (!selectedOutletId) {
        if (active) setIsLoadingProducts(false)
        return
      }
      try {
        const res = await fetch(
          `/api/pos?outletId=${encodeURIComponent(selectedOutletId)}`,
          { cache: 'no-store' }
        )
        if (res.ok) {
          const json = await res.json()
          if (active && Array.isArray(json.data)) {
            setProducts(json.data)
          }
        }
      } catch {
        // keep previous state
      } finally {
        if (active) setIsLoadingProducts(false)
      }
    }
    load()

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load()
      }
    }, 5000)

    const handleFocus = () => load()
    window.addEventListener('focus', handleFocus)

    return () => {
      active = false
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
    }
  }, [selectedOutletId])

  // Cart Hook
  const {
    cartItems,
    totalPcs,
    totalAmount,
    getQty,
    addItem,
    removeItem,
    clearCart,
  } = useCart(products)

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [products, searchQuery, selectedCategory])

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('risolpos_session')
    router.replace('/login')
  }

  // Handle Switch Outlet
  const handleSelectOutlet = (outletId: string) => {
    setSelectedOutletId(outletId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('risolpos_outlet_id', outletId)
    }
    clearCart()
    const out = outlets.find(o => o.id === outletId)
    showToast('info', `Pindah ke: ${out?.name || outletId}`)
  }

  // Thermal Printing & PDF Fallback Handler
  const handlePrint = async (receipt: ReceiptData) => {
    setLastReceipt(receipt)
    setActiveReceipt(receipt)

    if (printerStatus === 'connected') {
      const success = await printReceipt(receipt)
      if (success) {
        showToast('success', 'Struk berhasil dicetak via Bluetooth!')
        return
      }
    }

    // Printer is off or disconnected: automatically save as PDF download
    downloadReceiptPdf(receipt)
    showToast('info', `Printer Off: Struk ${receipt.invoiceNumber}.pdf otomatis diunduh!`)
  }

  // Confirm CASH Transaction
  const handleConfirmCash = async (cashReceived: number) => {
    const change = Math.max(0, cashReceived - totalAmount)
    const invoiceNumber = currentInvoice
    const nowWIB = formatWIBDateTime(new Date())

    // Optimistically deduct local stock
    setProducts(prev =>
      prev.map(p => {
        const inCart = cartItems.find((i: CartItem) => i.product.id === p.id)
        if (inCart) {
          return { ...p, stock: Math.max(0, p.stock - inCart.qty) }
        }
        return p
      })
    )

    // Save to Database
    try {
      await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber,
          userId: session?.id || 'user-cashier',
          cashierName: session?.name || 'Kasir Gerobak',
          outletId: selectedOutletId,
          paymentMethod: 'CASH',
          cashReceived,
          changeAmount: change,
          items: cartItems.map((i: CartItem) => ({
            productId: i.product.id,
            name: i.product.name,
            qty: i.qty,
            price: i.product.price,
            subtotal: i.qty * i.product.price,
          })),
          totalAmount,
        }),
      })
    } catch {
      // Offline fallback
    }

    const receiptData: ReceiptData = {
      invoiceNumber,
      datetime: nowWIB,
      cashierName: `${session?.name || 'Kasir'} (${currentOutlet?.name || 'Gerobak'})`,
      items: cartItems.map((i: CartItem) => ({
        name: i.product.name,
        qty: i.qty,
        price: i.product.price,
        subtotal: i.qty * i.product.price,
      })),
      totalPcs,
      totalAmount,
      paymentMethod: 'CASH',
      cashReceived,
      changeAmount: change,
    }

    setShowCashModal(false)
    clearCart()
    setCurrentInvoice(generateInvoiceNumber())
    showToast('success', `Transaksi Berhasil! Kembalian: Rp ${change.toLocaleString('id-ID')}`)

    await handlePrint(receiptData)
  }

  // Confirm QRIS Transaction
  const handleConfirmQris = async (issuer: string) => {
    const invoiceNumber = currentInvoice
    const nowWIB = formatWIBDateTime(new Date())

    // Optimistically deduct local stock
    setProducts(prev =>
      prev.map(p => {
        const inCart = cartItems.find((i: CartItem) => i.product.id === p.id)
        if (inCart) {
          return { ...p, stock: Math.max(0, p.stock - inCart.qty) }
        }
        return p
      })
    )

    // Save to Database
    try {
      await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber,
          userId: session?.id || 'user-cashier',
          cashierName: session?.name || 'Kasir Gerobak',
          outletId: selectedOutletId,
          paymentMethod: 'QRIS_MUAMALAT',
          qrisIssuer: issuer,
          items: cartItems.map((i: CartItem) => ({
            productId: i.product.id,
            name: i.product.name,
            qty: i.qty,
            price: i.product.price,
            subtotal: i.qty * i.product.price,
          })),
          totalAmount,
        }),
      })
    } catch {
      // Offline fallback
    }

    const receiptData: ReceiptData = {
      invoiceNumber,
      datetime: nowWIB,
      cashierName: `${session?.name || 'Kasir'} (${currentOutlet?.name || 'Gerobak'})`,
      items: cartItems.map((i: CartItem) => ({
        name: i.product.name,
        qty: i.qty,
        price: i.product.price,
        subtotal: i.qty * i.product.price,
      })),
      totalPcs,
      totalAmount,
      paymentMethod: 'QRIS_MUAMALAT',
      qrisIssuer: issuer,
    }

    setShowQrisModal(false)
    clearCart()
    setCurrentInvoice(generateInvoiceNumber())
    showToast('success', `QRIS Lunas (${issuer})! Nota: ${invoiceNumber}`)

    await handlePrint(receiptData)
  }

  if (!isMounted || !session) {
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 animate-bounce">
            🧆
          </div>
          <div className="text-xs font-black text-slate-600">Memuat Kasir RisolPOS...</div>
        </div>
      </div>
    )
  }

  const isOwner = session.role === 'OWNER'
  const currentOutlet = outlets.find(o => o.id === selectedOutletId) || outlets[0]

  return (
    <div className="min-h-screen bg-slate-50/70 select-none pb-56 pt-20">
      {/* Top Bar with Responsive Layout & Outlet Selector */}
      <TopBar
        title="RisolPOS Kasir"
        subtitle={`${session.name} • ${currentOutlet?.name || 'Gerobak'}`}
        printerStatus={printerStatus}
        printerDeviceName={printerName}
        onConnectPrinter={connectPrinter}
        onLogout={handleLogout}
        onOpenNavDrawer={() => setShowNavDrawer(true)}
        currentOutletName={currentOutlet?.name}
        onOpenOutletSelector={isOwner ? () => setShowOutletModal(true) : undefined}
        isOwner={isOwner}
        onOpenOwner={isOwner ? () => router.push('/owner') : undefined}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Main Grid: Responsive Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Showcase & Menu */}
          <main className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Header / Search / Outlet Pill Bar */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      Selamat Datang, {session.name.split(' ')[0]} 👋
                    </h2>
                  </div>

                  {/* Outlet Info / Switch Prompt */}
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => setShowOutletModal(true)}
                      className="flex items-center gap-1.5 text-xs text-amber-700 font-bold mt-0.5 hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Gerobak: {currentOutlet?.name}</span>
                      <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.2 rounded-md font-bold">
                        Ganti Outlet
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gerobak: {currentOutlet?.name}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-black">
                        Terkunci Khusus
                      </span>
                    </div>
                  )}
                </div>

                {/* Live Search Input & Last Receipt Button */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {lastReceipt && (
                    <button
                      type="button"
                      onClick={() => setActiveReceipt(lastReceipt)}
                      className="px-3 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-black text-xs flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Struk Terakhir</span>
                    </button>
                  )}

                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Cari varian risol..."
                      className="w-full pl-9 pr-8 py-2 rounded-2xl bg-slate-100/70 text-slate-900 text-xs font-bold border border-transparent focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
                {CATEGORIES.map(cat => {
                  const isActive = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Product Card Grid */}
            {outlets.length === 0 && !isLoadingProducts ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-soft">
                <h3 className="text-base font-black text-slate-800">Belum Ada Outlet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pemilik perlu menambahkan outlet terlebih dahulu di dashboard owner (tab Outlet).
                </p>
              </div>
            ) : isLoadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map(idx => (
                  <div
                    key={idx}
                    className="h-64 rounded-3xl bg-white border border-slate-100 p-4 animate-pulse flex flex-col justify-between"
                  >
                    <div className="w-full h-36 bg-slate-100 rounded-2xl" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                      <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-soft">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center text-2xl mb-3">
                  🔍
                </div>
                <h3 className="text-base font-black text-slate-800">
                  Tidak Ada Menu yang Cocok
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Coba kata kunci lain atau pilih kategori &quot;Semua Menu&quot;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('ALL')
                  }}
                  className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-xs"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    qty={getQty(product.id)}
                    onAdd={addItem}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            )}

            {/* Shift Motivation Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 border border-amber-200/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">
                    Jual Hangat, Rezeki Berkah
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Pastikan minyak bersih & suhu penggorengan stabil 170°C.
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Shift Berkah</span>
              </div>
            </div>
          </main>

          {/* Right Column: Persistent Cashier Station on Tablet & Desktop */}
          <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20 self-start">
            <CashierSidebar
              invoiceNumberPreview={currentInvoice}
              cashierName={`${session.name} (${currentOutlet?.name || 'Gerobak'})`}
              cartItems={cartItems}
              totalPcs={totalPcs}
              totalAmount={totalAmount}
              printerStatus={printerStatus}
              printerDeviceName={printerName}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
              onPayCash={() => setShowCashModal(true)}
              onPayQris={() => setShowQrisModal(true)}
              onConnectPrinter={connectPrinter}
            />
          </aside>
        </div>
      </div>

      {/* Floating Compact Cart Bar for Mobile View */}
      <div className="lg:hidden">
        <CartBottomBar
          totalPcs={totalPcs}
          totalAmount={totalAmount}
          onPayCash={() => setShowCashModal(true)}
          onPayQris={() => setShowQrisModal(true)}
          onClearCart={clearCart}
        />
      </div>

      {/* Navigation Drawer */}
      <NavDrawer
        isOpen={showNavDrawer}
        onClose={() => setShowNavDrawer(false)}
        session={session}
        outlets={outlets}
        selectedOutletId={selectedOutletId}
        onSelectOutlet={handleSelectOutlet}
        printerStatus={printerStatus}
        onConnectPrinter={connectPrinter}
        onLogout={handleLogout}
      />

      {/* Outlet Selector Modal */}
      <OutletSelectorModal
        isOpen={showOutletModal}
        onClose={() => setShowOutletModal(false)}
        outlets={outlets}
        selectedOutletId={selectedOutletId}
        onSelectOutlet={handleSelectOutlet}
      />

      {/* Payment Modals */}
      <CashModal
        isOpen={showCashModal}
        totalAmount={totalAmount}
        onConfirm={handleConfirmCash}
        onClose={() => setShowCashModal(false)}
      />

      <QrisModal
        isOpen={showQrisModal}
        totalAmount={totalAmount}
        onConfirm={handleConfirmQris}
        onClose={() => setShowQrisModal(false)}
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
