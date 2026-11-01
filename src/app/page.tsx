'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SessionUser } from '@/types'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('risolpos_session')
      if (stored) {
        const user = JSON.parse(stored) as SessionUser
        if (user && user.role) {
          router.replace('/pos')
          return
        }
      }
    } catch {
      // ignore
    }
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-3 animate-pulse">
        🧆
      </div>
      <h2 className="text-base font-extrabold text-slate-800">
        Memuat RisolPOS...
      </h2>
    </div>
  )
}
