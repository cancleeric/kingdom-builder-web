// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function LordsIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Crown zigzag */}
      <path d="M4 18l-1-9 4.5 4L12 5l4.5 8L21 9l-1 9z" />
      {/* Crown base band */}
      <line x1="4" y1="18" x2="20" y2="18" />
      {/* Gems on points */}
      <circle cx="12" cy="9" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
