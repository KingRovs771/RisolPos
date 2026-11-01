'use client'

import React, { useState } from 'react'
import { Crown, User, UserPlus, Trash2, X, Check, KeyRound, MapPin } from 'lucide-react'
import { useToast } from '@/components/shared/Toast'
import { Outlet } from '@/types'

export interface AppUser {
  id: string
  username: string
  name: string
  role: 'OWNER' | 'CASHIER'
  outlet_id?: string | null
  outlet_name?: string | null
  created_at?: string
}

interface Props {
  users: AppUser[]
  outlets?: Outlet[]
  currentUserId: string
  onRefresh: () => void
}

export function UserManagement({ users, outlets = [], currentUserId, onRefresh }: Props) {
  const { showToast } = useToast()
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [resetUser, setResetUser] = useState<AppUser | null>(null)
  const [newPin, setNewPin] = useState<string>('')
  const [confirmPin, setConfirmPin] = useState<string>('')
  const [editName, setEditName] = useState<string>('')
  const [editOutletId, setEditOutletId] = useState<string>('')
  const [resetError, setResetError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [role, setRole] = useState<'CASHIER' | 'OWNER'>('CASHIER')
  const [selectedOutletId, setSelectedOutletId] = useState<string>(outlets[0]?.id || '')
  const [pin, setPin] = useState<string>('')
  const [formError, setFormError] = useState<string>('')

  const handleOpenAdd = () => {
    setName('')
    setUsername('')
    setRole('CASHIER')
    setSelectedOutletId(outlets[0]?.id || '')
    setPin('')
    setFormError('')
    setShowAddModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Nama lengkap wajib diisi')
      return
    }
    if (!username.trim() || username.trim().length < 3) {
      setFormError('Username minimal 3 karakter (huruf/angka)')
      return
    }
    if (!/^\d{6}$/.test(pin.trim())) {
      setFormError('PIN harus tepat 6 digit angka')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/owner/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          role,
          outlet_id: role === 'CASHIER' && selectedOutletId ? selectedOutletId : null,
          pin: pin.trim(),
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        showToast('success', json.message || 'User berhasil ditambahkan!')
        setShowAddModal(false)
        onRefresh()
      } else {
        setFormError(json.message || 'Gagal menambahkan user')
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (user: AppUser) => {
    if (user.id === currentUserId || user.id === 'user-owner') {
      showToast('error', 'Akun pemilik utama tidak dapat dihapus')
      return
    }

    if (!window.confirm(`Yakin ingin menghapus user "${user.name}" (@${user.username})?`)) {
      return
    }

    setIsDeleting(user.id)
    try {
      const res = await fetch(`/api/owner/users?id=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('success', `User ${user.name} berhasil dihapus`)
        onRefresh()
      } else {
        showToast('error', json.message || 'Gagal menghapus user')
      }
    } catch {
      showToast('error', 'Gagal menghapus user')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleOpenReset = (user: AppUser) => {
    setResetUser(user)
    setEditName(user.name)
    setEditOutletId(user.outlet_id || '')
    setNewPin('')
    setConfirmPin('')
    setResetError('')
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetUser) return
    setResetError('')

    if (!editName.trim()) {
      setResetError('Nama lengkap wajib diisi')
      return
    }
    if (!/^\d{6}$/.test(newPin.trim())) {
      setResetError('PIN baru harus tepat 6 digit angka')
      return
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setResetError('Konfirmasi PIN baru tidak cocok')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/owner/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resetUser.id,
          name: editName.trim(),
          outlet_id: resetUser.role === 'CASHIER' ? (editOutletId || null) : null,
          pin: newPin.trim(),
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('success', json.message || `PIN ${resetUser.name} berhasil direset!`)
        setResetUser(null)
        onRefresh()
      } else {
        setResetError(json.message || 'Gagal mereset PIN')
      }
    } catch {
      setResetError('Terjadi kesalahan jaringan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 select-none">
      {/* Header Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              👥
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Kelola Karyawan & Outlet PIN
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Setiap gerobak memiliki akun kasir & PIN sendiri untuk pemantauan penjualan real-time
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Kasir / Karyawan Baru</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {users.map(u => {
          const isOwnerRole = u.role === 'OWNER'
          const isCurrentUser = u.id === currentUserId
          const isProtected = u.id === 'user-owner' || isCurrentUser

          return (
            <div
              key={u.id}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs hover:border-amber-200 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg ${
                        isOwnerRole
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isOwnerRole ? <Crown className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-slate-900 leading-tight">
                          {u.name}
                        </h3>
                        {isCurrentUser && (
                          <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                            Anda
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-400 mt-0.5">
                        @{u.username}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      isOwnerRole
                        ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    }`}
                  >
                    {isOwnerRole ? 'OWNER' : 'KASIR'}
                  </span>
                </div>

                {/* Outlet Assignment Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {isOwnerRole ? 'Akses Semua Outlet (Pemilik)' : u.outlet_name || 'Outlet Belum Ditentukan'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReset(u)}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 font-black text-[11px] flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset PIN / Password</span>
                </button>

                {!isProtected && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u)}
                    disabled={isDeleting === u.id}
                    title="Hapus Karyawan"
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Tambah Karyawan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Tambah Akun Karyawan</h3>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Akun kasir terikat ke outlet untuk pencatatan real-time
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

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Nama Lengkap Kasir / Karyawan:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Kasir Siti - Gerobak Kampus"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Username (Untuk Login):
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="Contoh: kasir_siti"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none lowercase"
                  required
                />
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Peran / Hak Akses:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CASHIER')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      role === 'CASHIER'
                        ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200/50'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-black">Kasir Gerobak</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Akses POS kasir</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('OWNER')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      role === 'OWNER'
                        ? 'bg-purple-50 border-2 border-purple-500 text-purple-950 ring-2 ring-purple-200/50'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-xs font-black">Owner</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Akses penuh bisnis</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Outlet Assignment (Only if CASHIER) */}
              {role === 'CASHIER' && (
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Tugaskan ke Outlet / Gerobak:
                  </label>
                  <select
                    value={selectedOutletId}
                    onChange={e => setSelectedOutletId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Tanpa Outlet / Pilih Nanti --</option>
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 6 Digit PIN */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  PIN Rahasia (Tepat 6 Digit Angka):
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Misal: 123456"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 tracking-widest text-center focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  required
                />
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
                  <span>Simpan Akun Karyawan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset PIN / Password */}
      {resetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Reset PIN / Password
                  </h3>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Akun: @{resetUser.username} ({resetUser.role === 'OWNER' ? 'Owner' : 'Kasir'})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResetUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="mt-4 space-y-4">
              {resetError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {resetError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  required
                />
              </div>

              {resetUser.role === 'CASHIER' && (
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Outlet Penugasan:
                  </label>
                  <select
                    value={editOutletId}
                    onChange={e => setEditOutletId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Tanpa Outlet --</option>
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  PIN Baru (6 Digit Angka):
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan 6 digit PIN baru"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 tracking-widest text-center focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Ulangi PIN Baru (Konfirmasi):
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ketik ulang 6 digit PIN baru"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 tracking-widest text-center focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
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
                  <span>Simpan PIN Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
