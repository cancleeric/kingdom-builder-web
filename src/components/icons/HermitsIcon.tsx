// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function HermitsIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Small solitary hut roof */}
      <path d="M6 11L11 6l5 5" />
      {/* Hut body */}
      <rect x="7" y="11" width="8" height="7" />
      {/* Door */}
      <path d="M9.5 18v-3.5h3V18" />
      {/* Chimney */}
      <line x1="13.5" y1="8.5" x2="13.5" y2="6" />
      {/* Isolation dashes (nothing nearby) */}
      <line x1="18" y1="10" x2="20" y2="10" strokeDasharray="1 2" />
      <line x1="18" y1="15" x2="20" y2="15" strokeDasharray="1 2" />
      <line x1="2" y1="13" x2="4" y2="13" strokeDasharray="1 2" />
    </svg>
  )
}
