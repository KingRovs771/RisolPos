'use client'

import { useSyncExternalStore } from 'react'
import { SessionUser } from '@/types'

const emptySubscribe = () => () => {}

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function getClientSession(): SessionUser | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('risolpos_session')
    return stored ? (JSON.parse(stored) as SessionUser) : null
  } catch {
    return null
  }
}
