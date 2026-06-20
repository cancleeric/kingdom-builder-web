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
 *
 *    真值（.env.production，prod/.199 部署實際採用）：
 *    portal 與 kingdom 皆 VITE_LIDS_ISSUER=http://localhost:8073、
 *    VITE_LIDS_CLIENT_ID=hd-portal-199
 *    → `oidc.user:http://localhost:8073:hd-portal-199`
 *
 *    fallback（無 env 的 dev 情境）：對齊 portal lids-adapter.ts（dev placeholder）
 *    issuer=http://localhost:8073、client_id=hd-portal-dev，
 *    讓 portal 寫入 / kingdom 讀取的 key 在無 env 時也對得上。
 *
 * ⛔ 不含 client_secret（Public PKCE client）
 */

// ── env 讀取（與 portal lids-adapter.ts fallback 一致） ────────────────────
const LIDS_ISSUER =
  (import.meta.env.VITE_LIDS_ISSUER as string | undefined) ??
  'http://localhost:8073'

const LIDS_CLIENT_ID =
  (import.meta.env.VITE_LIDS_CLIENT_ID as string | undefined) ??
  'hd-portal-dev'

export interface LidsUserProfile {
  sub: string
  displayName: string | null
  email: string | null
}

/**
 * 讀取共享 LIDS session。
 *
 * 直接讀 sessionStorage，不透過 oidc-client-ts UserManager（UserManager
 * 建構時的 check_session iframe 在非 portal 頁面會 hang 住不 resolve）。
 *
 * 回傳 null 的情況：
 * - portal 尚未登入（sessionStorage 無對應 key）
 * - token 已過期（expires_at 檢查）
 * - 在不同 tab 開啟（sessionStorage 不共享）
 * - JSON parse 失敗或 sessionStorage 不可用
 */
export async function getSharedLidsUser(): Promise<LidsUserProfile | null> {
  try {
    const key = `oidc.user:${LIDS_ISSUER}:${LIDS_CLIENT_ID}`
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const u = JSON.parse(raw) as {
      expires_at?: number
      profile?: {
        sub?: string
        name?: string
        preferred_username?: string
        email?: string
      }
    }
    // 過期檢查：oidc-client-ts 存 expires_at（秒）
    if (u.expires_at != null && u.expires_at * 1000 <= Date.now()) return null
    const p = u.profile ?? {}
    if (!p.sub) return null
    return {
      sub: p.sub,
      displayName: p.name ?? p.preferred_username ?? null,
      email: p.email ?? null,
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
    const key = `oidc.user:${LIDS_ISSUER}:${LIDS_CLIENT_ID}`
    window.sessionStorage.removeItem(key)
  } catch {
    // silent
  }
}
