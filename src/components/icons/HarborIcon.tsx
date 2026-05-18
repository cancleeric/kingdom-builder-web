import type { SVGProps } from 'react'

export function HarborIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Anchor ring */}
      <circle cx="12" cy="5" r="2" />
      {/* Anchor vertical shaft */}
      <line x1="12" y1="7" x2="12" y2="19" />
      {/* Anchor crossbar */}
      <line x1="7" y1="10" x2="17" y2="10" />
      {/* Anchor curved arms */}
      <path d="M7 19c0-2.5 2-4 5-4" />
      <path d="M17 19c0-2.5-2-4-5-4" />
      {/* Water waves */}
      <path d="M3 21c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0" />
    </svg>
  )
}
