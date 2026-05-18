import type { SVGProps } from 'react'

export function EndTurnIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Arrow forward */}
      <path d="M13 5l7 7-7 7" />
      {/* Vertical stop bar */}
      <line x1="19" y1="5" x2="19" y2="19" />
      {/* Tail line */}
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  )
}
