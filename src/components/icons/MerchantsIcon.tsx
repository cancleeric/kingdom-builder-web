// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function MerchantsIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Scale beam */}
      <line x1="4" y1="6" x2="20" y2="6" />
      {/* Scale post */}
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
      {/* Left pan chains */}
      <path d="M6 6l-2.5 5.5" />
      <path d="M6 6l2.5 5.5" />
      {/* Left pan */}
      <path d="M3.5 11.5a2.5 2 0 0 0 5 0z" />
      {/* Right pan chains */}
      <path d="M18 6l-2.5 5.5" />
      <path d="M18 6l2.5 5.5" />
      {/* Right pan */}
      <path d="M15.5 11.5a2.5 2 0 0 0 5 0z" />
    </svg>
  )
}
