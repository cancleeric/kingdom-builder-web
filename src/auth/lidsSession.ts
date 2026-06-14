/**
 * lidsSession.ts — 跨遊戲 SSO PoC：讀取共享 LIDS 登入態
 *
 * PoC 選項 C：
 * - kingdom 不發起 OIDC 登入流程
 * - 只讀取 portal 存在 sessionStorage 的 OIDC user（同源同 tab 可共享）
 * - getSharedLidsUser() 回傳 user profile 或 null（未登入 / token 過期）
 *
 * ⚠️ authority + client_id 必須與 portal lids-adapter.ts 完全一致，
 *    才能對上 sessionStorage key：
 *    `oidc.user:${authority}:${client_id}`
 *    = `oidc.user:http://192.168.50.199:8073:hd-portal-199`
 *
 * ⛔ 不含 client_secret（Public PKCE client）
 */

import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

// ── env 讀取（與 portal .env.production 一致） ─────────────────────────────
const LIDS_ISSUER =
  (import.meta.env.VITE_LIDS_ISSUER as string | undefined) ??
  'http://192.168.50.199:8073'

const LIDS_CLIENT_ID =
  (import.meta.env.VITE_LIDS_CLIENT_ID as string | undefined) ??
  'hd-portal-199'

const LIDS_METADATA_URL = import.meta.env.VITE_LIDS_METADATA_URL as
  | string
  | undefined

const LIDS_SCOPE =
  (import.meta.env.VITE_LIDS_SCOPE as string | undefined) ??
  'openid profile email'

// ── UserManager singleton（與 portal 同設定，才能讀同一 sessionStorage key） ──

let _userManager: UserManager | null = null

function getUserManager(): UserManager {
  if (_userManager) return _userManager

  _userManager = new UserManager({
    authority: LIDS_ISSUER,
    client_id: LIDS_CLIENT_ID,
    // redirect_uri 不用於 PoC（不發起 signin），但 oidc-client-ts 建構期需要
    redirect_uri: window.location.origin + '/kingdom/',
    scope: LIDS_SCOPE,
    ...(LIDS_METADATA_URL ? { metadataUrl: LIDS_METADATA_URL } : {}),
    response_type: 'code',
    // 與 portal 完全一致：userStore + stateStore 都用 sessionStorage
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    // PoC 階段不啟用 silent renew（不在 kingdom 內做 iframe renew）
    automaticSilentRenew: false,
    loadUserInfo: false,
  })

  return _userManager
}

export interface LidsUserProfile {
  sub: string
  displayName: string | null
  email: string | null
}

/**
 * 讀取共享 LIDS session。
 *
 * 回傳 null 的情況：
 * - portal 尚未登入（sessionStorage 無對應 key）
 * - token 已過期（expired() === true）
 * - 在不同 tab 開啟（sessionStorage 不共享）
 */
export async function getSharedLidsUser(): Promise<LidsUserProfile | null> {
  try {
    const mgr = getUserManager()
    const user = await mgr.getUser()
    if (!user) return null
    // 檢查 token 是否過期
    if (user.expired) return null
    const p = user.profile
    return {
      sub: p.sub,
      displayName:
        (p.name as string | undefined) ??
        (p.preferred_username as string | undefined) ??
        null,
      email: (p.email as string | undefined) ?? null,
    }
  } catch {
    // sessionStorage 不可用或 parse 錯誤 → 視為未登入
    return null
  }
}

/**
 * 清除 kingdom 這側的 OIDC user 記錄（等同登出 session 讀取端）。
 * 不觸發 portal OIDC signout，只清 sessionStorage 中的 user entry。
 */
export async function clearSharedLidsSession(): Promise<void> {
  try {
    const mgr = getUserManager()
    await mgr.removeUser()
  } catch {
    // silent
  }
}
