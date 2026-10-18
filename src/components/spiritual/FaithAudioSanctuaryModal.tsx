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
      className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-zinc-950/55 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[94vh] rounded-[32px] shadow-[0_28px_80px_-12px_rgba(6,78,59,0.35)] relative my-auto animate-in zoom-in-95 duration-200 overflow-hidden"
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
