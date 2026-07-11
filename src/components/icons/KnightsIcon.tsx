// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function KnightsIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Shield outline */}
      <path d="M12 2l7 3v6c0 5-3 8.5-7 11-4-2.5-7-6-7-11V5z" />
      {/* Shield cross emblem */}
      <line x1="12" y1="7" x2="12" y2="16" />
      <line x1="8" y1="11" x2="16" y2="11" />
    </svg>
  )
}
