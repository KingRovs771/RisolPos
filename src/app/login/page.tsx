'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { SessionUser } from '@/types'
import { Check, Delete, ShieldCheck, Sparkles, User, Crown } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<SessionUser[]>([
    {
      id: 'user-owner',
      name: 'Bos Risol (Owner)',
      username: 'owner',
      role: 'OWNER',
    },
  ])
  const [selectedAccount, setSelectedAccount] = useState<SessionUser>(accounts[0]!)
  const [pin, setPin] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isShaking, setIsShaking] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [failedAttempts, setFailedAttempts] = useState<number>(0)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0)

  // Redirect if already logged in
  useEffect(() => {
    try {
      const stored = localStorage.getItem('risolpos_session')
      if (stored) {
        const user = JSON.parse(stored) as SessionUser
        if (user && user.role) {
          router.replace(user.role === 'OWNER' ? '/owner' : '/pos')
        }
      }
    } catch {
      // ignore
    }
  }, [router])

  // Fetch available accounts dynamically from database
  useEffect(() => {
    let active = true
    async function loadAccounts() {
      try {
        const res = await fetch('/api/users')
        if (res.ok) {
          const json = await res.json()
          if (active && Array.isArray(json.data) && json.data.length > 0) {
            setAccounts(json.data)
            setSelectedAccount(json.data[0])
          }
        }
      } catch {
        // keep fallback
      }
    }
    loadAccounts()
    return () => {
      active = false
    }
  }, [])

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownSeconds])

  const triggerError = (msg: string) => {
    setErrorMessage(msg)
    setIsShaking(true)
    setPin('')
    setTimeout(() => setIsShaking(false), 400)

    const nextAttempts = failedAttempts + 1
    setFailedAttempts(nextAttempts)
    if (nextAttempts >= 4) {
      setCooldownSeconds(30)
      setFailedAttempts(0)
    }
  }

  const handleDigit = (digit: string) => {
    if (cooldownSeconds > 0 || isLoading) return
    if (pin.length < 6) {
      setErrorMessage('')
      setPin(prev => prev + digit)
    }
  }

  const handleBackspace = () => {
    if (cooldownSeconds > 0 || isLoading) return
    setPin(prev => prev.slice(0, -1))
    setErrorMessage('')
  }

  const handleSubmit = async () => {
    if (pin.length !== 6 || cooldownSeconds > 0 || isLoading || !selectedAccount) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedAccount.username,
          pin,
        }),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        const user: SessionUser = json.data
        localStorage.setItem('risolpos_session', JSON.stringify(user))
        if (user.outlet_id) {
          localStorage.setItem('risolpos_outlet_id', user.outlet_id)
        }

        // Role-based destination
        if (user.role === 'OWNER') {
          router.replace('/owner')
        } else {
          router.replace('/pos')
        }
        return
      }

      triggerError(json.message || 'PIN salah! Silakan coba lagi.')
    } catch {
      triggerError('Gagal menghubungkan ke server autentikasi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-5xl bg-white rounded-3xl sm:rounded-[36px] shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        {/* Left Side Hero Banner (Visible on Tablet & Laptop) */}
        <div className="hidden md:flex md:col-span-5 lg:col-span-6 relative bg-slate-900 flex-col justify-between p-8 text-white overflow-hidden">
          {/* Background Image with Dark Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/risol-hero.jpg"
              alt="RisolPOS Delicious Showcase"
              fill
              className="object-cover opacity-45 scale-105 transition-transform duration-1000 ease-out hover:scale-100"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
          </div>

          {/* Top Brand Tag */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
              🧆
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">RisolPOS</h2>
              <span className="text-xs font-bold text-amber-400">Berkah Ummat UMKM</span>
            </div>
          </div>

          {/* Middle Highlight */}
          <div className="relative z-10 space-y-3 my-auto py-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-amber-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gorengan Hangat, Rezeki Lancar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Sistem Kasir Modern Gerobak Risol
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-md">
              Desain kasir ergonomis dengan cetak struk thermal 58mm, QRIS Muamalat instan, dan rekonsiliasi stok otomatis.
            </p>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Akses Terenkripsi PIN 6-Digit</span>
            </div>
            <span>WIB (UTC+7)</span>
          </div>
        </div>

        {/* Right Side: PIN Login Station */}
        <div className="md:col-span-7 lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between bg-white">
          {/* Mobile-Only Header */}
          <div className="md:hidden text-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-400 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-md shadow-amber-500/20 mb-2">
              🧆
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              RisolPOS Kasir
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Kasir Gerobak Risol UMKM Berkah
            </p>
          </div>

          {/* Account Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600">
                Pilih Akun Bertugas:
              </span>
              {selectedAccount && (
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                    selectedAccount.role === 'OWNER'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedAccount.role === 'OWNER' ? 'Pemilik Usaha' : 'Kasir Shift'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto no-scrollbar">
              {accounts.map(acc => {
                const isSelected = selectedAccount?.id === acc.id
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccount(acc)
                      setPin('')
                      setErrorMessage('')
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-amber-50/60 border-2 border-amber-500 shadow-sm ring-2 ring-amber-200/50'
                        : 'bg-slate-50 border-slate-200/70 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 ${
                        acc.role === 'OWNER'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {acc.role === 'OWNER' ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="truncate flex-1">
                      <div className="font-black text-xs sm:text-sm text-slate-900 leading-tight truncate">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-amber-600 font-bold truncate mt-0.5">
                        {acc.role === 'OWNER' ? '👑 Owner (Semua Gerobak)' : `🏬 ${acc.outlet_name || 'Gerobak'}`}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* PIN Indicator Dots */}
          <div className={`my-4 text-center ${isShaking ? 'animate-shake' : ''}`}>
            <span className="text-xs font-bold text-slate-600 block mb-2.5">
              Masukkan 6 Digit PIN {selectedAccount?.name || 'Akun'}:
            </span>
            <div className="flex justify-center items-center gap-3">
              {[0, 1, 2, 3, 4, 5].map(idx => {
                const isFilled = pin.length > idx
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      isFilled
                        ? 'bg-amber-500 scale-125 shadow-xs ring-4 ring-amber-100'
                        : 'bg-slate-200 border border-slate-300'
                    }`}
                  />
                )
              })}
            </div>

            {/* Error Message or Helper */}
            <div className="h-6 mt-2.5 flex items-center justify-center">
              {cooldownSeconds > 0 ? (
                <span className="text-xs font-black text-rose-600">
                  Terlalu banyak percobaan. Tunggu {cooldownSeconds} detik.
                </span>
              ) : errorMessage ? (
                <span className="text-xs font-black text-rose-600">
                  {errorMessage}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  Gunakan PIN 6 digit yang didaftarkan oleh pemilik usaha
                </span>
              )}
            </div>
          </div>

          {/* Tactile 3x4 Numpad */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-xs mx-auto w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                disabled={cooldownSeconds > 0 || isLoading}
                className="h-13 sm:h-14 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 rounded-2xl text-xl font-black text-slate-900 flex items-center justify-center shadow-2xs active:scale-95 transition-all disabled:opacity-50"
              >
                {num}
              </button>
            ))}

            {/* Backspace */}
            <button
              type="button"
              onClick={handleBackspace}
              disabled={cooldownSeconds > 0 || isLoading || pin.length === 0}
              className="h-13 sm:h-14 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-slate-600 flex items-center justify-center active:scale-95 transition-all disabled:opacity-30"
              title="Hapus"
            >
              <Delete className="w-5 h-5" />
            </button>

            {/* Zero */}
            <button
              type="button"
              onClick={() => handleDigit('0')}
              disabled={cooldownSeconds > 0 || isLoading}
              className="h-13 sm:h-14 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 rounded-2xl text-xl font-black text-slate-900 flex items-center justify-center shadow-2xs active:scale-95 transition-all disabled:opacity-50"
            >
              0
            </button>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={cooldownSeconds > 0 || isLoading || pin.length !== 6}
              className={`h-13 sm:h-14 rounded-2xl text-lg font-black flex items-center justify-center shadow-md active:scale-95 transition-all ${
                pin.length === 6 && cooldownSeconds === 0 && !isLoading
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-300'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
