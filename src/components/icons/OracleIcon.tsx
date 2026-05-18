import type { SVGProps } from 'react'

export function OracleIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Crystal ball */}
      <circle cx="12" cy="13" r="7" />
      {/* Mystical glow arcs inside ball */}
      <path d="M8 11c1-2 3-3 4-2" />
      <path d="M9 14c1-1 2-1 3-0.5" />
      {/* Stand base */}
      <path d="M8 20h8" />
      {/* Stand stem */}
      <line x1="12" y1="20" x2="12" y2="22" />
      {/* Base foot */}
      <path d="M9 22h6" />
      {/* Stars above */}
      <path d="M6 4l0.5 1 1 0.5-1 0.5L6 7l-0.5-1.5L4 5l1.5-0.5z" />
      <path d="M18 3l0.4 0.8 0.8 0.4-0.8 0.4L18 5.4l-0.4-0.8L16.8 4.2l0.8-0.4z" />
    </svg>
  )
}
