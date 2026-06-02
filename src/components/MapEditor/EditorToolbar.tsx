import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BoardSize } from '../../types/index';

interface EditorToolbarProps {
  boardSize: BoardSize;
  onBoardSizeChange: (size: BoardSize) => void;
  onClearAll: () => void;
  onSave: (name: string) => void;
  saveError: string | null;
  shareCode: string | null;
  onOpenList: () => void;
  onOpenImport: () => void;
}

const chipStyle: React.CSSProperties = {
  backgroundColor: 'var(--chip-bg)',
  color: 'var(--chip-text)',
  border: '1px solid var(--card-border)',
  borderRadius: 20,
  padding: '6px 14px',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  cursor: 'pointer',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--type-label)',
  color: 'var(--color-stone-600)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: '0.35rem',
};

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  boardSize,
  onBoardSizeChange,
  onClearAll,
  onSave,
  saveError,
  shareCode,
  onOpenList,
  onOpenImport,
}) => {
  const { t } = useTranslation();
  const [mapName, setMapName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as BoardSize;
    if (window.confirm(t('mapEditor.boardSizeChangeConfirm'))) {
      onBoardSizeChange(next);
    }
  };

  const handleClearAll = () => {
    if (window.confirm(t('mapEditor.clearAllConfirm'))) {
      onClearAll();
    }
  };

  const handleSave = () => {
    onSave(mapName.trim() || 'My Map');
    setMapName('');
  };

  const handleCopy = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Board Size */}
      <div>
        <span style={labelStyle}>{t('mapEditor.boardSize')}</span>
        <select
          value={boardSize}
          onChange={handleSizeChange}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--card-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
          }}
        >
          <option value="small">Small (12×12)</option>
          <option value="medium">Medium (16×16)</option>
          <option value="large">Large (20×20)</option>
        </select>
      </div>

      {/* Save Map */}
      <div>
        <span style={labelStyle}>{t('mapEditor.saveMap')}</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            placeholder={t('mapEditor.mapNamePlaceholder')}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--card-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              minWidth: 0,
            }}
          />
          <button
            onClick={handleSave}
            style={{
              backgroundColor: 'var(--button-primary-bg)',
              color: 'var(--button-text)',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {t('mapEditor.saveMap')}
          </button>
        </div>
        {saveError && (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
            {saveError}
          </p>
        )}
      </div>

      {/* Share Code */}
      {shareCode && (
        <div>
          <span style={labelStyle}>{t('mapEditor.exportCode')}</span>
          <textarea
            readOnly
            value={shareCode}
            rows={3}
            style={{
              width: '100%',
              resize: 'none',
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--card-border)',
              backgroundColor: 'var(--color-warm-cream-100)',
              color: 'var(--color-stone-800)',
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              wordBreak: 'break-all',
              boxSizing: 'border-box',
            }}
          />
          <button onClick={handleCopy} style={{ ...chipStyle, marginTop: '0.35rem' }}>
            {copied ? t('mapEditor.copiedCode') : t('mapEditor.copyCode')}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button onClick={onOpenList} style={chipStyle}>
          {t('mapEditor.openList')}
        </button>
        <button onClick={onOpenImport} style={chipStyle}>
          {t('mapEditor.importCode')}
        </button>
        <button
          onClick={handleClearAll}
          style={{
            ...chipStyle,
            color: 'var(--color-danger)',
            borderColor: 'var(--color-danger)',
          }}
        >
          {t('mapEditor.clearAll')}
        </button>
      </div>
    </div>
  );
};
