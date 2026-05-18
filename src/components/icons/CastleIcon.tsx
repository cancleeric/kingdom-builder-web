import type { SVGProps } from 'react'

export function CastleIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Base wall */}
      <rect x="3" y="11" width="18" height="10" rx="0.5" />
      {/* Gate */}
      <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
      {/* Left tower */}
      <rect x="2" y="6" width="5" height="6" />
      {/* Right tower */}
      <rect x="17" y="6" width="5" height="6" />
      {/* Left battlement */}
      <path d="M2 6V4h1.5V6M4.5 6V4H6V6" />
      {/* Right battlement */}
      <path d="M17 6V4h1.5V6M19.5 6V4H21V6" />
      {/* Center battlement */}
      <path d="M9 11V9h1.5v2M11.5 11V9H13v2M14 11V9h1.5v2" />
    </svg>
  )
}
