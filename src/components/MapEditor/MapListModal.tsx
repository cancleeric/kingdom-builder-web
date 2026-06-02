import React from 'react';
import { useTranslation } from 'react-i18next';
import { ModalFrame } from '../UI/ModalFrame';
import { useCustomMapStore } from '../../mapEditor/customMapStore';
import { CustomMapRecord } from '../../mapEditor/types';

interface MapListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (record: CustomMapRecord) => void;
}

export const MapListModal: React.FC<MapListModalProps> = ({ isOpen, onClose, onLoad }) => {
  const { t } = useTranslation();
  const maps = useCustomMapStore((s) => s.maps);

  const handleDelete = (id: string) => {
    useCustomMapStore.getState().deleteMap(id);
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('mapEditor.openList')}
      title={t('mapEditor.openList')}
    >
      {maps.length === 0 ? (
        <p style={{ color: 'var(--color-stone-500)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
          {t('mapEditor.noSavedMaps')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {maps.map((record) => (
            <li
              key={record.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--card-border)',
                backgroundColor: 'var(--color-warm-cream-50)',
                gap: 8,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.name}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-stone-500)' }}>
                  {record.createdAt.slice(0, 10)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => { onLoad(record); onClose(); }}
                  style={{
                    backgroundColor: 'var(--button-primary-bg)',
                    color: 'var(--button-text)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('mapEditor.loadMap')}
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t('mapEditor.deleteMap')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ModalFrame>
  );
};
