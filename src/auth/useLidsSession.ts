/**
 * useLidsSession — React hook：讀取共享 LIDS 登入態（PoC）
 *
 * 在 component mount 時非同步讀取 sessionStorage OIDC user，
 * 回傳 loading / user / clearSession。
 */

import { useState, useEffect, useCallback } from 'react'
import { getSharedLidsUser, clearSharedLidsSession, type LidsUserProfile } from './lidsSession'

export interface LidsSessionState {
  loading: boolean
  user: LidsUserProfile | null
  clearSession: () => void
}

export function useLidsSession(): LidsSessionState {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<LidsUserProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    getSharedLidsUser().then((u) => {
      if (!cancelled) {
        setUser(u)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const clearSession = useCallback(() => {
    clearSharedLidsSession().then(() => {
      setUser(null)
    })
  }, [])

  return { loading, user, clearSession }
}
