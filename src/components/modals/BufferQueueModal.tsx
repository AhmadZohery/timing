import React from 'react';
import {
  X,
  Clock,
  CheckCircle,
  Calendar,
  AlertCircle,
  Gift,
  ShieldCheck,
} from 'lucide-react';
import type { BufferItem } from '../../types';
import { db } from '../../db/db';
import { soundSynth } from '../../services/soundSynthesizer';
import { haptic } from '../../services/vibrationService';
import { useTranslation } from '../../i18n/LanguageContext';

interface BufferQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  bufferItems: BufferItem[];
  weeklyBufferCount: number;
}

export const BufferQueueModal: React.FC<BufferQueueModalProps> = ({
  isOpen,
  onClose,
  bufferItems,
  weeklyBufferCount,
}) => {
  const { t, language } = useTranslation();

  if (!isOpen) return null;

  const pendingItems = bufferItems.filter((item) => item.status === 'pending');
  const resolvedItems = bufferItems.filter((item) => item.status === 'resolved');

  const handleResolveTask = async (id: string) => {
    soundSynth.playCompletionChime();
    haptic.vibrateWorkDone();
    await db.buffer_queue.update(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in transition-colors duration-200">
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={() => {
          soundSynth.playTactileClick();
          haptic.vibrateLight();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 start-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              {t('buffer_modal_title')}
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t('buffer_modal_sub')}
            </p>
          </div>
        </div>

        {/* Behavioral Rule Box */}
        <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-zinc-950 border border-amber-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 space-y-2 leading-relaxed">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-400 font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('buffer_streak_protection')}</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 font-mono font-bold">
              {t('buffer_count_label')} {weeklyBufferCount}/2
            </span>
          </div>
          <p className="text-slate-600 dark:text-zinc-400">
            {t('buffer_explanation')}
          </p>
        </div>

        {/* Pending Items List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{language === 'ar' ? `المهام المعلقة في البافر (${pendingItems.length})` : `Pending Buffer Tasks (${pendingItems.length})`}</span>
          </h4>

          {pendingItems.length === 0 ? (
            <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-2">
              <div className="inline-flex p-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <Gift className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {t('buffer_empty_title')}
              </h5>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 max-w-sm mx-auto">
                {t('buffer_empty_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-zinc-200">{item.taskTitle}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{item.originalDate}</span>
                      </span>
                      <span>•</span>
                      <span>{item.durationMin} {language === 'ar' ? 'دقيقة' : 'min'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolveTask(item.id)}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t('buffer_resolve_btn')}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved History */}
        {resolvedItems.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">{language === 'ar' ? 'المهام المنجزة مؤخراً في البافر:' : 'Recently Resolved in Buffer:'}</h4>
            <div className="space-y-1.5 opacity-75">
              {resolvedItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/60 text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between"
                >
                  <span className="line-through">{item.taskTitle}</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">✔ Done</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
