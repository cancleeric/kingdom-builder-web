import React from 'react';
import { useTranslation } from 'react-i18next';
import { useReplayStore } from '../../store/replayStore';
import { ReplayList } from './ReplayList';
import { ReplayViewer } from './ReplayViewer';
import { ModalFrame } from '../UI/ModalFrame';

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

  const selectedReplay = replays.find((r) => r.id === selectedReplayId) ?? null;

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('replay.heading')}
      title={t('replay.heading')}
    >
      {selectedReplay ? (
        <ReplayViewer replay={selectedReplay} onBack={() => selectReplay(null)} />
      ) : (
        <ReplayList
          replays={replays}
          onSelect={(id) => selectReplay(id)}
          onDelete={(id) => deleteReplay(id)}
        />
      )}
    </ModalFrame>
  );
});
