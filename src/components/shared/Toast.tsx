'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-4 z-50 pointer-events-none flex flex-col gap-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const bgStyle =
    toast.type === 'success'
      ? 'bg-emerald-600 text-white'
      : toast.type === 'error'
      ? 'bg-rose-600 text-white'
      : 'bg-slate-800 text-white'

  const icon =
    toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ'

  return (
    <div
      role="alert"
      className={`${bgStyle} rounded-xl px-4 py-3 shadow-lg text-sm font-semibold flex items-center justify-between gap-3 pointer-events-auto transition-all duration-200 animate-[fadeIn_0.2s_ease-out]`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base font-bold">{icon}</span>
        <span>{toast.message}</span>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className="opacity-80 hover:opacity-100 text-lg leading-none p-1"
      >
        ✕
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
