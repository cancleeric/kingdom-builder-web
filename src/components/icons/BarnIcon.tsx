import type { SVGProps } from 'react'

export function BarnIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Gambrel roof left slope */}
      <path d="M2 12L6 8l3 3" />
      {/* Gambrel roof right slope */}
      <path d="M22 12l-4-4-3 3" />
      {/* Gambrel roof ridge */}
      <path d="M9 11l3-3 3 3" />
      {/* Barn walls */}
      <rect x="3" y="12" width="18" height="9" />
      {/* Barn door (double) */}
      <path d="M9 21v-5h6v5" />
      <line x1="12" y1="16" x2="12" y2="21" />
      {/* Side window */}
      <rect x="4.5" y="14" width="2.5" height="2.5" />
      <rect x="17" y="14" width="2.5" height="2.5" />
      {/* Roof trim */}
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  )
}
