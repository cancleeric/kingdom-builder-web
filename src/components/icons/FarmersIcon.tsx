// ollama fallback: /api/chat model 'tencent/hy3:free' reported by /api/tags but returned
// "model not found" on invoke — hand-drawn to match existing icon style (see BarnIcon.tsx).
import type { SVGProps } from 'react'

export function FarmersIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Central stem */}
      <line x1="12" y1="21" x2="12" y2="4" />
      {/* Grain pair — top */}
      <path d="M12 6c-1-1.5-3-1.5-3.5 0 1.5 1 2.5.5 3.5 0z" />
      <path d="M12 6c1-1.5 3-1.5 3.5 0-1.5 1-2.5.5-3.5 0z" />
      {/* Grain pair — middle */}
      <path d="M12 10.5c-1-1.3-2.6-1.3-3 0 1.3.8 2.2.4 3 0z" />
      <path d="M12 10.5c1-1.3 2.6-1.3 3 0-1.3.8-2.2.4-3 0z" />
      {/* Grain pair — lower */}
      <path d="M12 15c-1-1.1-2.3-1.1-2.6 0 1.1.7 1.9.3 2.6 0z" />
      <path d="M12 15c1-1.1 2.3-1.1 2.6 0-1.1.7-1.9.3-2.6 0z" />
    </svg>
  )
}
