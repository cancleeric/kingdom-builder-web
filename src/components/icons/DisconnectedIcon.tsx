import type { SVGProps } from 'react'

export function DisconnectedIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* WiFi arcs (faded / broken) */}
      <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeDasharray="3 2" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeDasharray="3 2" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" />
      {/* X slash */}
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}
