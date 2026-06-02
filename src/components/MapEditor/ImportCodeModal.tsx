import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalFrame } from '../UI/ModalFrame';
import { useCustomMapStore } from '../../mapEditor/customMapStore';
import { CustomMapRecord } from '../../mapEditor/types';

interface ImportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (record: CustomMapRecord) => void;
}

export const ImportCodeModal: React.FC<ImportCodeModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    const record = useCustomMapStore.getState().importFromShareCode(code.trim());
    if (record) {
      setCode('');
      setError(null);
      onImportSuccess(record);
      onClose();
    } else {
      setError(t('mapEditor.importFailed'));
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    onClose();
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel={t('mapEditor.importCode')}
      title={t('mapEditor.importCode')}
    >
      <div className="flex flex-col gap-3">
        <textarea
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(null); }}
          placeholder={t('mapEditor.importPlaceholder')}
          rows={4}
          style={{
            width: '100%',
            resize: 'vertical',
            padding: '8px 12px',
            borderRadius: 8,
            border: error ? '1px solid var(--color-danger)' : '1px solid var(--card-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', fontFamily: 'var(--font-body)' }}>
            {error}
          </p>
        )}
        <button
          onClick={handleImport}
          disabled={!code.trim()}
          style={{
            backgroundColor: 'var(--button-primary-bg)',
            color: 'var(--button-text)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: code.trim() ? 'pointer' : 'not-allowed',
            opacity: code.trim() ? 1 : 0.5,
          }}
        >
          {t('mapEditor.importBtn')}
        </button>
      </div>
    </ModalFrame>
  );
};
