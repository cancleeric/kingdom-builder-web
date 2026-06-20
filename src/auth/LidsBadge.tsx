/**
 * LidsBadge — 共用 SSO 登入態 badge 元件
 *
 * - 已登入：顯示 displayName / email / sub + 登出鈕
 * - 未登入：顯示「未登入」連結到 portal
 *
 * variant:
 *   'header'  - 遊戲內 header（深色背景，oklch overlay）
 *   'menu'    - 主選單（淺色羊皮紙背景）
 */

import { useLidsSession } from './useLidsSession'

interface LidsBadgeProps {
  variant?: 'header' | 'menu'
}

// 大廳（hd-portal）入口。共享 session 讀不到時，引導玩家回大廳登入。
const LOBBY_URL = 'https://192.168.50.199:8443/'

export function LidsBadge({ variant = 'header' }: LidsBadgeProps) {
  const { loading, user, clearSession } = useLidsSession()

  // 仍在讀取共享 session，先不顯示未登入提示避免閃爍誤判
  if (loading) return null

  if (variant === 'menu') {
    if (user) {
      return (
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-xs"
          style={{
            backgroundColor: 'var(--color-warm-cream-300)',
            color: 'var(--color-stone-700)',
            border: '1px solid var(--card-border)',
          }}
        >
          <span aria-label="Logged in user">
            {user.displayName ?? user.email ?? user.sub}
          </span>
          <button
            onClick={clearSession}
            title="Sign out of LIDS session"
            aria-label="Sign out"
            className="opacity-70 hover:opacity-100 transition ml-1"
            style={{ fontSize: '0.6rem', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      )
    }
    return (
      <a
        href={LOBBY_URL}
        className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-90 transition"
        style={{
          backgroundColor: 'var(--color-warm-cream-300)',
          color: 'var(--color-stone-700)',
          border: '1px solid var(--card-border)',
          textDecoration: 'none',
        }}
        title="回大廳登入"
        aria-label="尚未登入，請先在大廳登入"
      >
        <span aria-hidden="true">⤺</span>
        請先在大廳登入
      </a>
    )
  }

  // variant === 'header' (default)
  if (user) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-xs"
        style={{ backgroundColor: 'oklch(0 0 0 / 0.2)', color: 'var(--color-warm-cream-50)' }}
      >
        <span aria-label="Logged in user">
          {user.displayName ?? user.email ?? user.sub}
        </span>
        <button
          onClick={clearSession}
          title="Sign out of LIDS session"
          aria-label="Sign out"
          className="opacity-70 hover:opacity-100 transition ml-1"
          style={{ fontSize: '0.6rem', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
    )
  }
  return (
    <a
      href={LOBBY_URL}
      className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:opacity-90 transition"
      style={{
        backgroundColor: 'oklch(0 0 0 / 0.2)',
        color: 'var(--color-warm-cream-50)',
        textDecoration: 'none',
      }}
      title="回大廳登入"
      aria-label="尚未登入，請先在大廳登入"
    >
      <span aria-hidden="true">⤺</span>
      請先在大廳登入
    </a>
  )
}
