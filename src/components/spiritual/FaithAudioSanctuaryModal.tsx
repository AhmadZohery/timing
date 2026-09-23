import React from 'react';
import { MobileAudioSanctuaryView } from './MobileAudioSanctuaryView';

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
      aria-label="أثير الوعي والخطب الإيمانية"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-no-swipe="true"
      >
        <MobileAudioSanctuaryView
          onClose={onClose}
          onRewardToast={onRewardToast}
        />
      </div>
    </div>
  );
};
