import React from 'react';
import { useTranslation } from 'react-i18next';
import { useReplayStore } from '../../store/replayStore';
import { ReplayList } from './ReplayList';
import { ReplayViewer } from './ReplayViewer';

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReplayModal = React.memo(function ReplayModal({ isOpen, onClose }: ReplayModalProps) {
  const { t } = useTranslation();
  const replays = useReplayStore((s) => s.replays);
  const selectedReplayId = useReplayStore((s) => s.selectedReplayId);
  const selectReplay = useReplayStore((s) => s.selectReplay);
  const deleteReplay = useReplayStore((s) => s.deleteReplay);

  if (!isOpen) return null;

  const selectedReplay = replays.find((r) => r.id === selectedReplayId) ?? null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('replay.heading')}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold">{t('replay.heading')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            aria-label={t('replay.close')}
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedReplay ? (
            <ReplayViewer
              replay={selectedReplay}
              onBack={() => selectReplay(null)}
            />
          ) : (
            <ReplayList
              replays={replays}
              onSelect={(id) => selectReplay(id)}
              onDelete={(id) => deleteReplay(id)}
            />
          )}
        </div>
      </div>
    </div>
  );
});
