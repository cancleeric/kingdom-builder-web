import type { SVGProps } from 'react'

export function ChevronIcon({
  size = 24,
  direction = 'right',
  ...props
}: { size?: number; direction?: 'up' | 'down' | 'left' | 'right' } & SVGProps<SVGSVGElement>) {
  const rotateMap = { right: 0, down: 90, left: 180, up: 270 }
  const rotate = rotateMap[direction]

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
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
      {...props}
    >
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}
