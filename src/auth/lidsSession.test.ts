/**
 * lidsSession.test.ts — 直讀 sessionStorage 版本測試
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { getSharedLidsUser, clearSharedLidsSession } from './lidsSession'

const OIDC_KEY = 'oidc.user:http://192.168.50.199:8073:hd-portal-199'

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
