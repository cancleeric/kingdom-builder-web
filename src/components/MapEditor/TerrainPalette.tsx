import React from 'react';
import { useTranslation } from 'react-i18next';
import { Terrain, Location, getTerrainColor } from '../../core/terrain';

interface TerrainPaletteProps {
  selectedTerrain: Terrain | null;
  selectedLocation: Location | null;
  onSelectTerrain: (t: Terrain) => void;
  onSelectLocation: (l: Location) => void;
}

const TERRAIN_EMOJI: Record<Terrain, string> = {
  [Terrain.Grass]: '🌿',
  [Terrain.Forest]: '🌲',
  [Terrain.Desert]: '🏜️',
  [Terrain.Flower]: '🌸',
  [Terrain.Canyon]: '🪨',
  [Terrain.Water]: '💧',
  [Terrain.Mountain]: '⛰️',
};

const ALL_TERRAINS: Terrain[] = [
  Terrain.Grass,
  Terrain.Forest,
  Terrain.Desert,
  Terrain.Flower,
  Terrain.Canyon,
  Terrain.Water,
  Terrain.Mountain,
];

const ALL_LOCATIONS: Location[] = [
  Location.Castle,
  Location.Farm,
  Location.Oasis,
  Location.Tower,
  Location.Harbor,
  Location.Paddock,
  Location.Barn,
  Location.Oracle,
  Location.Tavern,
];

/** Determine whether to use white or black text on a given hex color */
function contrastColor(hexColor: string): string {
  // Parse r,g,b from #rrggbb
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1a1a1a' : '#ffffff';
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 'var(--type-label)',
  color: 'var(--color-stone-600)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.5rem',
  display: 'block',
};

export const TerrainPalette: React.FC<TerrainPaletteProps> = ({
  selectedTerrain,
  selectedLocation,
  onSelectTerrain,
  onSelectLocation,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {/* Terrain section */}
      <div>
        <span style={sectionLabelStyle}>{t('mapEditor.sectionTerrain')}</span>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TERRAINS.map((terrain) => {
            const bg = getTerrainColor(terrain);
            const fg = contrastColor(bg);
            const isSelected = selectedTerrain === terrain;
            return (
              <button
                key={terrain}
                onClick={() => onSelectTerrain(terrain)}
                title={t(`terrain.${terrain}`)}
                style={{
                  background: bg,
                  color: fg,
                  border: isSelected ? '2px solid var(--color-wine-600)' : '2px solid transparent',
                  boxShadow: isSelected ? 'var(--shadow-soft)' : undefined,
                  borderRadius: 8,
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'box-shadow 0.15s',
                }}
              >
                <span>{TERRAIN_EMOJI[terrain]}</span>
                <span>{t(`terrain.${terrain}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Location section */}
      <div>
        <span style={sectionLabelStyle}>{t('mapEditor.sectionLocation')}</span>
        <div className="flex flex-wrap gap-1.5">
          {ALL_LOCATIONS.map((loc) => {
            const isSelected = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => onSelectLocation(loc)}
                title={t(`location.${loc}`)}
                style={{
                  background: 'var(--color-warm-cream-100)',
                  color: 'var(--color-stone-800)',
                  border: isSelected ? '2px solid var(--color-wine-600)' : '2px solid var(--card-border)',
                  boxShadow: isSelected ? 'var(--shadow-soft)' : undefined,
                  borderRadius: 8,
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'box-shadow 0.15s',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--color-wine-600)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {loc[0]}
                </span>
                <span>{t(`location.${loc}`)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
