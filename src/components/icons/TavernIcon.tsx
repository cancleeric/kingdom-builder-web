import type { SVGProps } from 'react'

export function TavernIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Mug body */}
      <path d="M6 7h10l-1.5 11H7.5L6 7z" />
      {/* Mug handle */}
      <path d="M16 9h2a2 2 0 0 1 0 4h-2" />
      {/* Foam top */}
      <path d="M6 7c0-1.5 1-2 2-2s2 .5 2 1.5 1-1.5 2-1.5 2 .5 2 2" />
      {/* Mug base */}
      <line x1="5.5" y1="18" x2="18.5" y2="18" />
    </svg>
  )
}
