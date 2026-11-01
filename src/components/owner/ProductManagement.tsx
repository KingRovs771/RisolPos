'use client'

import React, { useState } from 'react'
import { Plus, Edit3, Check, X, Sparkles, Trash2, ImagePlus } from 'lucide-react'
import { Product } from '@/types'
import { useToast } from '@/components/shared/Toast'

interface Props {
  products: Product[]
  onRefresh: () => void
}

const CATEGORY_PRESETS = ['Best Seller', 'Pedas', 'Original', 'Manis', 'Spesial']

// Compress uploaded photo to a small JPEG data URL (max 640px) so it can be stored without external storage
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = () => reject(new Error('Gambar tidak valid'))
      img.onload = () => {
        const max = 640
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Browser tidak mendukung'))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function PhotoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [error, setError] = useState('')
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try {
      onChange(await fileToCompressedDataUrl(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah foto')
    }
  }
  return (
    <div>
      <label className="block text-xs font-black text-slate-700 mb-1">Foto Menu (upload sendiri):</label>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Foto menu" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-6 h-6 text-slate-400" />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900 text-white text-xs font-black cursor-pointer hover:bg-amber-500 hover:text-slate-950 transition-colors">
            <ImagePlus className="w-3.5 h-3.5" />
            <span>{value ? 'Ganti Foto' : 'Pilih Foto'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {value && (
            <button type="button" onClick={() => onChange('')} className="block text-[11px] font-bold text-rose-600 hover:underline">
              Hapus foto
            </button>
          )}
          {error && <div className="text-[11px] font-bold text-rose-600">{error}</div>}
        </div>
      </div>
    </div>
  )
}
export function ProductManagement({ products, onRefresh }: Props) {
  const { showToast } = useToast()
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Add Form states
  const [name, setName] = useState<string>('')
  const [price, setPrice] = useState<number>(3500)
  const [costPrice, setCostPrice] = useState<number>(2000)
  const [category, setCategory] = useState<string>('Best Seller')
  const [description, setDescription] = useState<string>('')
  const [badge, setBadge] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [initialStock, setInitialStock] = useState<number>(25)
  const [formError, setFormError] = useState<string>('')

  // Open modal tambah
  const handleOpenAdd = () => {
    setName('')
    setPrice(3500)
    setCostPrice(2000)
    setCategory('Best Seller')
    setDescription('')
    setBadge('Menu Baru 🔥')
    setImageUrl('')
    setInitialStock(25)
    setFormError('')
    setShowAddModal(true)
  }

  // Open modal edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p)
    setName(p.name)
    setPrice(p.price)
    setCostPrice(p.cost_price || 0)
    setCategory(p.category || 'Best Seller')
    setDescription(p.description || '')
    setBadge(p.badge || '')
    setImageUrl(p.image_url || '')
    setFormError('')
  }

  // Handle submit tambah
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Nama menu wajib diisi')
      return
    }
    if (price <= 0) {
      setFormError('Harga jual harus lebih dari 0')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/owner/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price,
          cost_price: costPrice,
          category,
          description: description.trim(),
          badge: badge.trim(),
          image_url: imageUrl,
          initial_stock_per_outlet: initialStock,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        showToast('success', json.message || 'Menu baru berhasil ditambahkan!')
        setShowAddModal(false)
        onRefresh()
      } else {
        setFormError(json.message || 'Gagal menambahkan menu baru')
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle submit edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setFormError('')

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/owner/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          name: name.trim(),
          price,
          cost_price: costPrice,
          category,
          description: description.trim(),
          badge: badge.trim(),
          image_url: imageUrl,
          is_active: editingProduct.is_active,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        showToast('success', `Menu ${name} berhasil diperbarui`)
        setEditingProduct(null)
        onRefresh()
      } else {
        setFormError(json.message || 'Gagal memperbarui menu')
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete product
  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Hapus menu "${p.name}"? Stok & riwayat pergerakan stok menu ini ikut terhapus. Riwayat nota penjualan tetap aman.`)) return
    try {
      const res = await fetch(`/api/owner/products?id=${p.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('success', json.message || 'Menu dihapus')
        onRefresh()
      } else {
        showToast('error', json.message || 'Gagal menghapus menu')
      }
    } catch {
      showToast('error', 'Gagal menghapus menu')
    }
  }

  // Toggle active status
  const handleToggleActive = async (p: Product) => {
    try {
      const res = await fetch('/api/owner/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          is_active: !p.is_active,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('info', `Status menu "${p.name}" diubah ke: ${!p.is_active ? 'Aktif' : 'Nonaktif'}`)
        onRefresh()
      }
    } catch {
      showToast('error', 'Gagal mengubah status menu')
    }
  }

  const profitPerPcs = Math.max(0, price - costPrice)
  const marginPct = price > 0 ? Math.round((profitPerPcs / price) * 100) : 0

  return (
    <div className="space-y-6 select-none">
      {/* Header Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              🧆
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Katalog Menu Risol & Harga Jual
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Tambah varian risol baru, atur harga jual, HPP, margin keuntungan, dan status tayang
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Risol Baru</span>
        </button>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map(p => {
          const itemProfit = Math.max(0, p.price - (p.cost_price || 0))
          const itemMarginPct = p.price > 0 ? Math.round((itemProfit / p.price) * 100) : 0

          return (
            <div
              key={p.id}
              className={`rounded-3xl bg-white border transition-all overflow-hidden flex flex-col justify-between ${
                p.is_active ? 'border-slate-100 shadow-xs hover:border-amber-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              {/* Product Image Header */}
              <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">🧆</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-white/10">
                    {p.category || 'Varian'}
                  </span>
                  {p.badge && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Product Name on Image */}
                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <h3 className="text-sm font-black leading-tight drop-shadow-md truncate">
                    {p.name}
                  </h3>
                  <span className="text-[10px] font-medium text-slate-200 line-clamp-1">
                    {p.description || 'Risol hangat lezat'}
                  </span>
                </div>
              </div>

              {/* Product Details & Profit Metrics */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-left">
                    <span className="text-[10px] font-bold text-amber-800 block">Harga Jual</span>
                    <span className="text-sm font-black text-amber-950">
                      Rp {p.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                    <span className="text-[10px] font-bold text-slate-500 block">Modal / HPP</span>
                    <span className="text-sm font-bold text-slate-700">
                      Rp {(p.cost_price || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Profit Margin Pill */}
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-emerald-800">Margin Profit:</span>
                  <span className="text-[11px] font-black text-emerald-700">
                    Rp {itemProfit.toLocaleString('id-ID')} ({itemMarginPct}%)
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(p)}
                    className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl transition-all ${
                      p.is_active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {p.is_active ? '● Aktif Dijual' : '○ Nonaktif'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition-colors flex items-center gap-1 text-xs font-bold px-2.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    title="Hapus menu"
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-colors flex items-center gap-1 text-xs font-bold px-2.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Tambah Menu Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[fadeIn_0.15s_ease-out] max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Tambah Menu Risol Baru</h3>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Menu otomatis tersinkron ke semua gerobak aktif
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* Nama Menu */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Nama Menu Risol:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Risol Mozzarella Pedas"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  required
                />
              </div>

              {/* Harga Jual & Harga Modal HPP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Harga Jual (Rp):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={price}
                    onChange={e => setPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-black text-amber-950 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Harga Modal / HPP (Rp):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={costPrice}
                    onChange={e => setCostPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Live Margin Calculation Preview */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800">Estimasi Keuntungan Bersih:</span>
                <span className="font-black text-emerald-700 text-sm">
                  Rp {profitPerPcs.toLocaleString('id-ID')} / pcs ({marginPct}%)
                </span>
              </div>

              {/* Kategori & Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Kategori:
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  >
                    {CATEGORY_PRESETS.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Badge Highlight:
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    placeholder="Misal: Spesial ⭐, Pedas 🌶️"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Deskripsi Menu:
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Isian lelehan keju mozzarella lembut dipadu bumbu pedas manis gurih"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                />
              </div>

              <PhotoUpload value={imageUrl} onChange={setImageUrl} />

              {/* Stok Awal per Outlet */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Stok Awal per Outlet (Pcs):
                </label>
                <input
                  type="number"
                  min={0}
                  value={initialStock}
                  onChange={e => setInitialStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                />
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  Stok ini otomatis dialokasikan ke semua gerobak aktif saat menu disimpan.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Simpan & Rilis Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Menu */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[fadeIn_0.15s_ease-out] max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Ubah Menu: {editingProduct.name}</h3>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Perbarui harga jual, HPP, atau informasi menu
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* Nama Menu */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Nama Menu:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              {/* Harga Jual & Harga Modal HPP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Harga Jual (Rp):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={price}
                    onChange={e => setPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-black text-amber-950 focus:bg-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Harga Modal / HPP (Rp):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={costPrice}
                    onChange={e => setCostPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Kategori & Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Kategori:
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  >
                    {CATEGORY_PRESETS.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Badge:
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Deskripsi:
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <PhotoUpload value={imageUrl} onChange={setImageUrl} />

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
