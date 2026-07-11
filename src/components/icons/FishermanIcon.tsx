// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function FishermanIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Fish body */}
      <path d="M6 12Q13 4 20 12Q13 20 6 12Z" />
      {/* Tail fin */}
      <path d="M6 12l-4-3.5v7z" />
      {/* Eye */}
      <circle cx="16.3" cy="10.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
