// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function CitizensIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Left person */}
      <circle cx="8" cy="7" r="2.5" />
      <path d="M3.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5" />
      {/* Right person (behind, offset) */}
      <circle cx="16" cy="7" r="2.5" />
      <path d="M11.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5" />
    </svg>
  )
}
