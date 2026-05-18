import type { SVGProps } from 'react'

export function BotIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Head */}
      <rect x="4" y="7" width="16" height="11" rx="2" />
      {/* Antenna */}
      <line x1="12" y1="3" x2="12" y2="7" />
      <circle cx="12" cy="3" r="1" />
      {/* Eyes */}
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      {/* Mouth */}
      <path d="M9 15.5h6" />
      {/* Ear connectors */}
      <line x1="4" y1="11" x2="2" y2="11" />
      <line x1="20" y1="11" x2="22" y2="11" />
    </svg>
  )
}
