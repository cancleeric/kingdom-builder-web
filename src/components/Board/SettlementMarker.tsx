import React from 'react';

interface SettlementMarkerProps {
  cx: number;
  cy: number;
  playerColor: string;
  isRecentlyPlaced?: boolean;
}

export const SettlementMarker: React.FC<SettlementMarkerProps> = ({
  cx,
  cy,
  playerColor,
  isRecentlyPlaced,
}) => {
  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      pointerEvents="none"
      className={isRecentlyPlaced ? 'animate-settlement-drop' : undefined}
    >
      {/* Ring radiate: expands outward and fades (only when recently placed) */}
      {isRecentlyPlaced && (
        <circle
          cx={0}
          cy={0}
          r={0}
          fill="none"
          stroke={playerColor}
          strokeWidth={2}
          className="animate-settlement-ring"
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* House group with drop-shadow for depth */}
      <g filter="drop-shadow(0 1px 2px rgba(0,0,0,0.35))">
        {/* Roof: isosceles triangle, apex pointing up */}
        <polygon
          points="-7,0 7,0 0,-9"
          fill={playerColor}
          stroke="#1a1a1a"
          strokeWidth={1.5}
        />
        {/* Wall: rectangle below roof */}
        <rect
          x={-5.5}
          y={0}
          width={11}
          height={8}
          fill={playerColor}
          stroke="#1a1a1a"
          strokeWidth={1.5}
        />
        {/* Door: dark cutout centered at bottom of wall */}
        <rect
          x={-2}
          y={3}
          width={4}
          height={5}
          fill="#1a1a1a"
        />
      </g>
    </g>
  );
};

SettlementMarker.displayName = 'SettlementMarker';
