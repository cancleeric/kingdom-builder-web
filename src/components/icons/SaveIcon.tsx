import type { SVGProps } from 'react'

export function SaveIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Floppy disk outer */}
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      {/* Label slot */}
      <rect x="7" y="3" width="7" height="5" />
      {/* Read head slot */}
      <rect x="9" y="13" width="6" height="6" />
    </svg>
  )
}
