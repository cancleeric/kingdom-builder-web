// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function DiscoverersIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Compass ring */}
      <circle cx="12" cy="12" r="9" />
      {/* Compass needle */}
      <path d="M15 9l-2 5-4 1 2-5z" />
      {/* Center pivot */}
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
      {/* North tick */}
      <line x1="12" y1="3" x2="12" y2="4.5" />
    </svg>
  )
}
