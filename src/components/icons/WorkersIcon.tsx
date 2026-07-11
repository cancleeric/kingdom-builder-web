// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function WorkersIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Wrench */}
      <path d="M14.5 4.5a3.5 3.5 0 0 0-4.6 4.1L4 14.5 5.5 16l5.9-5.9a3.5 3.5 0 0 0 4.1-4.6l-2 2-1.5-1.5z" />
      {/* Hammer handle */}
      <line x1="12" y1="12" x2="19" y2="19" />
      {/* Hammer head */}
      <path d="M17 15l4-2 1 1-2 4-3-3z" />
    </svg>
  )
}
