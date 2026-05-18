import type { SVGProps } from 'react'

export function DrawCardIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Card deck (back) */}
      <rect x="5" y="5" width="12" height="16" rx="2" />
      {/* Card front (offset) */}
      <rect x="7" y="3" width="12" height="16" rx="2" />
      {/* Arrow up = draw */}
      <path d="M13 7v6M10 10l3-3 3 3" />
    </svg>
  )
}
