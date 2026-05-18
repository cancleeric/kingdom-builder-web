import type { SVGProps } from 'react'

export function FarmIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Barn roof */}
      <path d="M2 10L12 3l10 7" />
      {/* Barn body */}
      <rect x="4" y="10" width="16" height="11" />
      {/* Door */}
      <path d="M9 21v-6h6v6" />
      {/* Loft window */}
      <path d="M10.5 10v-2a1.5 1.5 0 0 1 3 0v2" />
      {/* Wheat stalks */}
      <path d="M1 21c0-2 1-3 1-3s1 1 1 3" />
      <path d="M21 21c0-2 1-3 1-3s1 1 1 3" />
    </svg>
  )
}
