import type { SVGProps } from 'react'

export function PaddockIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Horse head */}
      <path d="M14 4c0 0 2 0 3 2l1 3-2 1" />
      {/* Horse neck & mane */}
      <path d="M14 4c-1 0-2 1-2 3v1" />
      <path d="M15 4.5c0 1-1 2-1 3" />
      {/* Horse body */}
      <ellipse cx="10" cy="13" rx="5" ry="3.5" />
      {/* Horse head connect */}
      <path d="M12 8c-1 1-2 2-2 5" />
      {/* Legs */}
      <line x1="7" y1="16" x2="6.5" y2="20" />
      <line x1="9" y1="16.5" x2="8.5" y2="20" />
      <line x1="11" y1="16.5" x2="11.5" y2="20" />
      <line x1="13" y1="16" x2="13.5" y2="20" />
      {/* Tail */}
      <path d="M5 12c-1 0-2 1-1.5 3" />
      {/* Ground */}
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  )
}
