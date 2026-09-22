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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in transition-colors">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 space-y-5 shadow-2xl">
        <button
          onClick={onClose}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shrink-0">
            <Command className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              {t('shortcuts_modal_title')}
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {t('shortcuts_modal_sub')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300"
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
  );
};
