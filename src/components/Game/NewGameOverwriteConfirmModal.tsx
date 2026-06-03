import { useTranslation } from 'react-i18next';

interface NewGameOverwriteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * NewGameOverwriteConfirmModal — shown when player tries to start a new single-player
 * game while an existing save is present.
 *
 * Pattern: mirrors QuitToMenuConfirmModal (same design tokens, same z-index tier)
 * z-index: z-[52] — above more-menu backdrop (z-40) and menu panel (z-50)
 */
export function NewGameOverwriteConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: NewGameOverwriteConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[51]"
        style={{ backgroundColor: 'oklch(0 0 0 / 0.55)' }}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('newGameOverwrite.title')}
        className="fixed inset-0 z-[52] flex items-center justify-center px-4"
      >
        <div
          className="relative w-full max-w-sm rounded-[var(--radius-14)] overflow-hidden animate-modal-enter"
          style={{
            backgroundColor: 'var(--color-surface)',
            boxShadow: 'var(--shadow-lifted)',
            border: '1px solid var(--card-border)',
          }}
        >
          {/* 4px wine accent rail */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: 4,
              backgroundColor: 'var(--color-wine-600)',
              borderTopLeftRadius: 'var(--radius-14)',
              borderBottomLeftRadius: 'var(--radius-14)',
            }}
          />

          {/* Content */}
          <div className="px-6 py-6" style={{ paddingLeft: '1.75rem' }}>
            <h2
              className="font-bold mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--type-display-sm)',
                lineHeight: 'var(--line-height-display)',
                color: 'var(--color-text)',
              }}
            >
              {t('newGameOverwrite.title')}
            </h2>

            <p
              className="mb-6 text-sm"
              style={{
                color: 'var(--color-stone-600)',
                lineHeight: 'var(--line-height-body)',
              }}
            >
              {t('newGameOverwrite.body')}
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
                style={{
                  border: '1px solid var(--card-border)',
                  color: 'var(--color-stone-600)',
                  backgroundColor: 'transparent',
                }}
              >
                {t('newGameOverwrite.cancel')}
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{
                  backgroundColor: 'var(--color-wine-600)',
                  color: 'var(--button-text)',
                }}
              >
                {t('newGameOverwrite.confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
