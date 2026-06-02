import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Board } from '../../core/board';
import { Terrain, Location } from '../../core/terrain';
import { AxialCoord, hexToKey } from '../../core/hex';
import { HexGrid } from '../Board/HexGrid';
import { TerrainPalette } from './TerrainPalette';
import { EditorToolbar } from './EditorToolbar';
import { MapListModal } from './MapListModal';
import { ImportCodeModal } from './ImportCodeModal';
import { createBlankBoard } from '../../mapEditor/editorBoard';
import { useCustomMapStore } from '../../mapEditor/customMapStore';
import { CustomMapPayload, CustomMapRecord } from '../../mapEditor/types';
import { BoardSize } from '../../types/index';

interface MapEditorPageProps {
  onBack: () => void;
}

export const MapEditorPage: React.FC<MapEditorPageProps> = ({ onBack }) => {
  const { t } = useTranslation();

  const [boardSize, setBoardSize] = useState<BoardSize>('medium');
  const [board, setBoard] = useState<Board>(() => createBlankBoard('medium'));
  const [selectedTerrain, setSelectedTerrain] = useState<Terrain | null>(Terrain.Grass);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapListOpen, setMapListOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'paint' | 'pan'>('paint');

  const handleSelectTerrain = (t: Terrain) => {
    setSelectedTerrain(t);
    setSelectedLocation(null);
  };

  const handleSelectLocation = (l: Location) => {
    setSelectedLocation(l);
    setSelectedTerrain(null);
  };

  const handleEditCell = (coord: AxialCoord) => {
    setBoard(prevBoard => {
      const newCells = new Map(prevBoard.cells);
      const key = hexToKey(coord);
      const existing = newCells.get(key);
      if (!existing) return prevBoard;
      const updated = { ...existing };
      if (selectedLocation !== null) {
        updated.location = selectedLocation;
        updated.terrain = existing.terrain;
      } else if (selectedTerrain !== null) {
        updated.terrain = selectedTerrain;
        updated.location = undefined;
      }
      newCells.set(key, updated);
      const newBoard = new Board(prevBoard.width, prevBoard.height);
      newBoard.cells = newCells;
      return newBoard;
    });
  };

  const handleBoardSizeChange = (size: BoardSize) => {
    setBoardSize(size);
    setBoard(createBlankBoard(size));
    setShareCode(null);
  };

  const handleClearAll = () => {
    setBoard(createBlankBoard(boardSize));
    setShareCode(null);
  };

  const handleSave = (name: string) => {
    const payload: CustomMapPayload = {
      v: 1,
      w: board.width,
      h: board.height,
      cells: board.getAllCells().map(c => ({
        q: c.coord.q,
        r: c.coord.r,
        terrain: c.terrain,
        ...(c.location ? { location: c.location } : {}),
      })),
    };
    const record = useCustomMapStore.getState().addMap(name.trim() || 'My Map', payload);
    if (!record) {
      setSaveError(t('mapEditor.maxMapsReached'));
      return;
    }
    const code = useCustomMapStore.getState().exportShareCode(record.id);
    setShareCode(code);
    setSaveError(null);
  };

  const handleLoadMap = (record: CustomMapRecord) => {
    const b = new Board(record.mapData.w, record.mapData.h);
    record.mapData.cells.forEach(c =>
      b.setCell({ coord: { q: c.q, r: c.r }, terrain: c.terrain, location: c.location, settlement: undefined })
    );
    setBoard(b);
    setMapListOpen(false);
  };

  const palette = (
    <TerrainPalette
      selectedTerrain={selectedTerrain}
      selectedLocation={selectedLocation}
      onSelectTerrain={handleSelectTerrain}
      onSelectLocation={handleSelectLocation}
    />
  );

  const toolbar = (
    <EditorToolbar
      boardSize={boardSize}
      onBoardSizeChange={handleBoardSizeChange}
      onClearAll={handleClearAll}
      onSave={handleSave}
      saveError={saveError}
      shareCode={shareCode}
      onOpenList={() => setMapListOpen(true)}
      onOpenImport={() => setImportOpen(true)}
      editMode={editMode}
      onEditModeChange={setEditMode}
    />
  );

  return (
    <div
      className="w-screen h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2 shadow-md flex-shrink-0"
        style={{ backgroundColor: 'var(--button-primary-bg)', color: 'var(--color-warm-cream-50)' }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-warm-cream-50)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← {t('mapEditor.backToMenu')}
        </button>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--type-display-sm)',
            color: 'var(--color-warm-cream-50)',
            margin: 0,
          }}
        >
          {t('mapEditor.title')}
        </h1>
        <div style={{ width: 80 }} aria-hidden="true" />
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: TerrainPalette (desktop only) */}
        <aside
          className="hidden lg:block w-56 overflow-y-auto flex-shrink-0 p-3"
          style={{
            borderRight: '1px solid var(--card-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          {palette}
        </aside>

        {/* Center: HexGrid editable */}
        <div className="flex-1 relative overflow-hidden">
          <HexGrid
            board={board}
            validPlacements={[]}
            selectedCell={null}
            players={[]}
            onCellClick={() => {}}
            onCellSelect={() => {}}
            onEscape={onBack}
            editable={true}
            onEditCellClick={handleEditCell}
            onEditCellPaint={handleEditCell}
            editMode={editMode}
          />
        </div>

        {/* Right: EditorToolbar (desktop only) */}
        <aside
          className="hidden lg:block w-64 overflow-y-auto flex-shrink-0 p-3"
          style={{
            borderLeft: '1px solid var(--card-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          {toolbar}
        </aside>
      </div>

      {/* Mobile bottom panel (< lg) */}
      <div
        className="lg:hidden flex-shrink-0 overflow-x-auto"
        style={{
          borderTop: '1px solid var(--card-border)',
          backgroundColor: 'var(--color-surface)',
          padding: '0.5rem 1rem',
        }}
      >
        <div className="flex gap-3 items-start min-w-max">
          <div style={{ minWidth: 220 }}>{palette}</div>
          <div style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'var(--card-border)', flexShrink: 0 }} />
          <div style={{ minWidth: 220 }}>{toolbar}</div>
        </div>
      </div>

      {/* Modals */}
      <MapListModal
        isOpen={mapListOpen}
        onClose={() => setMapListOpen(false)}
        onLoad={handleLoadMap}
      />
      <ImportCodeModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImportSuccess={handleLoadMap}
      />
    </div>
  );
};
