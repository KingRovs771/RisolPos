'use client'

import React, { useState } from 'react'
import { Store, Plus, Trash2, X, Check, MapPin, Power } from 'lucide-react'
import { Outlet } from '@/types'
import { useToast } from '@/components/shared/Toast'

interface Props {
  outlets: Outlet[]
  onRefresh: () => void
}

export function OutletManagement({ outlets, onRefresh }: Props) {
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpen = () => {
    setName('')
    setAddress('')
    setFormError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (name.trim().length < 2) {
      setFormError('Nama outlet minimal 2 karakter')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), address: address.trim() }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('success', json.message || 'Outlet ditambahkan')
        setShowModal(false)
        onRefresh()
      } else {
        setFormError(json.message || 'Gagal menambahkan outlet')
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (o: Outlet) => {
    try {
      const res = await fetch('/api/outlets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: o.id, is_active: !o.is_active }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('info', json.message)
        onRefresh()
      } else {
        showToast('error', json.message || 'Gagal mengubah status')
      }
    } catch {
      showToast('error', 'Gagal mengubah status')
    }
  }

  const handleDelete = async (o: Outlet) => {
    if (!window.confirm(`Hapus outlet "${o.name}"? Akun kasir yang terikat akan kehilangan outlet.`)) return
    try {
      const res = await fetch(`/api/outlets?id=${encodeURIComponent(o.id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('success', json.message)
        onRefresh()
      } else {
        showToast('error', json.message || 'Gagal menghapus outlet')
      }
    } catch {
      showToast('error', 'Gagal menghapus outlet')
    }
  }

  return (
    <div className="space-y-5 select-none">
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Kelola Outlet / Gerobak</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Tambah atau hapus outlet. Setelah itu buat akun kasir untuk tiap outlet.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpen}
          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Outlet</span>
        </button>
      </div>

      {outlets.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
          Belum ada outlet. Klik &quot;Tambah Outlet&quot; untuk membuat yang pertama.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {outlets.map(o => (
            <div
              key={o.id}
              className={`p-4 rounded-3xl bg-white border shadow-xs flex flex-col gap-3 ${
                o.is_active ? 'border-slate-100' : 'border-slate-200 opacity-60'
              }`}
            >
              <div>
                <h3 className="text-sm font-black text-slate-900">{o.name}</h3>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{o.address || 'Alamat belum diisi'}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggle(o)}
                  className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1 ${
                    o.is_active
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {o.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(o)}
                  title="Hapus outlet"
                  className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Tambah Outlet Baru</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Nama Outlet:</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Gerobak Depan Kampus"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Alamat (opsional):</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Outlet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

