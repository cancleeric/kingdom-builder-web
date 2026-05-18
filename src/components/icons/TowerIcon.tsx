import type { SVGProps } from 'react'

export function TowerIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Tower body */}
      <rect x="7" y="7" width="10" height="14" />
      {/* Battlement top */}
      <path d="M7 7V5h1.5v2M10.5 7V5H12v2M13 7V5h1.5v2M16.5 7V5H18v2" />
      {/* Horizontal belt */}
      <line x1="7" y1="13" x2="17" y2="13" />
      {/* Window top */}
      <path d="M10 10h4" />
      {/* Arrow slit / window */}
      <rect x="10.5" y="9" width="3" height="3" rx="0.5" />
      {/* Door */}
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
      {/* Ground line */}
      <line x1="5" y1="21" x2="19" y2="21" />
    </svg>
  )
}
