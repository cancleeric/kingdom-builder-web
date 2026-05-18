import type { SVGProps } from 'react'

export function AchievementIcon({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
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
      {/* Medal circle */}
      <circle cx="12" cy="9" r="6" />
      {/* Star inside medal */}
      <path d="M12 6l1 2.5h2.5l-2 1.5.8 2.5L12 11l-2.3 1.5.8-2.5-2-1.5H11z" />
      {/* Ribbon left */}
      <path d="M8 14l-2 7 6-3" />
      {/* Ribbon right */}
      <path d="M16 14l2 7-6-3" />
    </svg>
  )
}
