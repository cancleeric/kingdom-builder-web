// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function MinersIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Pickaxe head (crescent) */}
      <path d="M4 9Q12 1 20 9" />
      {/* Head tip left */}
      <path d="M4 9l-1.5 2.5" />
      {/* Head tip right */}
      <path d="M20 9l1.5 2.5" />
      {/* Pickaxe handle */}
      <line x1="12" y1="5" x2="8" y2="21" />
      {/* Handle grip */}
      <line x1="6.5" y1="17.5" x2="9.5" y2="18.3" />
      {/* Mineral gem */}
      <path d="M17.5 15.5l2.5 2-2.5 4-2.5-4z" />
    </svg>
  )
}
