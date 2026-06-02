import React from 'react';
import { Location } from '../../core/terrain';

interface LocationMarkerProps {
  cx: number;
  cy: number;
  location: Location;
  hasSettlement?: boolean;
}

const ICON_SIZE = 16;
const HALF = ICON_SIZE / 2;

/**
 * Renders the location icon for a hex cell inside the board SVG.
 * Uses nested <svg> with viewBox="0 0 24 24" so icon paths render at correct
 * proportions without manual scale transforms.
 *
 * Colour strategy: stroke="#1a1a1a" fill="white" ensures visibility on all
 * terrain backgrounds (Forest #228B22, Canyon #D2691E, Water #4682B4, etc.).
 *
 * pointerEvents="none" prevents the marker from intercepting cell clicks.
 */
export const LocationMarker: React.FC<LocationMarkerProps> = ({
  cx,
  cy,
  location,
  hasSettlement = false,
}) => {
  const offsetY = hasSettlement ? 8 : 0;
  const x = cx - HALF;
  const y = cy + offsetY - HALF;

  const commonProps = {
    fill: 'none',
    stroke: '#1a1a1a',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const renderPaths = () => {
    switch (location) {
      case Location.Castle:
        return (
          <>
            <rect x="3" y="11" width="18" height="10" rx="0.5" {...commonProps} />
            <path d="M9 21v-5a3 3 0 0 1 6 0v5" {...commonProps} />
            <rect x="2" y="6" width="5" height="6" {...commonProps} />
            <rect x="17" y="6" width="5" height="6" {...commonProps} />
            <path d="M2 6V4h1.5V6M4.5 6V4H6V6" {...commonProps} />
            <path d="M17 6V4h1.5V6M19.5 6V4H21V6" {...commonProps} />
            <path d="M9 11V9h1.5v2M11.5 11V9H13v2M14 11V9h1.5v2" {...commonProps} />
          </>
        );
      case Location.Farm:
        return (
          <>
            <path d="M2 10L12 3l10 7" {...commonProps} />
            <rect x="4" y="10" width="16" height="11" {...commonProps} />
            <path d="M9 21v-6h6v6" {...commonProps} />
            <path d="M10.5 10v-2a1.5 1.5 0 0 1 3 0v2" {...commonProps} />
            <path d="M1 21c0-2 1-3 1-3s1 1 1 3" {...commonProps} />
            <path d="M21 21c0-2 1-3 1-3s1 1 1 3" {...commonProps} />
          </>
        );
      case Location.Oasis:
        return (
          <>
            <path d="M12 21v-9" {...commonProps} />
            <path d="M12 12c0-4 2-6 2-6" {...commonProps} />
            <path d="M12 9c-1-3-4-4-5-3" {...commonProps} />
            <path d="M12 7c-2-2-5-1-6 1" {...commonProps} />
            <path d="M12 9c1-3 4-4 5-3" {...commonProps} />
            <path d="M12 7c2-2 5-1 6 1" {...commonProps} />
            <ellipse cx="12" cy="20" rx="5" ry="1.5" {...commonProps} />
          </>
        );
      case Location.Tower:
        return (
          <>
            <rect x="7" y="7" width="10" height="14" {...commonProps} />
            <path d="M7 7V5h1.5v2M10.5 7V5H12v2M13 7V5h1.5v2M16.5 7V5H18v2" {...commonProps} />
            <line x1="7" y1="13" x2="17" y2="13" {...commonProps} />
            <path d="M10 10h4" {...commonProps} />
            <rect x="10.5" y="9" width="3" height="3" rx="0.5" {...commonProps} />
            <path d="M10 21v-4a2 2 0 0 1 4 0v4" {...commonProps} />
            <line x1="5" y1="21" x2="19" y2="21" {...commonProps} />
          </>
        );
      case Location.Harbor:
        return (
          <>
            <circle cx="12" cy="5" r="2" {...commonProps} />
            <line x1="12" y1="7" x2="12" y2="19" {...commonProps} />
            <line x1="7" y1="10" x2="17" y2="10" {...commonProps} />
            <path d="M7 19c0-2.5 2-4 5-4" {...commonProps} />
            <path d="M17 19c0-2.5-2-4-5-4" {...commonProps} />
            <path d="M3 21c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0" {...commonProps} />
          </>
        );
      case Location.Paddock:
        return (
          <>
            <path d="M14 4c0 0 2 0 3 2l1 3-2 1" {...commonProps} />
            <path d="M14 4c-1 0-2 1-2 3v1" {...commonProps} />
            <path d="M15 4.5c0 1-1 2-1 3" {...commonProps} />
            <ellipse cx="10" cy="13" rx="5" ry="3.5" {...commonProps} />
            <path d="M12 8c-1 1-2 2-2 5" {...commonProps} />
            <line x1="7" y1="16" x2="6.5" y2="20" {...commonProps} />
            <line x1="9" y1="16.5" x2="8.5" y2="20" {...commonProps} />
            <line x1="11" y1="16.5" x2="11.5" y2="20" {...commonProps} />
            <line x1="13" y1="16" x2="13.5" y2="20" {...commonProps} />
            <path d="M5 12c-1 0-2 1-1.5 3" {...commonProps} />
            <line x1="4" y1="20" x2="20" y2="20" {...commonProps} />
          </>
        );
      case Location.Barn:
        return (
          <>
            <path d="M2 12L6 8l3 3" {...commonProps} />
            <path d="M22 12l-4-4-3 3" {...commonProps} />
            <path d="M9 11l3-3 3 3" {...commonProps} />
            <rect x="3" y="12" width="18" height="9" {...commonProps} />
            <path d="M9 21v-5h6v5" {...commonProps} />
            <line x1="12" y1="16" x2="12" y2="21" {...commonProps} />
            <rect x="4.5" y="14" width="2.5" height="2.5" {...commonProps} />
            <rect x="17" y="14" width="2.5" height="2.5" {...commonProps} />
            <line x1="3" y1="12" x2="21" y2="12" {...commonProps} />
          </>
        );
      case Location.Oracle:
        return (
          <>
            <circle cx="12" cy="13" r="7" {...commonProps} />
            <path d="M8 11c1-2 3-3 4-2" {...commonProps} />
            <path d="M9 14c1-1 2-1 3-0.5" {...commonProps} />
            <path d="M8 20h8" {...commonProps} />
            <line x1="12" y1="20" x2="12" y2="22" {...commonProps} />
            <path d="M9 22h6" {...commonProps} />
            <path d="M6 4l0.5 1 1 0.5-1 0.5L6 7l-0.5-1.5L4 5l1.5-0.5z" {...commonProps} />
            <path d="M18 3l0.4 0.8 0.8 0.4-0.8 0.4L18 5.4l-0.4-0.8L16.8 4.2l0.8-0.4z" {...commonProps} />
          </>
        );
      case Location.Tavern:
        return (
          <>
            <path d="M6 7h10l-1.5 11H7.5L6 7z" {...commonProps} />
            <path d="M16 9h2a2 2 0 0 1 0 4h-2" {...commonProps} />
            <path d="M6 7c0-1.5 1-2 2-2s2 .5 2 1.5 1-1.5 2-1.5 2 .5 2 2" {...commonProps} />
            <line x1="5.5" y1="18" x2="18.5" y2="18" {...commonProps} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <g pointerEvents="none">
      {/* White background circle for contrast on dark terrains */}
      <circle
        cx={cx}
        cy={cy + offsetY}
        r={HALF + 1}
        fill="white"
        fillOpacity={0.75}
        stroke="none"
      />
      <svg
        x={x}
        y={y}
        width={ICON_SIZE}
        height={ICON_SIZE}
        viewBox="0 0 24 24"
        overflow="visible"
      >
        {renderPaths()}
      </svg>
    </g>
  );
};

LocationMarker.displayName = 'LocationMarker';
