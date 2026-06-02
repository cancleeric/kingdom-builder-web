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
  );
};

SettlementMarker.displayName = 'SettlementMarker';
