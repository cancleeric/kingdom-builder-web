import type { SVGProps } from 'react'

export function LeaderboardIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Podium bars */}
      <rect x="2" y="12" width="5" height="9" />
      <rect x="9.5" y="7" width="5" height="14" />
      <rect x="17" y="15" width="5" height="6" />
      {/* Rank numbers hint lines */}
      <line x1="4.5" y1="10" x2="4.5" y2="12" />
      <line x1="12" y1="5" x2="12" y2="7" />
      <line x1="19.5" y1="13" x2="19.5" y2="15" />
    </svg>
  )
}
