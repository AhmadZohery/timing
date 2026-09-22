import React from 'react';
import { GymFaithAudioPlayer } from './GymFaithAudioPlayer';

interface FaithAudioSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardToast?: (msg: string) => void;
}

export const FaithAudioSanctuaryModal: React.FC<FaithAudioSanctuaryModalProps> = ({
  isOpen,
  onClose,
  onRewardToast,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="أثير الوعي والدروس الإيمانية والفكرية"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        data-no-swipe="true"
      >
        <GymFaithAudioPlayer
          className="shadow-2xl border-2 border-amber-500/30 dark:border-amber-500/25 bg-white dark:bg-[#12131A]"
          onRewardToast={onRewardToast}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
