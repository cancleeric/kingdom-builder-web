/**
 * lidsSession.test.ts — 直讀 sessionStorage 版本測試
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { getSharedLidsUser, clearSharedLidsSession } from './lidsSession'

// 測試在 vitest（無 VITE_LIDS_* env 注入）下執行 → 被測程式碼走 fallback：
// issuer=http://localhost:8073、client_id=hd-portal-dev（對齊 portal lids-adapter.ts）
const OIDC_KEY = 'oidc.user:http://localhost:8073:hd-portal-dev'

function makeEntry(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hr from now
    profile: {
      sub: 'user-sub-001',
      name: 'Eric Wang',
      email: 'eric.wang@hurricanesoft.com.tw',
    },
    ...overrides,
  })
}

beforeEach(() => {
  window.sessionStorage.clear()
})

describe('getSharedLidsUser', () => {
  it('no key → returns null', async () => {
    const result = await getSharedLidsUser()
    expect(result).toBeNull()
  })

  it('valid entry → returns profile', async () => {
    window.sessionStorage.setItem(OIDC_KEY, makeEntry())
    const result = await getSharedLidsUser()
    expect(result).not.toBeNull()
    expect(result?.sub).toBe('user-sub-001')
    expect(result?.displayName).toBe('Eric Wang')
    expect(result?.email).toBe('eric.wang@hurricanesoft.com.tw')
  })

  it('expired token (expires_at in past) → returns null', async () => {
    window.sessionStorage.setItem(
      OIDC_KEY,
      makeEntry({ expires_at: Math.floor(Date.now() / 1000) - 1 }),
    )
    const result = await getSharedLidsUser()
    expect(result).toBeNull()
  })

  it('missing profile.sub → returns null', async () => {
    window.sessionStorage.setItem(
      OIDC_KEY,
      JSON.stringify({
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        profile: { name: 'No Sub' },
      }),
    )
    const result = await getSharedLidsUser()
    expect(result).toBeNull()
  })

  it('no expires_at field → treated as not expired, returns profile', async () => {
    window.sessionStorage.setItem(
      OIDC_KEY,
      JSON.stringify({
        profile: {
          sub: 'user-no-exp',
          name: 'No Expiry',
          email: 'noexp@example.com',
        },
      }),
    )
    const result = await getSharedLidsUser()
    expect(result).not.toBeNull()
    expect(result?.sub).toBe('user-no-exp')
  })

  it('prefers name over preferred_username for displayName', async () => {
    window.sessionStorage.setItem(
      OIDC_KEY,
      makeEntry({ profile: { sub: 'u1', name: 'Full Name', preferred_username: 'short', email: 'a@b.com' } }),
    )
    const result = await getSharedLidsUser()
    expect(result?.displayName).toBe('Full Name')
  })

  it('falls back to preferred_username when name absent', async () => {
    window.sessionStorage.setItem(
      OIDC_KEY,
      makeEntry({ profile: { sub: 'u2', preferred_username: 'fallback_user', email: 'a@b.com' } }),
    )
    const result = await getSharedLidsUser()
    expect(result?.displayName).toBe('fallback_user')
  })

  it('invalid JSON → returns null (no throw)', async () => {
    window.sessionStorage.setItem(OIDC_KEY, 'not-valid-json{{{')
    const result = await getSharedLidsUser()
    expect(result).toBeNull()
  })

  // 回歸護欄：fallback key 必須與 portal lids-adapter.ts fallback 對得上。
  // 若有人把 issuer/client_id fallback 改回與 portal 不一致的字面（如舊的
  // 192.168.50.199:8073 / hd-portal-199），portal 寫入的 entry 將讀不到。
  it('reads the portal-aligned fallback key (no env) → returns profile', async () => {
    // portal lids-adapter.ts dev fallback 寫入的 key
    const portalFallbackKey = 'oidc.user:http://localhost:8073:hd-portal-dev'
    window.sessionStorage.setItem(portalFallbackKey, makeEntry())
    const result = await getSharedLidsUser()
    expect(result).not.toBeNull()
    expect(result?.sub).toBe('user-sub-001')
  })

  it('entry under the OLD mismatched key (192.168.50.199 / hd-portal-199) → NOT read', async () => {
    // 證明 fallback 已不再用舊的不一致字面：舊 key 下的 entry 必須讀不到
    const oldMismatchedKey = 'oidc.user:http://192.168.50.199:8073:hd-portal-199'
    window.sessionStorage.setItem(oldMismatchedKey, makeEntry())
    const result = await getSharedLidsUser()
    expect(result).toBeNull()
  })
})

describe('clearSharedLidsSession', () => {
  it('removes the oidc key from sessionStorage', async () => {
    window.sessionStorage.setItem(OIDC_KEY, makeEntry())
    expect(window.sessionStorage.getItem(OIDC_KEY)).not.toBeNull()
    await clearSharedLidsSession()
    expect(window.sessionStorage.getItem(OIDC_KEY)).toBeNull()
  })

  it('does not throw if key is absent', async () => {
    await expect(clearSharedLidsSession()).resolves.toBeUndefined()
  })
})
