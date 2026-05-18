import type { SVGProps } from 'react'

export function OasisIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Palm trunk */}
      <path d="M12 21v-9" />
      {/* Palm trunk curve */}
      <path d="M12 12c0-4 2-6 2-6" />
      {/* Palm fronds left */}
      <path d="M12 9c-1-3-4-4-5-3" />
      <path d="M12 7c-2-2-5-1-6 1" />
      {/* Palm fronds right */}
      <path d="M12 9c1-3 4-4 5-3" />
      <path d="M12 7c2-2 5-1 6 1" />
      {/* Water pool */}
      <ellipse cx="12" cy="20" rx="5" ry="1.5" />
    </svg>
  )
}
