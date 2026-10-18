import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t, isRTL } = useTranslation();

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', '+', 'K'], label: isRTL ? 'لوحة الأوامر والبحث السريع' : 'Quick Command Palette' },
    { keys: ['1', '–', '6'], label: t('shortcut_station_1_6') },
    { keys: ['P'], label: t('shortcut_panic') },
    { keys: ['B'], label: t('shortcut_buffer') },
    { keys: ['G'], label: t('shortcut_goals') },
    { keys: ['C'], label: t('shortcut_crm') },
    { keys: ['S'], label: t('shortcut_settings') },
    { keys: ['?'], label: t('shortcut_help') },
    { keys: ['Esc'], label: t('shortcut_close') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in transition-colors" role="dialog" aria-modal="true" aria-labelledby="shortcuts-modal-title">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-3xl modal-surface border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        <div className="p-5 celestial-obsidian-stage border-b border-white/10 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0 shadow-inner">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h3 id="shortcuts-modal-title" className="text-base font-bold text-white">
                {t('shortcuts_modal_title')}
              </h3>
              <p className="text-xs text-indigo-200 font-medium">
                {t('shortcuts_modal_sub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            {shortcuts.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl surface-card-3d text-xs text-slate-700 dark:text-zinc-300"
              >
                <span>{item.label}</span>
                <div className="flex items-center gap-1">
                  {item.keys.map((k, kIdx) => (
                    <kbd
                      key={kIdx}
                      className="min-w-[24px] px-2 py-1 text-center text-[11px] font-mono font-bold bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md shadow-2xs text-slate-900 dark:text-zinc-100"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            <span>{isRTL ? 'تعمل الاختصارات فورياً أثناء عدم الكتابة في الحقول' : 'Shortcuts are active when not typing inside input fields'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
