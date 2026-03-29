import React from 'react';

/**
 * Skeleton placeholder shown while the game board is initializing.
 * Uses CSS pulse animation to indicate loading state.
 */
export const BoardSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100" aria-label="Loading board…" role="status">
      <div className="flex flex-col gap-4 items-center">
        {/* Simulated hex rows */}
        {Array.from({ length: 5 }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-2" style={{ marginLeft: rowIdx % 2 === 1 ? 24 : 0 }}>
            {Array.from({ length: 8 }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="animate-pulse bg-gray-300 rounded"
                style={{ width: 52, height: 46 }}
              />
            ))}
          </div>
        ))}
        <p className="text-gray-400 text-sm mt-2">Loading board…</p>
      </div>
    </div>
  );
};
